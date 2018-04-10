
let http = require("http");
let querystring = require('querystring');
let dataFormatter = require('./dataFormatter');

class emailSender{
    constructor(config, timeout = 0){
        this.config = config;
        this.mainContactErrorMessage = "Ошибка. Для поставщика не указан основной контакт.";
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

    __formFilterForPositionAndSupplier(positionID, supplierID){
        return {
            comparisons: {
                position:{
                    left: {
                        type: "field",
                        value: "initialOfferID"
                    },
                    right: {
                        type: "value",
                        value: positionID
                    },
                    sign: "equal"
                },
                supplier: {
                    left: {
                        type: "field",
                        value: "supplier"
                    },
                    right: {
                        type: "value",
                        value: supplierID
                    },
                    sign: "equal"
                }
            },
            tree: {
                and: ["supplier", "position"]
            }
        }
    }

    __formFilterOffer(offerID){
        return {
            comparisons: {
                position:{
                    left: {
                        type: "field",
                        value: "ID"
                    },
                    right: {
                        type: "value",
                        value: offerID
                    },
                    sign: "equal"
                }
            },
            tree: {
                and: ["position"]
            }
        }
    }

    async __updateForSuppliersWithoutMainContact(errorPositions){
        const jsonTemplate = {
            object: "supply.stages_initialOffer_offers",
            method: "update",
            token: this.token,
            parameters: {}
        };

        const optionsTemplate = {
            hostname: this.config.host,
            port: this.config.port,
            path: '/cli',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Content-Length': Buffer.byteLength(jsonData)
            }
        };

        let parameters = [];
        for(let record of errorPositions){
            if(!record.commentary || record.commentary.split("\n").pop() !== this.mainContactErrorMessage) {
                parameters.push({
                    filter: this.__formFilterOffer(record.ID),
                    values: [{
                        commentary: (record.commentary ? `${record.commentary}\n` : "") + this.mainContactErrorMessage
                    }]
                });
            }
        }

        await Promise.all(parameters.map(onePars => {
            let oneData = jsonTemplate;
            oneData.parameters = onePars;

            let json = JSON.stringify(oneData);

            let oneOptions = optionsTemplate;
            oneOptions.headers['Content-Length'] = Buffer.byteLength(json);

            return this.__sendMessage(oneOptions, json);
        }));
    }

    __formFilterForLastMinutes(minutes){

        let filter = {
            comparisons:{
                // выбираем только основные контакты у поставщика
                mainContact: {
                    left: {
                        type: "field",
                        value: "ref.stages_initialOffer_offers.supplier.ref.supplier_contacts.mainContact"
                    },
                    right: {
                        type: "value",
                        value: true
                    },
                    sign: "equal"
                },
                // выбираем только подготовленные позиции
                flag: {
                    left: {
                        type: "field",
                        value: "prepared"
                    },
                    right: {
                        type: "value",
                        value: true
                    },
                    sign: "equal"
                },
                // выбираем предложения, которые еще не запрашивали
                notReceived: {
                    left: {
                        type: "field",
                        value: "ref.stages_initialOffer_offers.requestReceived"
                    },
                    right: {
                        type: "value",
                        value: true
                    },
                    sign: "unEqual"
                }
            },
            tree: {
                and:[
                    "mainContact",
                    "flag",
                    "notReceived"
                ]
            }
        };
        if(minutes && minutes > 0) {
            let dateMinus5Minutes = new Date();
            dateMinus5Minutes.setMinutes(dateMinus5Minutes.getMinutes() - parseInt(minutes));
            filter.comparisons.date = {
                left: {
                    type: "field",
                        value: "date"
                },
                right: {
                    type: "value",
                        value: this.__dateToStr(dateMinus5Minutes)
                },
                sign: "greater"
            };
            filter.tree.and.push("date");
        }
    }

    /**
     * Получить позиции с этапа "
     * */
    async __getPositions(){
        if(!this.token){
            throw "Token is absent."
        }

        const fields = [
            // описание позиции
            "positionID.quantity",                                // количество
            "positionID.productID.description",                   // имя номенклатуры
            "positionID.productID.article",                       // артикул
            "positionID.productID.unitID.description",            // единица измерения (сокращенное название)
            "positionID.productID.unitID.full_name",              // единица измерения (полное название)
            "ref.stages_initialOffer_offers.requestReceived",     // флаг отправки предложения (true - отправлено)
            "ref.stages_initialOffer_offers.commentary",          // коментарий к предложению

            // данные организации-заказчика
            "positionID.queryID.organization.description", // Сокращенное наименование
            "positionID.queryID.organization.fullName",    // Полное наименование
            "positionID.queryID.organization.INN",         // ИНН
            "positionID.queryID.organization.KPP",         // КПП
            "positionID.queryID.organization.OGRN",        // ОГРН
            "positionID.queryID.subdivision.ID",           // ID подразделения
            "positionID.queryID.stock.ID",                 // ID склада
            //"positionID.queryID.organization.ref.organization_contacts.description",        // ФИО получателя
            // данные поставщика
            "ref.stages_initialOffer_offers.supplier.description", // Наименование
            "ref.stages_initialOffer_offers.supplier.ref.supplier_contacts.description",  // ФИО контактного лица
            "ref.stages_initialOffer_offers.supplier.ref.supplier_contacts.email",        // email контактного лица
            "ref.stages_initialOffer_offers.supplier.ref.supplier_contacts.mainContact"   // флаг "основной контакт"
        ];

        const filter = this.__formFilterForLastMinutes(this.timeout);

        const jsonData = JSON.stringify({
            object: "supply.stages_initialOffer",
            method: "get",
            token: this.token,
            parameters:{
                filter: filter,
                fields: fields
            }
        });

        const options = this.__formOptions(jsonData);

        return this.__sendMessage(options, jsonData);
    }

    __formFilterForObjectHistoryByID(object, method, IDs){
        return {
            comparisons:{
                object: {
                    left:{
                        type: "field",
                        value: "objectID.description"
                    },
                    right: {
                        type: "value",
                        value: object
                    },
                    sign: "equal"
                },
                action: {
                    left:{
                        type: "field",
                        value: "actionID.description"
                    },
                    right: {
                        type: "value",
                        value: method
                    },
                    sign: "equal"
                },
                instance: {
                    left:{
                        type: "field",
                        value: "ref.history_instances.entityID"
                    },
                    right: {
                        type: "value",
                        value: IDs
                    },
                    sign: "in"
                }
            },
            tree: {
                and: ["object", "action", "instance"]
            }
        }
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

    async __getOwnersRecords(positions){
        let offerIDs = positions.map(record => record.offerID);
        if(offerIDs.length === 0){
            return {};
        }

        const fields = [
            // информация о пользователе
            "userID.description", // ФИО
            "userID.email", // email

            // информация об объекте
            "ref.history_instances.entityID" // ID предложения
        ];

        const filter = this.__formFilterForObjectHistoryByID("supply.stages_initialOffer_offers", "insert", offerIDs);

        const jsonData = JSON.stringify({
            object: "role.history",
            method: "get",
            token: this.token,
            parameters:{
                filter: filter,
                fields: fields
            }
        });

        const options = this.__formOptions(jsonData);

        let owners = {};
        let history = await this.__sendMessage(options, jsonData);
        for(let historyID in history.records){
            let userInfo = history.records[historyID].fields.userID;
            if(!owners[userInfo.ID]) {
                owners[userInfo.ID] = {
                    name: userInfo.description,
                    email: userInfo.email,
                    offerIDs: []
                };
            }
            
            for(let instanceID in history.records[historyID].refs.history_instances){
                let instance = history.records[historyID].refs.history_instances[instanceID];
                owners[userInfo.ID].offerIDs.push(instance.fields.entityID);
            }
        }
        return owners;
    }

    __sendLetters(letters){
        const jsonData = JSON.stringify({
            object: "supply.emailSender",
            method: "insert",
            token: this.token,
            parameters:{
                values: letters
            }
        });

        return this.__sendMessage(this.__formOptions(jsonData), jsonData);
    }

    __updateOneOffer(ID, values){
        const jsonData = JSON.stringify({
            object: "supply.stages_initialOffer_offers",
            method: "update",
            token: this.token,
            parameters:{
                filter: {
                    comparisons:{
                        ID:{
                            left: {
                                type: "field",
                                value: "ID"
                            },
                            right: {
                                type: "value",
                                value: ID
                            },
                            sign: "equal"
                        }
                    },
                    tree: {
                        and: ["ID"]
                    }
                },
                values: [values]
            }
        });

        return this.__sendMessage(this.__formOptions(jsonData), jsonData);
    }

    async __updateReceivedOffers(positions){
        if(positions.length === 0){
            return;
        }

        let updateOffers = [];
        for(let position of positions){
            updateOffers.push({
                ID: position.offerID,
                values:{
                    commentary: (position.offerComment || "").replace(new RegExp("\n?"+this.mainContactErrorMessage,"g"), ""),
                    requestReceived: true
                }
            });
        }

        return Promise.all(updateOffers.map(offerData => this.__updateOneOffer(offerData.ID, offerData.values)));
    }

    /**
     * Метод для проверки необходимости отправки писем
     * Возвращает структуру позиция-поставщик
     * */
    async send(){
        let positions;
        try{
            positions = await this.__getPositions();
            let formatter = new dataFormatter(positions.records);
            await this.__updateForSuppliersWithoutMainContact(formatter.errorPositions);

            let ownerRecords = await this.__getOwnersRecords(formatter.positions);
            let letters = formatter.formLetters(ownerRecords);

            await this.__sendLetters(letters);

            await this.__updateReceivedOffers(formatter.positions);
        }
        catch(e){
            await this.__login();
            await this.send();
        }

    }
}

module.exports = emailSender;