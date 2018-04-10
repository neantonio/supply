import {adapter} from './reference_pg';
import {request} from '../service/requestPromise';
import {createHash} from "crypto";
import {logger} from "../Logger/controller";

class formatter1C{
    static __booleanFormatFrom1C(value){
        return value === "Да";
    }

    static __uuidFormatFrom1C(value){
        return value !== "00000000-0000-0000-0000-000000000000" ? value : null;
    }
}

class reference1C_pg extends adapter {

    constructor(objInt, utility, fkeys){
        super(objInt, utility, fkeys);
        this.lastTime = null;

        if(objInt.configFor1C) {
            this.__config = objInt.configFor1C;
        }
        else{
            throw `Интерфейс не содержит описание справочника 1С.`;
        }
    }


    /**
     * Возвращает список единиц измерения из 1С по внешнему ключу (первичный ключ в базе 1С).
     * */
    async __getDataFrom1C(){
        let self = this;
        let options = {
            method: "GET",
            url: "http://stpserver.groupstp.ru:1805/accnt2016/references",
            headers: {
                hash: createHash('md5').update("1234567890123456").digest('hex'),
                reference: encodeURI(this.__config.reference1C),
                "type": "data",
                attributes: encodeURI(JSON.stringify(this.__config.fields1C))
            }
        };
        let units = {};

        let response = await request(options);
        if(response === "FAIL"){
            throw `Ошибка при получении данных при синхронизации справочника '${this.__interface.description}'`;
        }
        let str = ( new Buffer(response, 'base64') ).toString("utf8");
        let decoded = JSON.parse(str); // Ta-da
        decoded.shift();
        decoded.map(function (unit) {
            let u = {};
            self.__config.fields1C.map(function (oau, index) {
                let fieldNameSupply = self.__config.fieldsSupply[index];
                let fieldName1C = oau;
                let fieldType;

                // достаем тип поля
                if(self.__interface.fields[fieldNameSupply].type instanceof Array){
                    fieldType = self.__interface.fields[fieldNameSupply].type[0];
                }
                else if(self.__interface.fields[fieldNameSupply].type === "link"){
                    fieldType = self.__fkeys[fieldNameSupply][0];
                }

                //Если поле является ссылкой на другой добавляем метку "УникальныйИдентификатор" к мени поля из 1С
                if(self.__interface.fields[fieldNameSupply].type === "link"){
                    fieldName1C += "УникальныйИдентификатор";
                }

                let resValue = unit[fieldName1C];
                if(formatter1C[`__${fieldType}FormatFrom1C`]){
                    resValue = formatter1C[`__${fieldType}FormatFrom1C`](resValue);
                }
                u[fieldNameSupply] = resValue;
            });
            units[unit[self.__config.fields1C[0]]] = u;
        });
        return units;
    }

    /**
     * Возвращает внешний код из @object по записи @record
     *
     */
    __getExternalCode(object, record){
        for(let ext in object){
            for(let field of this.__config.fieldsPriority){
                if(object[ext][field] && (object[ext][field] === record[field])){
                    return ext;
                }
            }
        }
    }

    __checkEqual(master, slave, hierFlag = false){
        for(let f of this.__config.fieldsSupply){
            if((f !== this.__getPK()) && (f !== this.__config.hieracaclyField || hierFlag) && (!master[f] && slave[f] || master[f] && (!slave[f] || slave[f] !== master[f]))){
                return false;
            }
        }
        return true;
    }

    __getSupplyValueFrom1C(field, linkObj, rec1C, objInfo){
        try {
            let rec = linkObj.filter(r => r.externalCode === rec1C[field]);
            if(rec.length > 0) {
                if(this.__config.dependencyFields.indexOf(field) >= 0) {
                    return rec[0][objInfo.fields[field].primary.pk];
                }
                else if(field === this.__config.hieracaclyField){
                    return rec[0][this.__getPK()];
                }
            }
            return null;
        }
        catch(e){
            throw `Невозможно синхронизировать справочник '${this.__interface.description}'. Необходимо синхронизировать справочник '${this.__interface.fields[field].link}'.`;
        }
    }

    __convert1CToSupply(rec1C, foreignData, mainData, objInfo, hieracRun = false){
        let record = {};
        for(let f in rec1C){
            if(this.__config.dependencyFields.indexOf(f) >= 0){
                let linkObject = this.__interface.fields[f].link;
                record[f] = this.__getSupplyValueFrom1C(f, foreignData[linkObject], rec1C, objInfo);
            }
            else if(this.__config.hieracaclyField === f){
                record[f] = hieracRun ? this.__getSupplyValueFrom1C(f, mainData, rec1C, objInfo) : null; //;
            }
            else{
                record[f] = rec1C[f];
            }
        }

        return record;
    }

    async __updateExitedRecords(data1C, dataSupply, data, objInfo, hieracRun = false){
        let filter = {
            comparisons: {
                ID: {
                    left: {type: "field", value: this.__getPK()},
                    right: {type: "value", value: null},
                    sign: "equal"
                }
            },
            tree: {and: ["ID"]}
        };

        let dataFromSupply = {};
        let thisObj = dataSupply[this.__interface.name];
        let promisesArray = [];
        for(let our of thisObj){
            filter.comparisons.ID.right.value = our.ID;
            if(!our.externalCode){
                let ec = this.__getExternalCode(data1C, our);
                if(ec){
                    let rec = this.__convert1CToSupply(data1C[ec], data, thisObj, objInfo);
                    promisesArray.push(() => {
                        return super.update(filter, [rec], objInfo)
                    });
                    dataFromSupply[ec] = data1C[ec];
                }
            }
            else if(hieracRun){
                let formRecord = this.__convert1CToSupply(data1C[our.externalCode], data, thisObj, objInfo, true);
                if (!this.__checkEqual(our, formRecord, true)) {
                    promisesArray.push(() => {
                        return super.update(filter, [formRecord], objInfo)
                    });
                }
            }
            else{
                dataFromSupply[our.externalCode] = our;
            }
        }
        await Promise.all(promisesArray);
        return dataFromSupply;
    }

    async __processExtendedRecords(dataFrom1C, dataFromSupply, addData, objInfo){
        let result = {
            [this.__interface.name]: []
        };
        let filter = {
            comparisons: {
                ID: {
                    left: {type: "field", value: this.__getPK()},
                    right: {type: "value", value: null},
                    sign: "equal"
                }
            },
            tree: {and: ["ID"]}
        };
        let newValues = [];
        let promisesArray = [];
        for(let odinc in dataFrom1C){
            let record1C = dataFrom1C[odinc];
            let formRecord = this.__convert1CToSupply(record1C, addData, dataFromSupply, objInfo);
            formRecord.date = (new Date()).toISOString();
            if(dataFromSupply[record1C.externalCode]) {
                if (!this.__checkEqual(dataFromSupply[record1C.externalCode], formRecord)) {
                    filter.comparisons.ID.right.value = dataFromSupply[record1C.externalCode][this.__getPK()];
                    promisesArray.push(super.update(filter, [formRecord], objInfo));
                }
                formRecord[this.__getPK()] = dataFromSupply[odinc][this.__getPK()];
                result[this.__interface.name].push(formRecord);
            }
            else{
                newValues.push(formRecord);
            }
        }
        await Promise.all(promisesArray);

        result[this.__interface.name].splice(1, 0, ...(await super.insert(newValues, null, false)));
        return result;
    }

    __formObject(objInfo, fieldName){
        if(!objInfo || !Object.keys(objInfo.fields || []).length === 0 || !fieldName || !objInfo.fields[fieldName]){
            //logger.write(`error`, `Невозможно сформировать информацию для утилиты`, new Error());
            throw `Невозможно сформировать информацию для утилиты`;
        }

        let object = {
            PK: {},
            fields: {},
            link: {},
            name: objInfo.fields[fieldName].uObj
        };

        let upk = objInfo.fields[fieldName].primary.upk;
        let utype = objInfo.fields[fieldName].primary.type;
        object.PK[upk] = utype;
        object.fields[upk] = utype;

        for(let f in objInfo.fields[fieldName].fields){
            let uField = objInfo.fields[fieldName].fields[f].ufield;
            let fType = objInfo.fields[fieldName].fields[f].type;
            object.fields[uField] = fType;
        }

        // for()

        return object;
        /*
        for(let f in objInfo.fields[fieldName].link){
            let uField = objInfo.fields[fieldName].fields[f].uField
            let fType = objInfo.fields[fieldName].fields[f].type;
            object.fields[uField] = fType;
        }
        */
    }

    async sync(fields, parameters, objInfo = {}){
        let cDate = new Date();
        cDate.setHours(cDate.getHours() - 1);
        if(this.lastTime && this.lastTime > cDate){
            throw `Нельзя производить синхронизацию справочника чаще, чем 1 раз в час. 
                   Время последней синхронизации: ${lastDate.getHours()}:${lastDate.getMinutes()}`;
        }
        this.lastTime = new Date();
        logger.write(`debug`, `Старт синхронизации справочника '${this.__interface.name}'.`);
        let data = (await super.get(fields, {}, {}, objInfo)).records;

        let addData = {};
        if(this.__config.dependencyFields) {
            for (let f of this.__config.dependencyFields) {
                let objName = this.__interface.fields[f].link;
                let uobjName = objInfo.fields[f].uObj;
                let uObj = this.__formObject(objInfo, f);
                let r = await this.__utility.select(uObj, [], {}, {}, {});
                addData[this.__interface.fields[f].link] = r[uobjName];
            }
        }

        let dataFrom1C = await this.__getDataFrom1C();

        let updateIDs = [], updateValues = [];

        // обновление текущих записей у которых не указан код из 1С
        try {
            let dataFromSupply = await this.__updateExitedRecords(dataFrom1C, data, addData, objInfo);
            let newSupplyData = await this.__processExtendedRecords(dataFrom1C, dataFromSupply, addData, objInfo);
            await this.__updateExitedRecords(dataFrom1C, newSupplyData, addData, objInfo, true);
        }
        catch(e){
            console.log();
        }

        logger.write(`debug`, `Cправочник '${this.__interface.name}' синхронизирован.`);
        return {
            [this.__interface.name]: []
        }
    }

    __valuesPreparing(values){
        return values.map(
            record => {
                if("externalCode" in record){
                    delete record.externalCode;
                }
                return record;
            }
        )
    }

    insert(values, parameters, reqFlag = true){
        return super.insert(this.__valuesPreparing(values), parameters, reqFlag);
    }

    update(filter, values, parameters, objInfo){
        return super.update(filter, this.__valuesPreparing(values), parameters, objInfo);
    }
}

export {reference1C_pg as adapter};