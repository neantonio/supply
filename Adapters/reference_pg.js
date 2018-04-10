'use strict';
import {logger} from '../Logger/controller';
import {typeController} from '../typeController';
import {httpRequest} from '../service/requestPromise';
import _ from "lodash";

class reference_pg {
    constructor(objInt, utility, fkeys, s = false) {
        logger.write(`debug`, `Создание PostgreSQL адаптера для справочника.`);
        this.__name = "reference_pg";
        this.__interface = objInt;
        this.__uInfo = objInt.uInfo;
        this.__utility = utility;
        this.__fkeys = fkeys;
        delete this.__interface.uInfo;

        if(!s){
            this.__this = new reference_pg(objInt, utility, fkeys, true);
            for (let k in this.__interface.methods){
                if (!this[k]) {
                    logger.write(`warning`, `Предупреждение. Инициализации адаптера '${this.__name}': отсутствует реализация для метода '${k}'`, new Error());
                    this[k] = new Function(
                        this.__interface.methods && this.__interface.methods.parameters ? this.__interface.methods.parameters.map(ar => ar.name).join(",") : "",
                        `return Promise.reject("Метод '${k}' не определен для объекта '${this.__interface.name}'");`);
                }
            }
        }
    }

    __getPK() {
        let fields = this.__interface.fields;
        for (let f in fields) {
            if (fields[f].isPrimary) {
                return f;
            }
        }

        return Object.keys(fields)[0];
    }

    async __objectError(error) {
        let pk = this.__getPK();
        let objInfo = this.__getUObject();
        let fields = [];
        fields.push({
            name: this.__uInfo.fields[pk],
            type: objInfo.fields[pk],
            parameters: []
        });
        for (let f in objInfo.fields)
            if (f !== pk)
                fields.push({
                    type: objInfo.fields[f],
                    name: f,
                    parameters: []
                });

        for (let l in objInfo.link)
            fields.push({
                type: objInfo.link[l],
                name: l,
                parameters: []
            });
        await this.__utility.addObject(this.__uInfo.object, fields);
    }

    async __typeError(error) {
        logger.write(`warning`, `Система не поддерживает возможность автоматического изменения типа полей. Объект: ${this.__interface.name} Error object: ` + JSON.stringify(error), new Error());
        return Promise.reject(`Система не поддерживает возможность автоматического изменения типа полей.`);
    }

    async __absentError(error) {
        let self = this;
        let addPromises = [];
        for(let f of error.fields) {
            //await Promise.all(
                //error.fields.map(async (f) => {
            let type = self.__interface.fields[f].type;
            if (["ref", "link"].indexOf(type) >= 0) {
                type = self.__fkeys[f];
            }
            addPromises.push(self.__utility.addColumn(
                self.__uInfo.object,
                f,
                type,
                self.__interface.fields[f].properties || []));
            await Promise.all(addPromises);
             //   }));
        }
    }

    async init() {
        /*пока недосделано*/
        let self = this;
        let uobj = self.__getUObject();
        let fields = {};
        _.merge(fields, uobj.fields, this.__fkeys);
        // 1+1;

        try {
            return await self.__utility.checkObject(self.__uInfo.object, fields);
        }
        catch(e) {
            let errorPromises = e.map(eObj => {
                if (self[`__${eObj.type}Error`]){
                    return self[`__${eObj.type}Error`](eObj);
                }
            });
            try{
                await Promise.all(errorPromises);
            }
            catch(err){
                logger.write('warning', `Необработанное исключение. Error: ${err}`, new Error());
                return Promise.resolve()
            }
        }
    }

    async getInterface() {
        let res = _.cloneDeep(this.__interface);
        res.refs = Object.keys(res.refs);
        return res;
    }

    async __setRef(rName, object) {
        if (this.__interface.refs[rName])
            this.__interface.refs[rName] = object;
    }

    /*
        getUtility(){
            return Promise.resolve(this.__utility);
        }
    */
    __getUtilityName(field, objects) {
        // 0 - field
        // 1 - отсеченное по последнюю точку значение
        // 3 - отсеченное по предпоследнюю точку значение
        // 4 - предпоследняя часть
        // 5 - последняя часть
        let fp = field.match(/(((.+)\.)?(\w+))\.(\w+)$/);
        if (fp) {
            if (fp[4] == "ref") {
                return (fp[3] ? this.__getUtilityName(fp[3], objects) : "ref") + "." + objects[field].uObj
            }
            else {
                return this.__getUtilityName(fp[1], objects) + "." + objects[fp[1]].link[fp[5]].ufk;
            }
            /*return fp[4] == "ref"
             ? (fp[3] ? this.__getUtilityName(fp[3], objects) : objects[field].uObj)
             : this.__getUtilityName(fp[1], objects) + "." + objects[fp[1]].link[fp[5]].ufk;*/
        }
        return objects[field].uObj;
    }

    // ToDo: во всех функциях предобработки параметра реализовать проверки и возврат ошибок!
    __objectsPrepare(objects = {}) {
        let objKeys = Object.keys(objects);
        let uobjs = this.__fieldsPrepare(objKeys, objects);
        let res = {};
        let reverseInfo = {fields: {}, refs: {}};
        objKeys.forEach((key, index) => {
            let o = objects[key];
            res[uobjs[index]] = {
                fields: {},
                link: {}
            };

            for (let f in o.fields)
                res[uobjs[index]].fields[o.fields[f].ufield] = o.fields[f].type;

            for (let l in o.link)
                res[uobjs[index]].link[o.link[l].ufk] = objects[o.link[l].o].uObj;

            if (o.rLink)
                res[uobjs[index]].rLink = {
                    object: o.rLink.uo,
                    field: o.rLink.urLink
                };

            res[uobjs[index]].object = o.uObj;

            res[uobjs[index]].PK = {};

            res[uobjs[index]].PK[o.primary.upk] = o.primary.type;
        });
        return res;
    }

    __fieldsPrepare(fields, objects) {
        let self = this;
        let r = fields.map(f => {
            let a = "";
            let rr;
            try {
                rr = f.match(/(.+?)\.(((ref)\.)?(\w+))$/);
                if (rr) {
                    a = self.__fieldsPrepare([rr[1]], objects)[0];
                    if (rr[4]) {
                        if (!objects[rr[0]]) {
                            logger.write(`error`, `Обращение к несуществуещему объекту '${rr[5]}'`, new Error());
                            throw `Обращение к несуществующему объекту`;
                        }
                        a += ".ref." + objects[rr[0]].uObj;
                    }
                    else {
                        if (["ref", "link"].indexOf(rr[1]) < 0) {
                            if (objects[rr[1]].fields[rr[2]])
                                a += "." + objects[rr[1]].fields[rr[2]].ufield;
                            else
                                a += "." + objects[rr[1]].link[rr[2]].ufk;
                        }
                        else {
                            a = rr[1] + "." + objects[f].uObj;
                        }
                    }
                }
                else
                    a = self.__uInfo.fields[f];
            } catch (e) {
                logger.write(`warning`, `Необработанное исключение. Error: ${e}.`);
            }
            return a;
        })
        return r;
    }

    __filterPrepare(filter = {}, objects) {
        let res = {};
        res.tree = filter.tree || {};
        res.comparisons = {};
        for (let c in filter.comparisons) {
            let left = {
                type: filter.comparisons[c].left.type
            }, right = {
                type: filter.comparisons[c].right.type
            };

            if (left.type === "field") {
                if (!this.__interface.fields[filter.comparisons[c].left.value])
                    left.value = this.__fieldsPrepare([filter.comparisons[c].left.value], objects)[0];
                else
                    left.value = this.__uInfo.fields[filter.comparisons[c].left.value];
            }
            else
                left.value = filter.comparisons[c].left.value;

            if (right.type === "field") {
                if (!this.__interface.fields[filter.comparisons[c].right.value])
                    right.value = this.__fieldsPrepare([filter.comparisons[c].right.value], objects)[0];
                else
                    right.value = this.__uInfo.fields[filter.comparisons[c].right.value];
            }
            else
                right.value = filter.comparisons[c].right.value;

            res.comparisons[c] = {
                left: left,
                right: right,
                sign: filter.comparisons[c].sign
            };
        }
        return res;
    }

    __getObjectField(object, ufield) {
        for (let f in object.fields)
            if (object.fields[f].ufield === ufield)
                return {
                    field: f,
                    type: object.fields[f].type
                };

        for (let l in object.link)
            if (object.link[l].ufk === ufield)
                return {
                    field: l,
                    type: "link"
                };

        if (object.primary.upk === ufield)
            return {
                field: object.primary.pk,
                type: object.primary.type
            };


        if (object.rLink.urLink === ufield)
            return {
                field: object.rLink.rLink
            };
    }

    __getUObject(uInfo = this.__uInfo, int = this.__interface) {
        let uObject = {
            name: uInfo.object,
            fields: {},
            link: {}
        };

        for (let f in uInfo.fields) {
            if (["ref", "link"].indexOf(int.fields[f].type) < 0) {
                if (int.fields[f].isPrimary) {
                    uObject.PK = {};
                    uObject.PK[uInfo.fields[f]] = int.fields[f].type;
                }
                uObject.fields[uInfo.fields[f]] = int.fields[f].type;
            }
            else {
                uObject.link[uInfo.fields[f]] = this.__fkeys[uInfo.fields[f]]; //ToDo: поставить правильную ссылку на внешний объект
            }
        }
        return uObject;
    }

    __getUField(field, objects) {
        if (this.__uInfo.fields[field]) {
            return this.__uInfo.fields[field];
        }
        else if (field.match(/\./)) {
            let [, objectName, fieldName] = field.match(/(.+)\.(.+)/);
            if (!objects || !objects[objectName].fields[fieldName].ufield) {
                logger.write(`warning`, `Невозможно идентифицировать поле '${field}' объекта '${this.__interface.name}'.`, new Error());
                throw `Невозможно идентифицировать поле '${field}' объекта '${this.__interface.name}'.`;
            }
            return this.__getUtilityName(objectName, objects) + "." + objects[objectName].fields[fieldName].ufield;
        }
        else {
            logger.write(`warning`, `Невозможно идентифицировать поле '${field}' объекта '${this.__interface.name}'.`, new Error());
            throw `Невозможно идентифицировать поле '${field}' объекта '${this.__interface.name}'.`
        }
    }

    __parametersPrepare(parameters = {}, objects) {
        let self = this;
        let result = {};
        if (parameters.orderBy) {
            result.orderBy = [];
            for (let f of parameters.orderBy) {
                result.orderBy.push({
                    field: this.__getUField(f.field, objects),
                    sort: f.sort
                });
            }
        }

        if (parameters.unique) {
            result.unique = [];
            for (let f of parameters.unique) {
                result.unique.push(this.__getUField(f, objects));
            }
        }

        for (let p in parameters) {
            if (!result[p]) {
                result[p] = parameters[p];
            }
        }
        return result;
    }

    __recordFromUtilityToAdapterFormat(records){
        let result = [];
        let self = this;
        records.forEach(record => {
            let rec = {};
            for (let f in self.__uInfo.fields) {
                if (record.hasOwnProperty(self.__uInfo.fields[f])) {
                    rec[f] = record[self.__uInfo.fields[f]];
                }
            }
            result.push(rec);
        });
        return result;
    }

    /**
     * Реализация метода get для справочника
     * parameters - массив с агрегатными функциями в формате
     *
     * */
    async get(fields = [], filter, parameters = {}, objInfo) {
       // logger.write(`debug`, `Get from '${this.__interface.name}'.`);
        objInfo = objInfo || {};
        // objInfo.fields = objInfo.fields || {};

        let self = this;
        // получение объекта, полей, фильтра, параметров и описаний доп.объектов в рамках утилиты
        let uObject = self.__getUObject();
        let uFields = self.__fieldsPrepare(fields, objInfo.fields);
        let uFilter = self.__filterPrepare(filter, objInfo.fields);
        let uParameters = self.__parametersPrepare(parameters, objInfo.fields);
        let uObjects = self.__objectsPrepare(objInfo.fields);

        // получаем результат выборки из БД
        let result = await self.__utility.select(uObject, uFields, uFilter, uObjects, uParameters);

        let refs = [];
        let prResult = {};

        // формирование отчета для текущего объектов и всех связанных
        if (!prResult[self.__interface.name]) {
            prResult[self.__interface.name] = [];
        }

        // если результат пустой, возвращаем пустую структуру
        if (!result || result[this.__uInfo.object].length == 0)
            return {
                records: prResult,
                fields: fields
            };

        // перебираем результаты и формируем структуру для основного объекта
        prResult[this.__interface.name] = this.__recordFromUtilityToAdapterFormat(result[self.__uInfo.object]);
        /*
        result[self.__uInfo.object].forEach(record => {
            let rec = {};
            for (let f in self.__uInfo.fields)
                if (record.hasOwnProperty(self.__uInfo.fields[f]))
                    rec[f] = record[self.__uInfo.fields[f]];
            prResult[self.__interface.name].push(rec);
        });
        */
        delete result[self.__uInfo.object];

        // инициализация пустого ассоциативного массива для хранения информации о связанных объектах
        let rel = {};
        for (let o in objInfo.fields)
            rel[self.__fieldsPrepare([o], objInfo.fields)[0]] = o;

        // заполнение информации о связанных объектах
        for (let o in result) {
            if (!prResult[objInfo.fields[rel[o]].obj])
                prResult[objInfo.fields[rel[o]].obj] = [];

            // преобразование записей в БД из связанной таблице в информацию о связанном объекте
            result[o].forEach(record => {
                let rec = {};
                for (let f in record) {
                    let of = self.__getObjectField(objInfo.fields[rel[o]], f);
                    rec[of.field] = record[f];
                }
                prResult[objInfo.fields[rel[o]].obj].push(rec);
            });
        }

        return {
            records: prResult,
            fields: fields
        };
    }

    /*
        static getName(){
            return Promise.resolve(this.__name);
        }*/

    /*
        async delete(filter){

        }
    */

    __getUniqueFilter(values){
        let uniqueFields = this.__getUniqueKeys();

        // массив простых условий
        let comparisons = {};
        // массив конъюнктов для уникальных значений
        let andTree = [];

        for(let i = 0; i < values.length; ++i){
            let record = values[i];
            let fValues = [];

            for(let field of uniqueFields){
                if(typeof record[field] !== "undefined"){
                    fValues.push(record[field]);
                }
            }

            if(uniqueFields.length > 0 && fValues.length === uniqueFields.length){
                let oneAnd = {and: []};
                for(let num in uniqueFields){
                    let comparisonName = `${uniqueFields[num]}_${i}`;
                    comparisons[comparisonName] = {
                        left:{
                            type:"field",
                            value: uniqueFields[num]
                        },
                        right:{
                            type: "value",
                            value: fValues[num]
                        },
                        sign: "equal"
                    };
                    oneAnd.and.push(comparisonName);
                }
                andTree.push(oneAnd);
            }
        }
        if(andTree.length > 0){
            return {
                comparisons: comparisons,
                tree: {or: andTree}
            }
        }
    }

    recordComparison(record1, record2, fields = []){
        if(!fields){
            fields = Object.keys(record1);
        }

        for(let field of fields){
            if(record1[field] !== record2[field]){
                return false;
            }
        }

        return true;
    }

    /**
     * Выбирает из @records  записи, которых нет в @fRecords, сравнивает либо по полям @uniqueFields, либо по всем полям @records
     * */
    filterRecords(records, fRecords, uniqueFields = this.__getUniqueKeys()){
        let self = this;
        let result = [];
        records.forEach(record => {
            // флаг показывает надо ли добавить запись в результат
            let flag = true;
            fRecords.forEach(fRecord => {
                if(self.recordComparison(record, fRecord, uniqueFields)){
                    //result.push(record);
                    flag = false;
                }
            });
            if(flag){
                result.push(record);
            }
        });
        return result;
    }

    async insert(values, parameters = {}, reqFlag = true) {
        // ToDo: сделать проверку на обязательные поля и поля только на чтение (done)
        // Todo: сделать проверку на заполненность ключей "родительских" объектов для ТЧ
        let self = this;

        let oldFilter = this.__getUniqueFilter(values);

        let newValues = [];
        let oldRecords = [];
        if(oldFilter){
            oldRecords = (await this.get([], oldFilter, {}, {})).records[this.__interface.name];
            oldRecords = this.__recordFromUtilityToAdapterFormat(oldRecords);
            newValues = this.filterRecords(values, oldRecords, this.__getUniqueKeys());
        }
        else{
            newValues = values;
        }

        if (newValues.length > 0 || oldRecords.length > 0) {
            let pk = this.__getPK();
            // генерация значения для первичного ключа
            for (let i = 0; i < newValues.length; ++i) {
                newValues[i][pk] = await typeController.generateValue(this.__interface.fields[pk].type[0]);
            }
            //
            let uValues = [];
            // перебор значений из параметра
            for (let i = 0; i < newValues.length; ++i) {
                let record = newValues[i];

                for (let fName in this.__interface.fields) {
                    if (!record[fName]) {
                        record[fName] = null;
                    }
                }

                let uRec = {};
                // перебор полей справочника
                for (let f in self.__interface.fields) {
                    // проверка заполненных обязательных полей
                    if (reqFlag && self.__interface.fields[f].required && !record[f]) {
                        logger.write(`warning`, `Заполнены не все обязательные поля`, new Error());
                        return Promise.reject(`Заполнены не все обязательные поля`);
                    }
                    // проверка полей только для чтения
                    if (self.__interface.fields[f].properties && self.__interface.fields[f].properties.indexOf("readonly") >= 0 && record[f]) {
                        logger.write(`warning`, `Указаны значения для поля с правами только на чтение`, new Error());
                        delete record(f);
                    }
                }
                for (let f in record) {
                    uRec[self.__uInfo.fields[f]] = record[f];
                }
                newValues[i] = record;
                uValues.push(uRec);
            }
            // выполняем непосредственно insert через утилиту
            try {
                await self.__utility.insert(this.__getUObject(), uValues);
            }
            catch (e) {
                logger.write(`error`, `Записи не добавлены в БД.`, new Error());
                throw `Невозможно записать данные в справочник.`;
            }
            // формируем выход метода - набор записей в формате адаптера (справочника)
            //let out = {};
            /*
            let newRecords = {};
            for (let i = 0; i < values.length; i++) {
                newRecords[values[i][pk]] = {fields: values[i]};
            }
            //out[self.__interface.name'records'] = newRecords;*/
            newValues = newValues.concat(oldRecords);
            values[0] = newValues[0];
            return {
                records: {
                    [this.__interface.name]: newValues.concat(oldRecords)
                }
            }
        }
        else
            return {
                records: {
                    [this.__interface.name]: []
                }
            }
    }

    async getAllFields(){
        let fields = Object.keys(this.__interface.fields);
        for(let refObject in this.__interface.refs){
            let refFields = await this.__interface.refs[refObject].getAllFields();
            fields = fields.concat(refFields.map(f => `ref.${refObject}.${f}`));
        }
        return fields;
    }

    async copy(fields, filter, parameters = {}, objInfo){
        let newIDs = {};
        let records;
        try {
            records = objInfo.records[this.__interface.name].this.records[this.__interface.name];
        }
        catch(e){
            return {
                records: {
                    [this.__interface.name]: []
                }
            };
        }

        let newRecords = _.cloneDeep(records);

        if(!parameters.copy || !parameters.copy.clear) {
            for (let i in newRecords) {
                newRecords[i].description = (newRecords[i].description || "") + " (copy)";
            }
        }

        let result = await this.__this.insert.call(this, newRecords);
        newRecords = result.records[this.__interface.name];

        let PK = this.__getPK();
        for(let i in records){
            newIDs[records[i][PK]] = newRecords[i][PK];
        }

        for(let refObject in this.__interface.refs){
            if(objInfo.records[refObject]) {
                let refRecords = objInfo.records[refObject].this.records[refObject];
                let refKey = this.__getRefKey(this.__interface.refs[refObject].__interface);
                for (let i in refRecords) {
                    refRecords[i][refKey] = newIDs[refRecords[i][refKey]];
                }
                objInfo.records[refObject].this.records[refObject] = refRecords;
                await this.__interface.refs[refObject].copy([], {}, {}, objInfo);
            }
        }
        return result;
    }

    __objInfoPreparing(objInfo){
        if(!objInfo){
            objInfo = {};
        }

        if(!objInfo.fields){
            objInfo.fields = {}
        }
        return objInfo;
    }

    async update(filter, values, parameters, objInfo) {
        objInfo = this.__objInfoPreparing(objInfo);
        let self = this;
        // получение объекта, полей, фильтра, параметров и описаний доп.объектов в рамках утилиты
        let uObject = this.__getUObject();
        let uFilter = this.__filterPrepare(filter, objInfo.fields);
        let uObjects = this.__objectsPrepare(objInfo.fields);
        let uRec = {};
        // достаём из объекта-справочника объект, содержащий соответствие полей с утилитой
        const u = this.__uInfo;
        // возвращаем записи со значениями до изменения
        // вытаскиваем из базы обновляемые записи и обрабатываем их, чтобы выдать наружу
        // полученные данные представлены в терминах утилиты, их нужно переформатировать
        let buf = [];
        try{
            buf = objInfo.records[this.__interface.name].this.records[this.__interface.name];
        }
        catch(e) {
            let recs = (await this.__utility.select(uObject, [], uFilter, uObjects, []))[u.object];
            // перебираем результаты и формируем структуру для основного объекта
            recs.forEach(record => {
                let rec = {};
                for (let f in self.__uInfo.fields)
                    if (record.hasOwnProperty(u.fields[f]))
                        rec[f] = record[u.fields[f]];
                buf.push(rec);
            });
        }

        let adapterRecords = {};

        // результат выборки приходит как объект, поэтому нужно вытащить данные из соответствующего поля
        //buf = buf[u.object];
        // формируем фильтр по ID записей, которые будут изменены
        let ids = [];
        // узнаем первичный ключ
        let pk = this.__getPK();
        // перебираем выборку, достаём значения ПК
        if (buf.length > 0) {
            for (let i = 0; i < buf.length; i++) {
                ids.push(buf[i][u.fields[pk]]);
            }
            // собираем фильтр для get, который вернёт результат
            let idFilter = {
                comparisons: {
                    'idFilter': {
                        left: {
                            type: 'field',
                            value: this.__getPK()
                        },
                        sign: 'in',
                        right: {
                            type: 'value',
                            value: ids
                        }
                    }
                },
                tree: {'and': ['idFilter']}
            };
            //idFilter.comparisons.idFilter.left.value = pk;
            // формирование фильтра окончено
            // выполнение запроса update
            // формируем запись в формате утилиты
            for (let f in values[0])
                uRec[this.__uInfo.fields[f]] = values[0][f];
            // выполняем запрос на обновление
            await this.__utility.update(uRec, uObject, {}, idFilter);
            // получаем результаты изменения, отсеивая по ID изменённых записей
            return await this.get([], idFilter, {}, objInfo);
            /*
            buf = await this.__utility.select(uObject, [], this.__filterPrepare(idFilter, objInfo.fields), uObjects, []);
            buf = buf[u.object];
            */
        } else return {records: {}};
        /*let result = {records: {}};
        for (let i = 0; i < buf.length; i++) {
            for (let f in u.fields) {
                result.records[buf[i][u.fields[pk]]] = {fields: {}};
                result.records[buf[i][u.fields[pk]]].fields[f] = buf[i][u.fields[f]];
            }
        }
        return result;*/
    }

    async rbInsert(values, objInfo) {
        // узнаём какой у объекта первичный ключ
        let pk = this.__getPK();
        // формируем фильтр по значениям первичных ключей тех записей, которые были добавлены, чтобы удалить их
        let idFilter = {
            comparisons: {
                'idFilter': {
                    left: {
                        type: 'field',
                        value: pk
                    },
                    sign: 'in',
                    right: {
                        type: 'value',
                        value: []
                    }
                }
            },
            tree: {'and': ['idFilter']}
        };
        for (let i = 0; i < values.length; i++) {
            idFilter.comparisons['idFilter'].right.value.push(values[i][pk]);
        }
        // формирование фильтра окончено
        // запускаем delete прототипа, чтобы не сработали возможные подписчики
        try {
            await Object.getPrototypeOf(this).delete.call(this, idFilter, objInfo);
            logger.write(`debug`, `Выполнен откат операции insert.`);
            return Promise.resolve({});
        }
        catch (e) {
            logger.write(`error`, `Не удалось выполнить откат операции insert.`)
            return Promise.reject({});
        }
    }

    async rbUpdate(values, objInfo) {
        let bufValue;
        // узнаём какой у объекта первичный ключ
        let pk = this.__getPK();
        // формируем фильтр по значениям первичных ключей тех записей, которые были добавлены, чтобы удалить их
        // заготовка фильтра
        let idFilter = {
            comparisons: {
                'idFilter': {
                    left: {
                        type: 'field',
                        value: pk
                    },
                    sign: 'equal',
                    right: {
                        type: 'value',
                        value: null
                    }
                }
            },
            tree: {'and': ['idFilter']}
        };
        // перебираем пришедшие значения, подставляем первичный ключ в фильтр
        // и для каждого значения выполняем update
        try {
            for (let i = 0; i < values.length; i++) {
                bufValue = {};
                idFilter.comparisons['idFilter'].right.value = values[i][pk];
                for (let f in values[i]) {
                    if (f !== pk) {
                        bufValue[f] = values[i][f];
                    }
                }
                bufValue = [bufValue]; // todo <--- выяснить надо ли так делать
                await Object.getPrototypeOf(this).update.call(this, idFilter, bufValue, objInfo);
            }
            logger.write(`debug`, `Выполнен откат операции update.`)
            return Promise.resolve({});
        }
        catch (e) {
            logger.write(`error`, `Не удалось выполнить откат операции update.`);
            return Promise.reject({});
        }
    }

    async rbDelete(values) {
        try {
            await Object.getPrototypeOf(this).insert.call(this, values);
            logger.write(`debug`, `Выполнен откат операции delete.`)
            return Promise.resolve({});
        }
        catch (e) {
            logger.write(`error`, `Не удалось выполнить откат операции delete.`);
            return Promise.reject({});
        }
    }


    /**
     * Принимает на вход ID заявок. Возрвщает объект со всеми удаленными записями из ТЧ
     * */
    async __refDelete(queryIDs) {

    }

    __getRefKey(objInt = this.__interface) {
        for (let f in objInt.fields) {
            if (objInt.fields[f].type === "ref") {
                return f;
            }
        }
    }

    __getUniqueKeys(objInt = this.__interface){
        let uniqueFields = [];

        for (let f in objInt.fields) {
            if (objInt.fields[f].unique) {
                uniqueFields.push(f);
            }
        }

        let refKey = this.__getRefKey(objInt);
        if(uniqueFields.length > 0 && refKey){
            uniqueFields.push(refKey);
        }

        return uniqueFields;
    }

    async delete(filter, parameters, objInfo = {fields: {}}) {
        let self = this;
        if (objInfo && objInfo.records)
            for (let t in objInfo.records) {
                if (objInfo.records[t].records[t] && objInfo.records[t].records[t].length > 0) {
                    logger.write(`warning`, `Ошибка удаления. На один из объектов имеются ссылки из других источников.`, new Error());
                    throw(`Ошибка удаления. На один из объектов имеются ссылки из других источников.`);
                }
            }

        let getRes = await Object.getPrototypeOf(this).get.call(this, [], filter, {}, objInfo);

        let res = {
            records: {
                [this.__interface.name]: getRes.records[this.__interface.name],
                refs: {}
            },
            fields: []
        };

        let records = (await this.get([], filter, {}, objInfo)).records;
        let pkValues = records[self.__interface.name].map(rec => rec[self.__getPK()]);

        let uObject = this.__getUObject();
        let uFilter = this.__filterPrepare(filter, objInfo.fields);
        let uObjects = this.__objectsPrepare(objInfo.fields);

        if (pkValues.length > 0)
            for (let r in this.__interface.refs) {
                let rObj = this.__interface.refs[r];
                let refKey = this.__getRefKey(rObj.__interface);
                let refFilter = {
                    comparisons: {
                        f: {
                            left: {
                                type: "field", value: refKey
                            },
                            right: {
                                type: "value", value: pkValues
                            },
                            sign: "in"
                        }
                    },
                    tree: {
                        and: ["f"]
                    }
                };
                res.records[r] = (await rObj.delete(refFilter, {
                    records: {},
                    fields: []
                })).records[r];
            }

        await this.__utility.delete(uObject, uObjects, uFilter);
        return res;
    }

    /**
     * Метод, определяющий инициатора (создателя) записи в объекте
     * */
    async setInitiator(filter = {comparisons: {}, tree: {}}, values = [], parameters){

        if(this.__interface.fields.initiatorID){
            if(Object.keys(filter).length === 0){
                filter = {comparisons: {}, tree: {}}
            }
            if(values.length > 0) {
                let pk = this.__getPK();
                let fValues = values.map(v => v[pk]);
                filter.comparisons["123pkvalues321"] = {
                    left: {
                        type: "field",
                        value: pk
                    },
                    right: {
                        type: "value",
                        value: fValues
                    },
                    sign: "in"
                };
                filter.tree = {
                    or: ["123pkvalues321", filter.tree]
                };
            };
            let json = {
                method: "setInitiator",
                parameters: {
                    filter: filter,
                    parameters: {
                        project: this.parent.__interface.name,
                        object: this.__interface.name
                    }
                },
                token: parameters.token
            }

            let result = await httpRequest("localhost", 8000, json);
            console.log();
        }

    }
}

export {reference_pg as adapter};