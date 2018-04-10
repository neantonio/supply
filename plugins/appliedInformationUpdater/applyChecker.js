
let http = require("http");
let querystring = require('querystring');
let dataFormatter = require('./dataFormatter');
let _ = require("lodash");

class emailSender{
    constructor(config, timeout = 0){
        this.config = config;
        // this.mainContactErrorMessage = "Ошибка. Для поставщика не указан основной контакт.";
        this.timeout = timeout;
        this.token;
    }

    __secTimer(sec){
        return new Promise((res, rej) => {
            setTimeout(res, sec*1000);
        })
    }

    __dateToStr(date){
        let d = (new Date(date)) || new Date();
        return d.getFullYear() + "-"+
                (d.getMonth() < 9 ? "0" : "") +(d.getMonth() + 1) + "-" +
                (d.getDate() < 9 ? "0" : "") +d.getDate() + " " +
                (d.getHours() < 9 ? "0" : "") +d.getHours() + ":" +
                (d.getMinutes() < 9 ? "0" : "") +d.getMinutes() + ":" +
                (d.getSeconds() < 9 ? "0" : "") +d.getSeconds() + "." +
                d.getMilliseconds()
    }

    __sendMessage(options, jsonData){
        /*
        const postData = querystring.stringify({
            'msg': 'Hello World!'
        });

        const options = {
            hostname: 'www.google.com',
            port: 80,
            path: '/upload',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        */
        return new Promise( (res, rej) => {
            const req = http.request(options, (response) => {
                //console.log(`STATUS: ${response.statusCode}`);
                //console.log(`HEADERS: ${JSON.stringify(response.headers)}`);
                let data = "";
                response.setEncoding('utf8');
                response.on('data', (chunk) => {
                    data += chunk;
                });
                response.on('end', () => {
                    //console.log('Data transfer complete.');
                    let parseData = JSON.parse(data);
                    if(parseData.status === "success") {
                        res(parseData.message);
                    }
                    else{
                        rej(parseData.message);
                    }
                });
            });

            req.on('error', (e) => {
                //console.error(`problem with request: ${e.message}`);
                rej(e);
            });

            // write data to request body
            req.write(jsonData);
            req.end();
        });
    }

    /**
     * Метод авторизации
     * */
    async __login(n = 0){
        if(n > 10){
            throw 'Невозможно подключиться к удаленному серверу.'
        }

        const jsonData = JSON.stringify({
            user: this.config.user,
            pswd: this.config.password
        });

        const options = {
            hostname: this.config.host,
            port: this.config.port,
            path: '/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(jsonData)
            }
        };

        let loginData;
        try{
            loginData = await this.__sendMessage(options, jsonData);
        }
        catch(e){
            await this.__secTimer(3);
            await this.__login(n + 1);
        }

        this.token = loginData.token;
    }


    __formOptions(data, path = "/cli"){
        return {
            hostname: this.config.host,
            port: this.config.port,
            path: '/cli',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };
    }

    __getFirstValueFromHash(hash){
        return hash && hash[Object.keys(hash)[0]] || null;
    }

    __getFieldValueByName(records, fieldName){
        for(let recordID in records){
            let currentFieldName = this.__getFirstValueFromHash(records[recordID].fields.fieldID).fields.description;
            if(fieldName === currentFieldName){
                return records[recordID].fields.valueOld;
            }
        }
    }

    __getQueryIDFromHistoryInstancesFields(historyInstancesRecord){
        let firstHistoryInstancesRecord = this.__getFirstValueFromHash(historyInstancesRecord);
        let historyInstancesFields = firstHistoryInstancesRecord.refs.history_instances_fields;
        return this.__getFieldValueByName(historyInstancesFields, "queryID");
    }

    __getActionInfoFromHistoryRecord(record){
        let historyInstances = record.refs.history_instances;
        let date = new Date(record.fields.date);
        let userID = record.fields.userID.ID;
        let queryID = this.__getQueryIDFromHistoryInstancesFields(historyInstances);
        return {
          date: date,
          userID: userID,
          queryID: JSON.parse(queryID)
        };
    }

    __checkExtendStructure(structure, keys){
        let currentKey = keys.shift();
        let checkingStructure = structure;
        if(!checkingStructure[currentKey]){
            checkingStructure[currentKey] = {};
        }

        if(keys.length > 0){
            checkingStructure[currentKey] = this.__checkExtendStructure(checkingStructure[currentKey], keys);
        }

        return checkingStructure;
    }

    __checkActionHistory(actionHistory, object, action, queryID){
        return this.__checkExtendStructure(actionHistory, [object, action, queryID]);
    }

    __getActionHistory(history){
        let actionHistory  = {};
        for(let historyID in history){
            let fields = history[historyID].fields;
            let action = this.__getFirstValueFromHash(fields.actionID).fields.description;
            let object = this.__getFirstValueFromHash(fields.objectID).fields.description;
            let actionInfo = this.__getActionInfoFromHistoryRecord(history[historyID]);

            actionHistory = this.__checkActionHistory(actionHistory, object, action, actionInfo.queryID);
            if(!actionHistory[object][action][actionInfo.queryID].date ||
                actionHistory[object][action][actionInfo.queryID].date < actionInfo.date) {
                actionHistory[object][action][actionInfo.queryID] = actionInfo;
            }
        }
        return actionHistory;
    }

    __formFilterForDataFromToBillTab(){
        return {
            comparisons:{
                emptyDirector: {
                    left:{
                        type: "field",
                        value: "directorID.ID"
                    },
                    right: {
                        type: "value",
                        value: ""
                    },
                    sign: "equal"
                },
                emptyControlCompanyUser: {
                    left:{
                        type: "field",
                        value: "controlID.ID"
                    },
                    right: {
                        type: "value",
                        value: ""
                    },
                    sign: "equal"
                }
            },
            tree: {
                or: ["emptyDirector", "emptyControlCompanyUser"]
            }
        }
    }

    async __getQueriesIDsFromToBillTab(){
        let filter = this.__formFilterForDataFromToBillTab();

        const jsonData = JSON.stringify({
            object: "finance.stages_toBill",
            method: "get",
            token: this.token,
            parameters: {
                filter: filter
            }
        });

        const options = this.__formOptions(jsonData);

        let records = await this.__sendMessage(options, jsonData);

        let IDs = [];
        for(let recordID in records.records){
            IDs.push(records.records[recordID].fields.queryID);
        }

        return IDs;
    }


    __formFilterForDataFromControlCompanyTab(){
        return {
            comparisons:{
                emptyDirector: {
                    left:{
                        type: "field",
                        value: "directorID.ID"
                    },
                    right: {
                        type: "value",
                        value: ""
                    },
                    sign: "equal"
                }
            },
            tree: {
                and: ["emptyDirector"]
            }
        }
    }

    async __getQueriesIDsFromControlCompanyTab(){
        let filter = this.__formFilterForDataFromControlCompanyTab();

        const jsonData = JSON.stringify({
            object: "finance.stages_controlCompanyControl",
            method: "get",
            token: this.token,
            parameters: {
                filter: filter
            }
        });

        const options = this.__formOptions(jsonData);

        let records = await this.__sendMessage(options, jsonData);

        let IDs = [];
        for(let recordID in records.records){
            IDs.push(records.records[recordID].fields.queryID);
        }

        return IDs;
    }

    __formFilterForGetDirectorInfoFromHistory(queryIDs){
        return {
            comparisons:{
                object: {
                    left:{
                        type: "field",
                        value: "objectID.description"
                    },
                    right: {
                        type: "value",
                        value: ["finance.stages_directorControl", "finance.stages_controlCompanyControl"]
                    },
                    sign: "in"
                },
                action: {
                    left:{
                        type: "field",
                        value: "actionID.description"
                    },
                    right: {
                        type: "value",
                        value: "toNext"
                    },
                    sign: "equal"
                },
                queryIDvalue: {
                    left:{
                        type: "field",
                        value: "ref.history_instances.ref.history_instances_fields.valueOld"
                    },
                    right: {
                        type: "value",
                        value: queryIDs.map(ID => `"${ID}"`)
                    },
                    sign: "in"
                },
                queryIDfield: {
                    left:{
                        type: "field",
                        value: "ref.history_instances.ref.history_instances_fields.fieldID.description"
                    },
                    right: {
                        type: "value",
                        value: "queryID"
                    },
                    sign: "equal"
                }
            },
            tree: {
                and: ["object", "action", "queryIDvalue", "queryIDfield"]
            }
        }
    }

    __getDirectorAcceptance(actionHistory){
        if(!actionHistory["finance.stages_directorControl"] || !actionHistory["finance.stages_directorControl"].toNext) {
            return [];
        }

        let records = actionHistory["finance.stages_directorControl"].toNext;
        let result = {};

        for(let recordID in records){
            if(!result[records[recordID].userID]){
                result[records[recordID].userID] = [];
            }

            result[records[recordID].userID].push(records[recordID].queryID);
        }

        return result;
    }

    __getControlCompanyAcceptance(actionHistory){
        if(!actionHistory["finance.stages_controlCompanyControl"] || !actionHistory["finance.stages_controlCompanyControl"].toNext) {
            return [];
        }

        let records = actionHistory["finance.stages_controlCompanyControl"].toNext;
        let result = {};

        for(let recordID in records){
            if(!result[records[recordID].userID]){
                result[records[recordID].userID] = [];
            }

            result[records[recordID].userID].push(records[recordID].queryID);
        }

        return result;
    }

    async __getInfoForQueryIDs(queryIDs){
        let filter = this.__formFilterForGetDirectorInfoFromHistory(queryIDs);

        let fields = [
            "userID.ID",
            "userID.description"
        ];
        const jsonData = JSON.stringify({
            object: "role.history",
            method: "get",
            token: this.token,
            parameters: {
                filter: filter,
                fields: fields
            }
        });

        const options = this.__formOptions(jsonData);

        let records = await this.__sendMessage(options, jsonData);

        let actionHistory = this.__getActionHistory(records.records);

        return {
          director: this.__getDirectorAcceptance(actionHistory),
          controlCompany: this.__getControlCompanyAcceptance(actionHistory)
        };
    }

    async __getQueryByUserAcceptance(){
        if(!this.token){
            throw "Отсутствует токен для обращения."
        }

        let ccIds = await this.__getQueriesIDsFromControlCompanyTab();
        let tbIds = await this.__getQueriesIDsFromToBillTab();

        let acceptInfo = await this.__getInfoForQueryIDs(ccIds.concat(tbIds));

        return {
            onControlCompanyTab: ccIds,
            onToBillTab: tbIds,
            acceptInfo: acceptInfo
        };
    }

    __formFilterForQueryID(queryIDs){
        return {
            comparisons:{
                queryID: {
                    left:{
                        type: "field",
                        value: "queryID"
                    },
                    right: {
                        type: "value",
                        value: queryIDs
                    },
                    sign: "in"
                }
            },
            tree: {
                and: ["queryID"]
            }
        }
    }

    async __updateToBillTabForOneDirector(queryIDs, directorID){
        let filter = this.__formFilterForQueryID(queryIDs);
        let values = [{
            directorID: directorID
        }];

        const jsonData = JSON.stringify({
            object: "finance.stages_toBill",
            method: "update",
            token: this.token,
            parameters: {
                filter: filter,
                values: values
            }
        });

        const options = this.__formOptions(jsonData);

        await this.__sendMessage(options, jsonData);
    }

    async __updateToBillTabForOneControlCompanyUser(queryIDs, userID){
        let filter = this.__formFilterForQueryID(queryIDs);
        let values = [{
            controlID: userID
        }];

        const jsonData = JSON.stringify({
            object: "finance.stages_toBill",
            method: "update",
            token: this.token,
            parameters: {
                filter: filter,
                values: values
            }
        });

        const options = this.__formOptions(jsonData);

        await this.__sendMessage(options, jsonData);
    }

    async __updateContolCompanyControlTabForOneDirector(queriesIDs, directorID){
        let filter = this.__formFilterForQueryID(queryIDs);
        let values = [{
            directorID: directorID
        }];

        const jsonData = JSON.stringify({
            object: "finance.stages_controlCompanyControl",
            method: "update",
            token: this.token,
            parameters: {
                filter: filter,
                values: values
            }
        });

        const options = this.__formOptions(jsonData);

        await this.__sendMessage(options, jsonData);
    }

    __updateControlCompanyTab(queryIDs, acceptInfo){
        let directorsPairs = _.toPairs(acceptInfo.director);
        let directorPromises = directorsPairs.map(pair => {
            let [directorID, directorQueryIDs] = pair;
            return this.__updateContolCompanyControlTabForOneDirector(_.intersection(queryIDs, directorQueryIDs), directorID)
        });
        return directorPromises;
    }

    __updateToBillTab(queryIDs, acceptInfo){
        let directorsPairs = _.toPairs(acceptInfo.director);
        let directorPromises = directorsPairs.map(pair => {
            let [directorID, directorQueryIDs] = pair;
            return this.__updateToBillTabForOneDirector(_.intersection(queryIDs, directorQueryIDs), directorID)
        });

        let controlCompanyPairs = _.toPairs(acceptInfo.controlCompany);
        let controlCompanyPromises = controlCompanyPairs.map(pair => {
            let [controlCompanyID, controlCompanyQueryIDs] = pair;
            return this.__updateToBillTabForOneControlCompanyUser(_.intersection(queryIDs, controlCompanyQueryIDs), controlCompanyID)
        });

        return directorPromises.concat(controlCompanyPromises);
    }
    __updateAcceptInfoOnStages(queriesInfo){
        let toBill = this.__updateToBillTab(queriesInfo.onToBillTab, queriesInfo.acceptInfo);
        let toControlCompany = this.__updateControlCompanyTab(queriesInfo.onToBillTab, queriesInfo.acceptInfo);
        return Promise.all([toBill, toControlCompany]);
    }

    /**
     * Метод для проверки необходимости отправки писем
     * Возвращает структуру позиция-поставщик
     * */
    async check(){
        let queriesInfo;
        try{
            queriesInfo = await this.__getQueryByUserAcceptance();
            await this.__updateAcceptInfoOnStages(queriesInfo);
            console.log();
        }
        catch(e){
            await this.__login();
            await this.check();
        }

    }
}

module.exports = emailSender;