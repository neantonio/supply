'use strict';

import {logger} from './Logger/controller';
import _ from "lodash";
import {UniConverter} from './UniConverter';

import {objectView} from './objectView';


class UniFilter{
    constructor(description){
        // на вход конструктора приходит фильтр, из него создаётся дерево сравнений
        this.__description = description;
        // поля из выборки, которые использует фильтр
        this.__fields = [];
        // формируем список используемых полей
        let fName;
        for (let c in this.__description.comparisons){
            if (this.__description.comparisons[c].left.type === 'field'){
                fName = this.__description.comparisons[c].left.value;
            } else if (this.__description.comparisons[c].right.type === 'field'){
                fName = this.__description.comparisons[c].right.value;
            }
            if (fName){
                this.__fields.push(fName);
            }
        }
        // ссылка на корень дерева сравнения
        this.tree = this.buildTree(this.__description.tree);
        this.errorText = description.errorText || null;
    }

    getFields(){
        return _.cloneDeep(this.__fields);
    }

    //
    /**
     * Метод, строящий дерево сравнения
     * @param context Часть структуры tree из фильтра, на основе которого создаётся дерево
     * @returns {ComparatorNode} Ссылка на объект, являющийся узлом в дереве, который проверяет истинность условия.
     */
    buildTree(context){
        // нижестоящие вершины
        let nodes = null;
        // условие, которое будет проверять вершина
        let comp = null;
        // логическая операция (И/ИЛИ)
        let operation = null;
        // если пришедший элемент является строкой, то это имя условия из описания фильтра
        if (typeof context === 'string'){
            comp = this.__description.comparisons[context];
            // иначе, если пришёл объект, то создаём из него нижестоящие вершины и достаём из него операцию, которая эти вершины объединяет
        } else if (typeof context === 'object'){
            nodes = [];
            operation = Object.keys(context)[0];
            let content = context[operation];
            for (let i = 0; i < content.length; i++){
                nodes.push(this.buildTree(content[i]));
            }
        }
        // возвращаем ссылку на новую вершину
        return new ComparatorNode(operation, comp, nodes);
    }

    /**
     * Отсеивает записи по условию.
     * @param records Входящая выборка.
     * @returns {Array} Отфильтрованные записи.
     */
    filter(records){
        // перебирает входную выборку, проверяет её по условию
        let result = [];
        for (let i = 0; i < records.length; i++){
            if (this.tree.check(records[i])){
                result.push(records[i]);
            }
        }
        return result;
    }

    /**
     * Проверяет запись на соответствие условию.
     * @param record Анализируемая запись
     * @returns {boolean} Соответствует запись условию или нет.
     */
    checkRecord(record){
        return this.tree.check(record);
    }
}

/**
 * Класс, представляющий узел в дереве сравнения.
 * Объекты этого класса содержат либо проверяемое условие, либо логическую операцию, связывающую другие узлы.
 * Условие хранится в том же виде, что и comparison в фильтре, по которому строится дерево, т.е. у него есть
 * левая и правя часть, а также знак, указывающий на операцию, по которой идёт сравнение; по этой операции
 * определяется функция, которая вызывается для проверки записи.
 */
class ComparatorNode{
    constructor(operation, comparison, nodes){
        // запоминаем операцию, если она есть
        this.operation = operation;
        // сохраняем ссылку на comparison
        this.comparison = comparison;
        // сохраняем ссылку на дочерние узлы, если они есть
        this.nodes = nodes;
        // подключаем сравнивающую функцию, подбирая её по знаку в comparison
        this.comparator = null;
        if (this.comparison){
            this.comparator = ComparatorNode.getComparatorBySign(this.comparison.sign);
        }
    }

    /**
     * Проверяет запись на соответствие узловию, записанному в вершине.
     * Если узел имеет сравнивающую функцию, то эта функция вызывается и в return уходит результат проверки.
     * Если же у узла указана операция и дочерние вершины, то в зависимости от операции (AND или OR)
     * проводится обход дочерних вершин и проверяемая запись спускается к ним.
     * @param record Проверяемая запись из выборки
     * @returns {boolean} Соответствует запись условию или нет.
     */
    check(record){
        // результат сравнения
        let result = true;
        // левый и правый операнды, участвующие в сравнении
        let leftOperand;
        let rightOperand;
        // вспомогательная переменная, используется при обходе нижестоящих вершин, если они есть
        let exit;
        // если вершина выполняет сравнение
        if (this.comparison){
            // получаем значение левого операнда
            if (this.comparison.left.type === 'value'){
                leftOperand = ComparatorNode.prepareValue(this.comparison.left.value);
            } else if (this.comparison.left.type === 'field'){
                leftOperand = record.fields ? record.fields[this.comparison.left.value] : record[this.comparison.left.value] || null;
                leftOperand = ComparatorNode.prepareValue(leftOperand);
            }
            // получаем правый операнд
            if (this.comparison.right.type === 'value'){
                rightOperand = ComparatorNode.prepareValue(this.comparison.right.value);
            } else if (this.comparison.right.type === 'field'){
                rightOperand = record.fields ? record.fields[this.comparison.right.value] : record[this.comparison.right.value] || null;
                rightOperand = ComparatorNode.prepareValue(rightOperand);
            }
            // корректируем "пустые" значения операндов, приводя их к null
            let emptyValues = [null, "''", 0, "'0'", '', undefined];
            // если у операндов кривые значения, заменяем их на null
            if(emptyValues.indexOf(leftOperand) >= 0){
                leftOperand = null;
            }
            if(emptyValues.indexOf(rightOperand) >= 0){
                rightOperand = null;
            }
            // засовываем операнды в сравнятор
            result = this.comparator(leftOperand, rightOperand);
            // иначе, если вершина соединяет результаты сравнений, обходим нижестоящие вершины
        } else {
            exit = false;
            for (let i = 0; i < this.nodes.length && !exit; i++){
                result = this.nodes[i].check(record);
                exit = (result && this.operation === 'or') || (!result && this.operation === 'and');
            }
        }
        return result;
    }

    /**
     * Подготавливает значение поля, извлечённое из записи, к использованию в функции сравнения
     * @param value
     * @returns {*}
     */
    static prepareValue(value){
        if (typeof value === 'string' && value !== ''){
            return '\''+value+'\'';
        } else return value;
    }

    /**
     * Создаёт функцию по знаку (>,<,=,>=,<=) для численного сравнения 2 аргументов.
     * @param sign Оператор сравнения.
     * @returns {Function} Сравнивающая функция, которая будет использоваться узлом дерева.
     */
    static createSimpleComparator(sign){
        return function(leftOperand, rightOperand){
            // todo проверяем левый операнд
            // todo проверяем правый операнд
            return eval(`(${leftOperand} ${sign} ${rightOperand})`);
        }
    }

    /**
     * Сравнивающая функция, которая проверяет, входит ли элемент в массив
     * @param item Проверяемый элемент.
     * @param collection Проверяемый массив.
     * @returns {boolean} Входит элемент в массив или нет.
     */
    static inComparator(item, collection){
        if (!Array.isArray(collection) || Array.isArray(item)){
            // todo ругаемся
        }
        return (collection.indexOf(item) > 0);
    }

    /**
     * Сравнивающая функция, проверяющая строку на соответствие паттерну;
     * т.к. паттерн задаётся для sql, переводим его в JS-регулярку
     * @param string Проверяемая строка.
     * @param pattern Шаблон для регулярки.
     * @returns {boolean} Соответствует строка шаблону или нет.
     */
    static ilikeComparator(string, pattern){
        let jsPattern = pattern.replace(/_/g, '.');
        let res = false;
        jsPattern = jsPattern.replace(/%/g, '.*');
        try {
            res = (string.search(jsPattern) === 0);
        } catch(e){
            // todo ругаемся
        }
        return res;
    }

    /**
     * Подбирает сравнивающую функцию по оператору сравнения.
     * @param sign Оператор сравнения.
     * @returns {*} Функция сравнения.
     */
    static getComparatorBySign(sign){
        let translatedSign;
        let comparator;
        if (['equal', 'unEqual', 'greaterEq', 'lessEq', 'greater', 'less'].indexOf(sign)>=0){
            switch(sign){
                case 'equal': translatedSign = '==='; break;
                case 'unEqual': translatedSign = '!=='; break;
                case 'greaterEq': translatedSign = '>='; break;
                case 'greater': translatedSign = '>'; break;
                case 'less': translatedSign = '<'; break;
                case 'lessEq': translatedSign = '<='; break;
            }
            comparator = ComparatorNode.createSimpleComparator(translatedSign);
        } else
        if (sign === 'in') {comparator = ComparatorNode.inComparator;} else
        if (sign === 'consist') {comparator = ComparatorNode.ilikeComparator;} else {
            //todo неопознанный знак, ругаемся
        }
        return comparator;
    }
}

/**
 * Класс, осуществляющий управление подписчиками.
 * */
class SubscriberView extends objectView{
    constructor(){
        super(...arguments);
        this.__svThis = this;
        // Хэш для регистрации подписок объектов друг на друга.
        this.__subs = {};
        this.__subsDict = {};
        // очень странные подписчики (набор костылей)
        this.__oddSubs = {};
    }

    async init(){
        await super.init(...arguments);
        let subStorageName = this.__interface.name+'_subscriberStorage';
        // если у мультиадаптера нет хранилища подписчиков, создаём его
        if (!this.__objects[subStorageName]){
            let int = {
                "name": subStorageName,
                "description" : "Каталог подписчиков",
                "common": "reference",
                "fields": {
                    "ID": {
                        "type": "uuid",
                        "isPrimary": true,
                        "readonly": true
                    },
                    "location":{
                        "type": "string",
                        "required": true,
                        "title": "Очередь срабатывания подписчика"
                    },
                    "object1":{
                        "type": "string",
                        "required": true,
                        "title": "Объект, на который создаётся подписка"
                    },
                    "method1": {
                        "type": "string",
                        "required": true,
                        "title": "Метод объекта, который приводит к вызову подписчиков"
                    },
                    "object2": {
                        "type": "string",
                        "title": "Связанный объект"
                    },
                    "method2":{
                        "type": "string",
                        "title": "Связанный метод"
                    },
                    "description":{
                        "type":"string",
                        "required": true,
                        "title": "JSON-описание связи между объектами"
                    }
                }
            };
            let uDesc = {uObject: subStorageName+'_table'};
            await this.addObject(subStorageName, int, 'gag', uDesc);
        } else {
            // если хранилище подписчиков уже есть, читаем его содержимое и добавляем подписчиков
            let subStorages = await this.query(subStorageName, 'get', {filter: {}, fields: []});
            let subs = subStorages.records;
            let location, object1, method1, object2, method2, description;
            for (let key in subs){
                location = subs[key].fields['location'];
                object1 = subs[key].fields['object1'];
                method1 = subs[key].fields['method1'];
                object2 = subs[key].fields['object2'];
                method2 = subs[key].fields['method2'];
                description = JSON.parse(subs[key].fields['description']);
                this.__addSubscriber(location, object1, method1, object2, method2, description, key);
            }
        }
        // инициализация этапов и схем
        for (let o in this.__objects) {
            if (this.__objects[o].__interface.stages) {
                await this.__schemeStagesInit(this.__objects[o].__interface);
                await this.__schemeInit(o);
            }
        }
    }

    /**
     * Инициализирует указанную схему
     * @param scheme Имя инициализируемой схемы
     * @returns {Promise.<void>}
     * @private
     */
    async __schemeInit(scheme) {
        this.__objects[scheme].insert = async (values) => {
            return {
                records:{},
                fields: []
            };
        };
        // связываем добавление данных в схему с вставкой данных в этапы, которые являются входными
        let input = this.__objects[scheme].__interface.input;
        for (let stage in input) {
            this.__addSubscriber('pre', scheme, 'insert', stage, 'insert', input[stage].relation);
        }
        // обрабатываем заключительные этапы
        /*let output = this.__objects[scheme].__interface.output;
        for (let stage in output){
            this.__addSubscriber('post', stage, 'toNext', 'stages', 'update', output[stage].relation);
        }*/
        // связываем метод toNext каждого этапа с методом insert следующего по порядку
        let relations = this.__objects[scheme].__interface.relations;
        for (let i in relations) {
            if (relations[i].type === 'uber'){
                await this.addUber(relations[i].from, relations[i].to, relations[i].relation);
            } else {
                this.__addSubscriber('post', relations[i].from, 'toNext', relations[i].to, 'insert', relations[i].relation);
            }
        }
    }

    __recordComparison(record1, record2, fields = []){
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
    __filterRecords(records, fRecords, uniqueFields = []){
        let self = this;
        let result = [];
        records.forEach(record => {
            let flag = true;
            fRecords.forEach(fRecord => {
                if(!self.__recordComparison(record, fRecord, uniqueFields)){
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

    async __schemeStagesInit(schemeInt) {
        let self = this;


        let schObj = this.__objects[schemeInt.name];
        let oldBackTo = schObj.backTo;
        let oldAbort = schObj.abort;

        this.__objects[schemeInt.name].backTo = async (filter, values, objInfo) => {
            if(!values || values.length === 0 || !values[0].stage){
                logger.write(`warning`, `Не указан этап, на который необходимо вернуть позиции.`, new Error());
                throw `Не указан этап, на который необходимо перевести позиции.`;
            }

            let backStage = values[0].stage;
            let backingValues = (await oldBackTo.call(schObj, filter, values, objInfo)).records[schemeInt.name];

            let result = await self.query(backStage, insert, {values: backingValues});

            //return self.__objects[backStage].insert(backingValues);
            return backingValues;

        };
        this.__objects[schemeInt.name].abort = async (filter, objInfo) => {
            let abortStageName = this.__objects[schemeInt.name].__interface.abort;
            let uniqueFields = this.__objects[schemeInt.name].__interface.stages[abortStageName].unique;

            let aborting = (await oldAbort.call(schObj, filter, objInfo)).records[schemeInt.name];

            let toInsert = aborting.map(rec => {
                let newRec = {};
                for(let uniqueField in uniqueFields){
                    newRec[ uniqueFields[uniqueField] ] = rec[uniqueField];
                }
                return newRec;
            });

            await this.__objects[abortStageName].insert(toInsert);
            return aborting;
        };

        for (let st in schemeInt.stages){
            if(!this.__interface.objects[st]){
                logger.write(`error`, `Невозможно загрузить описание для несуществующего объекта '${st}'.`, new Error());
                throw `Невозможно загрузить описание для несуществующего объекта '${st}'.`;
            }

            let uRel = schemeInt.stages[st].unique;

            let oldGet = this.__objects[st].get;
            let oldInsert = this.__objects[st].insert;
            let oldUpdate = this.__objects[st].update;
            let oldDelete = this.__objects[st].delete;
            let oldToNext = this.__objects[st].toNext;

            this.__objects[st].get = async (fields, filter, parameters = {}, objInfo) => {
                if(!parameters.unique) {
                    parameters.unique = [];
                }

                for(let u in uRel) {
                    parameters.unique.push(uRel[u]);
                }

                if(!parameters.orderBy) {
                    parameters.orderBy = [];
                }

                parameters.orderBy.push({
                    field: 'date',
                    sort: 'DESC'
                });

                filter = await self.__stageFilterMode(schObj, st, filter);
                if(filter) {
                    let fRes = await oldGet.call(self.__objects[st], [], filter, parameters, objInfo);
                    let pk = self.__getPK(self.__objects[st].__interface);
                    let pkValues = fRes.records[st].map(v => {
                        return v[pk];
                    });
                    if(pkValues.length === 0)
                        return {
                            records: {
                                [st]: []
                            }
                        };

                    let rFilter = {
                        comparisons:{
                            PK:{
                                left:{type:"field", value: pk},
                                right:{type:"value", value: pkValues},
                                sign: "in"
                            }
                        },
                        tree: {and:["PK"]}
                    };
                    delete parameters.unique;
                    return await oldGet.call(self.__objects[st], fields, rFilter, parameters, objInfo);
                }
                return {
                    records: {
                        [st]: []
                    }
                };
            };
            this.__objects[st].insert = async (values) => {
                let copyFilter = {
                    comparisons: {
                        PK: {
                            left: {
                                type: "field",
                                value: self.__objects[st].__getPK()
                            },
                            right: {
                                type: "value",
                                value: []
                            },
                            sign: "in"
                        }
                    },
                    tree: {
                        and: ["PK"]
                    }
                };
                let newValues = [];
                let oldRecords = [];

                // в фильтр захерачить значение поля pk
                if(values.length > 0) {
                    let stInfo = {
                        stage: st,
                        stageName: self.__objects[st].__interface.description
                    };
                    //await self.__objects[schemeInt.name].update(self.__getFilter(uRel, values), [stInfo], {});
                    let recordFilter = self.__getFilter(uRel, values);

                    let parameters = {
                        unique:[],
                        orderBy:[{
                            field: 'date',
                            sort: "DESC"
                        }]
                    };

                    for(let u in uRel) {
                        parameters.unique.push(uRel[u]);
                    }

                    oldRecords = (await oldGet.call(self.__objects[st], [], recordFilter.stage, parameters, {})).records[st];

                    copyFilter.comparisons.PK.right.value = oldRecords.map(r => r[self.__objects[st].__getPK()]);
                    //newValues = self.__filterRecords(values, oldRecords, parameters.unique);
                    newValues = self.__objects[st].filterRecords(values, oldRecords, parameters.unique);

                    await self.query(schemeInt.name, "update", {filter: recordFilter.schema, values: [stInfo]});
                }

                // ToDo: изменить на copy+insert
                let r = await oldInsert.call(self.__objects[st], newValues);
                if(oldRecords.length > 0) {
                    let copyRes = await self.query(st, "copy", {
                        filter: copyFilter,
                        parameters: {
                            copy: {
                                // не добавлять строку (copy)
                                clear: true
                            }
                        }
                    });
                    if(!r.tableDesc && copyRes.tableDesc){
                        r.tableDesc = copyRes.tableDesc
                    }
                    r.records[st] = _.assign(r.records[st], _.values(copyRes.records)).map(r => r.fields);
                }

                return r;
            };
            this.__objects[st].update = async (filter, values, parameters, objInfo) => {
                await self.__stageFilterMode(schObj, st, filter);
                if(filter) {
                    return await oldUpdate.call(self.__objects[st], filter, values, parameters, objInfo);
                }
                return {};
            };
            this.__objects[st].delete = async (filter, parameters, objInfo) => {
                await self.__stageFilterMode(schObj, st, filter);
                if(filter) {
                    return await oldDelete.call(self.__objects[st], filter, parameters,  objInfo);
                }
                return {};
            };
            this.__objects[st].toNext = async (filter, objInfo) => {
                let records = await oldToNext.call(this.__objects[st], filter, objInfo);
                let toUpdate = [];
                let structure = {
                    "toNextUpdate": [
                        {
                            "object": "query_position",
                            "comments" : [
                                "filterFields - поля для формирования фильтра, valuesFields - определяемые значения",
                                "Фильтр формируется по принципу объединения условий через AND",
                                "Каждое условие - сравнение поля filterFields[i].object у объекта object со значением поля filterFields[i].stage у объекта этапа",
                                "Пока доступно копирование значений полей только основного объекта в поля только указанного объекта",
                                "Указанные в качестве любого из имен полей 'сложные' имена будут проигнорированы"
                            ],
                            "filterFields": [{
                                "stage": "positionID",
                                "object": "positionID"
                            }],
                            "valuesFields": [{
                                "stage": "productID",
                                "object" : "productID"
                            }]
                        }
                    ]
                };

                let toNextUpdate = schemeInt.stages[st].toNextUpdate || [];
                for(let record of records.records[st]) {
                    for (let filter of toNextUpdate) {
                        // формирование фильтра
                        let updateFilter = {
                            comparisons: {},
                            tree: {
                                and: []
                            }
                        };
                        for(let comparison of filter.filterFields){
                            updateFilter.comparisons[comparison.object] = {
                                left: {
                                    type: "field",
                                    value: comparison.object
                                },
                                right: {
                                    type: "value",
                                    value: record[comparison.stage]
                                },
                                sign: "equal"
                            };
                            updateFilter.tree.and.push(comparison.object);
                        }

                        // формирование списка значений
                        let updateValues = {};
                        for(let field of filter.valuesFields){
                            updateValues[field.object] = record[field.stage];
                        }
                        toUpdate.push({
                            object: filter.object,
                            filter: updateFilter,
                            values: [updateValues]
                        });
                    }
                }


                console.log();
                // параллельная версия
                await Promise.all(toUpdate.map(updateData => {
                    return self.query(updateData.object, "update", {
                        filter: updateData.filter,
                        values: updateData.values
                    });
                }));


                // последовательная версия
                /*
                for(let data of toUpdate){
                    await self.query(data.object, "update", {
                        filter: data.filter,
                        values: data.values
                    });
                }
                */
                return records;
            };

            logger.write(`debug`, `Декораторы для этапа '${st}' созданы.`);
        }
    }
    /**
     * Перехватывает обращение к каталогу подписчиков
     * @param method Метод, обращение к которому перехватывается
     * @param parameters Параметры метода
     * @returns {Promise.<void>}
     * @private
     */
    async __catchQuery(method, parameters){
        // фиксируем имя каталога подписчиков
        let subRef = this.__interface.name+'_subscriberStorage';
        // вспомогательные переменные для обработки записей
        let records;
        let location;
        let object1;
        let object2;
        let method1;
        let method2;
        let description;
        let id;
        let ids;
        /**
         * перед вызовом нужно обработать параметры
         * нельзя навешивать подписчиков на каталог подписчиков
         */
        if (method === 'insert'){
            let index = _.findIndex(parameters.values, (item)=>{ return (item.object1 === subRef || item.object2 === subRef) });
            while (index >= 0){
                parameters.values.splice(index, 1);
                logger.write(`warning`, `Заблокирована попытка добавить подписчика, задействующего каталог подписчиков.`)
                index = _.findIndex(parameters.values, (item)=>{ return (item.object1 === subRef || item.object2 === subRef) });
            }
        }
        // выполняем запрос, запоминаем, что получилось
        let toReturn = await super.query(subRef, method, parameters);
        // если происходит вставка в каталог подписчиков, то добавляем подписку
        if (method === 'insert'){
            records = toReturn.records;
            for (let key in records){
                location = records[key].fields['location'];
                object1 = records[key].fields['object1'];
                object2 = records[key].fields['object2'];
                method1 = records[key].fields['method1'];
                method2 = records[key].fields['method2'];
                description = JSON.parse(records[key].fields['description']);
                id = records[key].fields['ID'];
                this.__addSubscriber(location, object1, method1, object2, method2, description, id);
            }
        } else if (method === 'update' || method === 'delete'){
            /**
             * Если идёт удаление/изменение, то дергаем из фильтра ID записей
             */
            for (let key in parameters.filter.comparisons){
                let isLeft = (parameters.filter.comparisons[key].left.type === 'field' && parameters.filter.comparisons[key].left.value === 'ID');
                let isRight = (parameters.filter.comparisons[key].right.type === 'field' && parameters.filter.comparisons[key].right.value === 'ID');
                if (isLeft || isRight){
                    if (isLeft){
                        ids = parameters.filter.comparisons[key].right.value;
                    } else if (isRight) {
                        ids = parameters.filter.comparisons[key].left.value;
                    }
                    if(!(ids instanceof Array)){
                        ids = [ids];
                    }
                    // нашли нужный comparison, выходим из цикла
                    break;
                }
            }
            if (method === 'update'){
                /**
                 * перебираем ключи, удаляем подписчиков
                 * затем пересоздаём их по результатам апдейта
                 */
                for (let sub of ids){
                    this.__deleteSubscriber(sub);
                }
                records = toReturn.records;
                for (let key in records){
                    location = records[key].fields['location'];
                    object1 = records[key].fields['object1'];
                    object2 = records[key].fields['object2'];
                    method1 = records[key].fields['method1'];
                    method2 = records[key].fields['method2'];
                    description = JSON.parse(records[key].fields['description']);
                    id = records[key].fields['ID'];
                    this.__addSubscriber(location, object1, method1, object2, method2, description, id);
                }
            } else if (method === 'delete'){
                /**
                 * перебираем ключи, удаляем подписчиков
                 */
                for (let sub of ids){
                    this.__deleteSubscriber(sub);
                }
            }
        }
        return toReturn;
    }
    /**
     * Метод, опосредованно вызывающий метод подобъекта с нужными параметрами.
     * @param object Имя подобъекта, к которому мы обращаемся.
     * @param method Метод, который будем вызывать.
     * @param parameters Объект, содержащий параметры метода, приведенные к стандартному виду.
     * @returns {Promise.<void>}
     */
    async query(object, method, parameters = {}){
        let subRef = this.__interface.name + '_subscriberStorage';
        // если у метода нет подписок, выполняем обычный query
        if(!this.__subExists(object, method)){
            // если идет обращение к каталогу подписчиков, перехватываем его, прежде, чем выполнить запрос
            if (object === subRef){
                logger.write(`debug`, `subscriberView.query: выполнение __catchQuery.`);
                let catchResult = await this.__catchQuery(method, _.cloneDeep(parameters));
                logger.write(`debug`, `subscriberView.query: __catchQuery выполнен.`);
                return catchResult;
            } else {
                logger.write(`debug`, `subscriberView.query: выполнение запроса к objectView.`);
                let queryResult = await super.query(object, method, parameters);
                logger.write(`debug`, `subscriberView.query: запрос выполнен.`);
                return queryResult;
            }
        }
        // если у метода есть подписчики, выполняем их
        // внимание, дальше идёт жесть
        // результат работы постподписчиков
        let post;
        // конечный результат работы декорированной функции
        let result;
        // сворачиваем аргументы подписанной функции в объект
        let wrappedArguments = _.cloneDeep(parameters);
        if (wrappedArguments.values){
            wrappedArguments.values = UniConverter.refineValues(wrappedArguments.values);
        }
        if (wrappedArguments.values){
            await this.__checkRun(object, method, _.cloneDeep(wrappedArguments.values));
        }
        // анализируем поля объекта, которые используют pre-, post- и rb- подписчики
        let grabbedFields = this.__grabFields(object, method);
        // Отделяем списки полей, которые будут использованы в запросах к объекту до и после вызова основной функции
        let oldFields = grabbedFields.old;
        let newFields = grabbedFields.new;

        logger.write(`debug`, `subscriberView.query: получение данных ДО действия.`);
        // достаём записи "ДО"
        let oldRecords = await this.__getDataBefore(object, method, oldFields, _.cloneDeep(wrappedArguments));
        logger.write(`debug`, `subscriberView.query: данные получены.`);

        // добавляем записи "ДО" в свёрнутые аргументы
        wrappedArguments['old'] = {
            records: UniConverter.compressRecords(oldRecords.records, 'old.records.')
        };
        // обработка предподписчиков, результат их выполнения сохраняем
        logger.write(`debug`, `subscriberView.query: запуск преподписчиков.`);
        let pre = await this.__preRun(object, method, _.cloneDeep(wrappedArguments));
        logger.write(`debug`, `subscriberView.query: преподписчики выполнены.`);

        // основная функция
        try {
            logger.write(`debug`, `subscriberView.query: выполнение запроса к objectView.`);
            result = await super.query(object, method, parameters);
            logger.write(`debug`, `subscriberView.query: запрос выполнен.`);
        } catch(e){
            logger.write(`error`, `Ошибка при выполнении основной функции ${object}.${method}.`, e);
            await this.__preRollback(object, method, pre);
            throw `Ошибка при выполнении основной функции ${object}.${method}.`;
        }
        // основная функция выполнена, идём дальше
        // получаем данные о состоянии объекта после выполнения главной функции
        logger.write(`debug`, `subscriberView.query: получение обновленных данных.`);
        let newRecords = await this.__getDataAfter(object, method, newFields, result);
        logger.write(`debug`, `subscriberView.query: данные получены.`);

        // добавляем записи "ПОСЛЕ" в свёрнутые аргументы
        wrappedArguments['new'] = {
            records: UniConverter.compressRecords(newRecords.records, 'new.records.')
        };
        // вызов постподписчиков
        try{
            logger.write(`debug`, `subscriberView.query: запуск постподписчиков.`);
            post = await this.__postRun(object, method, _.cloneDeep(wrappedArguments));
            logger.write(`debug`, `subscriberView.query: постподписчики выполнены.`);

            // Если у mF есть откатные подписчики, добавляем поле {rb: {}}
            if (/*this.__subs[object][method].rb.length*/this.__subExists(object, method, 'rb')){
                result = _.assign(result, {'rb': _.cloneDeep(wrappedArguments)});
            }
            return result;
        } catch(e){
            logger.write(`error`, `Ошибка при выполнении постподписчиков ${object}.${method}.`);
            try{
                // пытаемся откатить основную функцию
                if (/*this.__subs[object][method].rb.length*/this.__subExists(object, method, 'rb')){
                    await this.__rbRun(object, method, _.cloneDeep(wrappedArguments));
                }
            }
            catch(e1){
                logger.write(`error`,`Ошибка при откате основной функции ${object}.${method}.`);
                throw `Ошибка при откате основной функции ${object}.${method}.`;
            }
            try{
                await this.__preRollback(object, method, pre);
            }catch(e2){
                logger.write(`error`, `Ошибка при откате преподписчиков ${object}.${method}.`);
                throw `Ошибка при откате преподписчиков ${object}.${method}.`;
            }
            throw `Ошибка при выполнении постподписчиков ${object}.${method}.`;
        }
    }

    /**
     * Проверяет наличие в объектах o1 и o2 полей, указанных в отображении relation.
     * @param o1 Первый объект.
     * @param o2 Второй объект.
     * @param relation Хэш, хранящий сведения о том, в какое поле объекта o2 нужно передавать данные из полей объекта o1.
     * @private
     */
    __checkInterfaces(o1, o2, relation){
        logger.write(`debug`, `Выполняется сверка интерфейсов объектов ${o1} и ${o2}`);
        let keys = Object.keys(relation.fields);
        let ok = true;
        // перебираем поля relation, сопоставляем их с реальными объектами
        for (let i = 0; i < keys.length && ok; i++){
            ok = this.__checkField(o1, keys[i]) && this.__checkField(o2, relation.fields[keys[i]]);
        }
        return ok;
    }

    /**
     * Проверяет наличие поля fName у объекта oName или у его табличных частей.
     * @param oName Объект, в котором ищется поле.
     * @param fName Проверяемое поле.
     * @returns {*} Есть такое поле или нет.
     * @private
     */
    __checkField(oName, fName){
        /** ключ может начинаться с records.*** или с new/old.records.***
         *  в relation могут передаваться ключи, не имеющие отношения к объектам (при формировании фильтра),
         *  поэтому если попадается поле, которое не начинается с records/values, то возвращаем true
         */
        if (fName.indexOf('records.') === 0 || fName.indexOf('records.') === 4){
            return this.__checkRecordsField(oName, fName.substring(fName.indexOf('records.')+8));
        } else if (fName.indexOf('values') === 0){
            return this.__checkValuesField(oName, fName.substring(7));
        } else return true;
    }

    __checkValuesField(oName, fName){
        return (fName in this.__objects[oName].__interface.fields);
    }


    /**
     * Проверяет, может ли get из объекта oName вернуть выборку с полем fName
     * @param oName Проверяемый объект.
     * @param fName Проверяемое поле.
     * @private
     */
    __checkRecordsField(oName, fName){
        // вспомогательные переменные - имя поля, выделенное из fName и ссылка на проверяемый объект.
        let
                field,
                obj = this.__objects[oName];
        // если проверяется поле
        if (fName.indexOf('fields.') === 0){
            // вычленяем имя поля и проверяем, есть ли такое поле в объекте
            field = fName.substring(7);
            // если имя поля состоит из нескольких имён через точку, то это поле является ссылкой на другой объект
            if (field.split('.').length > 1){
                let firstField = field.split('.')[0];
                let currentType = obj.__interface.fields[firstField].type;
                return (
                    firstField in obj.__interface.fields &&
                    (currentType === 'link' || currentType === 'ref') &&
                    this.__checkRecordsField(obj.__interface.fields[firstField][currentType], field.split('.').slice(1).join('.'))
                );
            }
            // если имя поля состоит из 1 слова, то проверяем напрямую
            return (field in obj.__interface.fields);
            // если проверяется табличная часть
        } else if (fName.indexOf('refs.') === 0){
            // вычленяем название тч
            field = fName.match(/.{5}(\w*)/)[1];
            // проверяем, есть ли у объекта такая табличная часть и спускаемся ниже
            return (obj.__interface.refs.hasOwnProperty(field) && this.__checkRecordsField(field, fName.substring(field.length+6)));
        }
    }

    /**
     * Подготавливает объект relation, который будет сохраняться в структуру и закрепляться за подписчиком.
     * По ходу дела проверяет связываемые объекты на совместимость.
     * @param location Тип подписчика
     * @param object1 Первый объек в связке.
     * @param object2 Второй объект в связке.
     * @param relation Описание связки.
     * @returns {{}} Подготовленный объект.
     * @private
     */
    __prepareRelation(location, object1, object2, relation){
        // если отображение не прошло проверку или объекты несовместимы, кидаем ошибку
        if (location !== 'check' && !this.__checkInterfaces(object1, object2, relation)){
            logger.write(`warning`, `Интерфейсы объектов ${object1} и ${object2} несовместимы, добавление подписчика невозможно.`);
            throw `Интерфейсы объектов ${object1} и ${object2} несовместимы, добавление подписчика невозможно.`;
        }
        let result = {};
        let buf;
        let parameter;
        let sources = {};
        let selectionFilter = null;
        // сначала формируем поля
        for (let field in relation.fields){
            // определяем, из какого источника формируется параметр - new или old
            buf = field.match(/^\w*/)[0];
            // в рабочем relation new/old отрезаем от имени поля, чтобы не мешали при парсинге
            if (['new', 'old'].indexOf(buf) >=0){
                parameter = relation.fields[field].match(/^\w*/)[0];
                if (!sources[parameter]){
                    sources[parameter] = buf;
                } else {
                    if (sources[parameter] !== buf){
                        logger.write(`error`, `Ошибка при формировании одного параметра из разных источников.`);
                        throw `Ошибка при формировании одного параметра из разных источников.`;
                    }
                }
            }
        }
        // затем фильтр
        // если у подписчика есть условие отсева записей
        if (relation.condition){
            selectionFilter = new UniFilter(relation.condition);
        }
        // подключаем источник данных
        if (Object.keys(sources).length > 0){
            result.sources = sources;
        } else result.sources = null;

        // копируем поведение
        result.behavior = relation.behavior;
        // копируем поля
        result.fields = relation.fields;
        result.direct = relation.direct;
        // подключаем фильтр, если он есть
        if (selectionFilter) result.filter = selectionFilter;
        return result;
    }



    /**
     * Извлекает из объекта данные перед вызовом основной функции.
     * @param object Объект, к которому будем обращаться.
     * @param method Метод, подписка на который обрабатывается.
     * @param oldFields Поля, которые требуется достать.
     * @param args Аргументы основной функции, обернутвые в объект.
     * @returns {Promise.<*>} Результат запроса данных объекта.
     * @private
     */
    async __getDataBefore(object, method, oldFields, args){
        let params = Object.keys(args);
        let dataBefore;
        for (let i = 0; i < params.length; i++){
            if (['filter', 'fields'].indexOf(params[i]) < 0){
                delete args[params[i]];
            }
        }
        // если в параметрах метода отсутствует фильтр, то старые данные не запрашиваем
        if (!args.filter) return {records: {}};
        args.fields = args.fields ? args.fields.concat(oldFields) : oldFields;
        // запрашиваем информацию об объекте ДО вызова основной функции
        try {
            dataBefore = await this.query(object, 'get', args);
            return dataBefore;
        }
        catch(e){
            logger.write(`error`,`Не удалось запросить данные перед вызовом ${object}.${method}.`);
            throw `Не удалось запросить данные перед вызовом ${object}.${method}.`;
        }
    }

    /**
     * Извлекает из объекта данные после вызова основной функции.
     * @param object Объект, к которому будем обращаться
     * @param method Метод, подписка на который обрабатывается
     * @param newFields Поля, которые нужно получить в запросе.
     * @param mfResult Результат работы основной функции, который используется для формирования фильтра в запросе.
     * @returns {Promise.<*>} Результ запроса данных объекта.
     * @private
     */
    async __getDataAfter(object, method, newFields, mfResult){
        // если основная функция вернула пустой результат
        if (!mfResult || !mfResult.records || !Object.keys(mfResult.records).length){
            return {records: {}};
        }
        // аргументы filter/values/fields и т.д. для запроса к объекту
        let argsForGet = {fields: [], filter: {}};
        // формируем фильтр для отсеивания записей по результатам работы главной функции
        // отсев будет идти по первичному ключу
        let pk = this.__objects[object].__getPK();
        // фильтр по ID для отсеивания результатов после
        let idFilter = {
            'comparisons': {
                'idFilter': {
                    'left':{'type': 'field', 'value' : pk},
                    'sign':'in',
                    'right': {'type': 'value', 'value': []}
                }
            },
            'tree': {'and': ['idFilter']}
        };
        // заполняем значения для фильтра
        for (let key in mfResult.records){
            idFilter.comparisons.idFilter.right.value.push(mfResult.records[key].fields[pk]);
        }
        // фильтр готов, запрашиваем информацию об объекте повторно
        // поля подставляем новые
        if (newFields) argsForGet.fields = newFields;
        // фильтр дополняем
        // если idFilter не пустой
        if (idFilter.comparisons.idFilter.right.value.length){
            argsForGet.filter = idFilter;
        }
        // запрашиваем информацию об объекте ПОСЛЕ вызова основной функции
        try {
            return await this.query(object, 'get', argsForGet);
        }
        catch(e){
            logger.write(`error`,`Не удалось запросить данные после вызова ${object}.${method}.`);
            throw `Не удалось запросить данные после вызова ${object}.${method}.`;
        }
    }

    /**
     * Анализирует описания подписчиков для метода object.method, опеределяет,
     * какие поля нужны для запроса данных до вызова основной функции, а какие поля - после.
     * @param object Объект, подписчики которого анализируются.
     * @param method Метод анализируемого объекта, на который добавляется подписчик.
     * @returns {{old: Array, new: Array}} Сдвоенная структура, содержащая списки полей для запроса данных до и после вызова основной функции.
     * @private
     */
    __grabFields(object, method){
        let r;
        let refIndex;
        let out = {old: [], new: []};
        let hasRefs, noEntry;
        let locations = ['pre', 'post', 'rb'];
        let allFields = [];
        let fName;
        for (let location of locations){
            //let location = locations[L];
            if (/*this.__subs[object][method][location]*/ this.__subExists(object, method, location)){
                for (let i = 0; i < this.__subs[object][method][location].length; i++){
                    // достаём ссылку на relation
                    r = this.__subs[object][method][location][i].relation;
                    allFields = [];
                    // формируем полный список задействованных полей
                    // достаём из полей отображения
                    for (let f in r.fields){
                        allFields.push(f);
                    }
                    // если у подписчика есть сравнятор, то добавляем его поля в список
                    if (r.filter){
                        allFields = allFields.concat(r.filter.getFields());
                    }
                    // пул полей сформирован
                    // перебираем пул полей, достаём те, которые относятся к тч
                    for (let fName of allFields){
                        //fName = allFields[f];
                        /*
                            Если поле начинается с new/old, то оно имеет отношение к get до/после
                            вызова главной функции, остальные поля нас не интересуют (а вот и неправда, оставляем)
                        */
                        let parts = fName.split(".");
                        if (["new", "old"].indexOf(parts[0]) >= 0){
                            let newOldString = parts[0];
                            let fieldContent = parts.filter(part => part !== "fields").map(part => {
                                if(part === "refs"){
                                    return "ref";
                                }
                                return part;
                            }).slice(2);
                            let fieldName = fieldContent.join(".");
                            if ( fieldContent.length > 1 && out[ newOldString ].indexOf( fieldName ) < 0 ){
                                out[newOldString ].push( fieldName );
                            }
                        }
                    }
                    // список доп. полей для подписчика составлен
                }
                // конец перебора подписчиков локации
            }
        }
        // конец перебора локаций
        return out;
    }

    /**
     * Добавляет подписчик в очередь в соответствии с приоритетом
     * @param subscriber Описание подписчика, которое добавляется в структуру.
     * @param location Ссылка на узел структуры, в который будет добавлен подписчик.
     * @param priority Приоритет, принимает значения first, last, <числовой индекс>. Отрицательные индексы приводятся к нулю.
     * @private
     */
    __appendSubscriber(subscriber, location, priority){
        let p;
        // если приоритет указан, то проверяем не отрицательный ли он, тогда зануляем
        // если приоритет не указан, пишем last
        if (priority || priority === 0){
            p = (priority !== 'first' && priority !== 'last') ? (priority >= 0 ? priority : 0) : priority;
        } else p = 'last';
        // сохраняем приоритет в хэш
        subscriber.priority = p;
        // помещаем запись о подписчике в правильную позицию
        // если первый - в начало, если последний в конец
        if (p === 'first'){
            location.splice(0, 0, subscriber);
        } else if (p === 'last'){
            location.push(subscriber);
        } else {
        // если задан числовой индекс, то находим место
        // ищем позицию в массиве подписчиков, где заканчиваются подписчики с приоритетом first
            if(location.length < priority)
                priority = location.length;
            location.splice(priority, 0, subscriber);
            /*
            let i;
            let exit = false;
            for (i=0; i < location.length && !exit; i++){
                if (location[i].priority !== 'first') exit = true;
            }
            //ищем позицию, где начинаются подписчики с приоритетом last
            let firstShift = i-1;
            exit = false;
            for (i=location.length; i > 0 && !exit; i--){
                if (location[i-1].priority !== 'last') exit = true;
            }
            let lastShift = i;
            // границы массива, где лежат индексированные подписчики, определены
            // находим позицию и вставляем
            exit = false;
            for (i=firstShift; i <= lastShift+1 && !exit; i++){
                if (location[i].priority > p || location[i].priority === 'last') {
                    location.splice(i,0,subscriber);
                    exit = true;
                }
            }
            */
        }
    }

    /**
     * Подписывает метод m1 объекта o1 на метод m2 объекта o2 (метод o2.m2 называется подписчиком метода o1.m1).
     * @param location Показывает, когда должен выполниться подписчик - перед вызовом m2 или после. Возможные значения - 'pre'/'post'/'rb'
     * @param o1 Имя первого объекта (строка).
     * @param m1 Имя метода первого объекта, на который идет подписка.
     * @param o2 Имя второго объекта.
     * @param m2 Имя метода второго объекта (подписчика).
     * @param relation Хэш, содержащий отображение между аргументами или результатом m1 и аргументами m2.
     * @param key Идентификатор подписчика в каталоге.
     */
    __addSubscriber(location, o1, m1, o2, m2, relation, key){
        logger.write(`debug`, `Добавляется подписка метода ${o2}.${m2} на метод ${o1}.${m1}.`);
        // сначала убеждаемся, что связанные объекты и методы существуют
        if (!this.__objects[o1]) {
            logger.write(`warning`, `Объект ${o1} не найден, добавление подписчика невозможно`, new Error());
            throw `Объект ${o1} не найден, добавление подписчика невозможно`;
        }
        if (!this.__objects[o1][m1] || typeof this.__objects[o1][m1] !== 'function'){
            logger.write(`warning`, `Метод ${o1}.${m1} не найден, добавление подписчика невозможно`, new Error());
            throw `Метод ${o1}.${m1} не найден, добавление подписчика невозможно`;
        }
        // для проверяющих подписчиков второй объект не нужен
        if (location !== 'check') {
            if (!this.__objects[o2]) {
                logger.write(`warning`, `Объект ${o2} не найден, добавление подписчика невозможно`, new Error());
                throw `Объект ${o2} не найден, добавление подписчика невозможно`;
            }
            if (!this.__objects[o2][m2] || typeof this.__objects[o2][m2] !== 'function') {
                logger.write(`warning`, `Метод ${o2}.${m2} не найден, добавление подписчика невозможно`, new Error());
                throw `Метод ${o2}.${m2} не найден, добавление подписчика невозможно`;
            }
        }
        // проверки окончены
        // relation обрабатывается, чтобы при вызове подписчика все ссылки на данные и функции были на месте
        let summary = {
            key: key,
            location: location,
            fromObject: o1,
            fromMethod: m1,
            object: o2,
            method: m2,
            relation: this.__prepareRelation(location, o1, o2, relation)
        };
        // если у объекта o1 нет подписчиков, резервируем место
        if (!this.__subs[o1]) this.__subs[o1] = {};
        if (/*!this.__subs[o1][m1]*/!this.__subExists(o1, m1)) {
            this.__subs[o1][m1] = {check:[], pre: [], post: [], rb:[], uber:[]};
        }
        // добавляем подписчик в очередь в соответствии с приоритетом
        this.__appendSubscriber(summary, this.__subs[o1][m1][location], relation.priority);
        // добавляем подписчик также в словарь, чтобы иметь доступ по ключу
        this.__subsDict[key] = summary;
        logger.write(`debug`, `Добавлена подписка ${o2}.${m2} на ${o1}.${m1}.`);
    }

    /**
     * Удаляет подписчика по ключу
     * @param key Идентификатор подписчика из каталога
     * @private
     */
    __deleteSubscriber(key){
        if(!this.__subsDict[key]){
            return;
        }
        let summary = this.__subsDict[key];
        // читаем данные о подписчике
        let fromObject = summary.fromObject;
        let fromMethod = summary.fromMethod;
        let toObject = summary.object;
        let toMethod = summary.method;
        let location = summary.location;
        // удаляем подписчика из основной структуры
        this.__subs[fromObject][fromMethod][location].splice(_.findIndex(this.__subs[fromObject][fromMethod][location], (item)=>{return (item.key === key)}),1);
        // удаляем подписчика из словаря
        delete this.__subsDict[key];
        logger.write(`debug`, `Удалена подписка метода ${toObject}.${toMethod} на метод ${fromObject}.${fromMethod} по ключу ${key}`);
    }

    /**
     * Проверяет факт наличия подписки
     * @param object Объект, у которого ищем подписчиков
     * @param method Метод, у которого ищем подписчиков
     * @param location Разновидность подписчиков
     * @returns {boolean} Есть подписка или нет
     * @private
     */
    __subExists(object, method, location){
        return (
            this.__subs.hasOwnProperty(object) &&
            (!method || this.__subs[object].hasOwnProperty(method)) &&
            (!location || (this.__subs[object].hasOwnProperty(method) && this.__subs[object][method][location].length > 0))
        )
    }

    /**
     * Костыльный метод, создающий убер-подписчика для метода toNext, чтобы иметь возможность
     * передавать данные между табличными частями объектов (нужен потому, что с помощью insert нельзя вставлять
     * данные в объект вместе с содержимым).
     * Данный метод создаёт структуру отображения, в которой записано, что куда копируется.
     * Затем метод подменяет toNext, чтобы он копировал данные из тч в тч в соответствии со структурой.
     * Что за структура отображения и как она работает
     * relStructure = {
     *  object1 : { - объект o1, из которого тянем данные
     *      fields:{} - список полей объекта o1, которые копируются, по ключу содержится имя поля В которое копируем
     *  },
     *  refObj: {}, - указания, какая тч на какую тч ссылается; {ref1: ref2, ref3: ref4}
     *  fieldsForGet: [] - список полей, которые будем засовывать в get-запрос к объекту для получения данных,
     *  которые мы будем раскидывать между связанным объектом о2 и табличной частью
     *  ref1 : {fields: {...}}, - табличные части, участвующие в копировании; если из ref1 данные
     *  ref2 : {fields: {...}}    переходят в ref2, то поле fields содержит поля объекта ref2, в которые идет копирование
     *  }
     * @param o1
     * @param o2
     * @param relation
     * @returns {Promise.<void>}
     */
    async addUber(o1, o2, relation){
        try {
            let self = this;
            // структура отображения, формируемая из relation
            let rs = {refObj: {}, fieldsForGet: []};
            rs[o1] = {fields:{}};
            // перечень полей для get
            let fields = [];
            // позиция в имени поля, где находится слово refs
            let refIndex;
            // вспомогательная переменная для проверки, было ли такое поле уже записано
            let noEntry;
            // имена полей и табличных частей из(в) которых мы будем копировать данные
            let leftField;
            let rightField;
            let leftRefName;
            let rightRefName;
            //  дергаем поля для выборки из тч (из relation)
            // из relation формируем структуру отображения
            for (let f in relation.fields) {
                // находим позицию в имени поля, с которой начинается .refs.
                refIndex = f.search(/.refs./);
                // достаём список используемых полей из relation
                noEntry = (fields.indexOf(f.replace(/.fields./, '.').substring(refIndex + 1)) < 0);
                // если поле из relation указывает на использование тч, то это поле надо добавить в get для получения
                // дополнительных данных
                if (refIndex >= 0 && noEntry) {
                    // вычленяем имя поля и добавляем его в список
                    fields.push(f.replace(/.fields./, '.').substring(refIndex).replace(/.refs./, 'ref.'));
                }
                // считываем крайние до точки символы слева (поле, ИЗ которого копируем)
                leftField = f.match(/\w*$/)[0];
                // считываем крайние до точки символы справа (поле, В которое копируем)
                rightField = relation.fields[f].match(/\w*$/)[0];
                // если в описании поля не указана тч
                if (refIndex < 0) {
                    // для первого объекта пишем какое поле в какое копируем
                    rs[o1].fields[leftField] = rightField;
                    // пишем какой объект с каким связан
                    rs.refObj[o1] = o2;
                } else {
                    // если в описании указано копирование данных между табличными частями
                    // вычленяем имя левой тч
                    leftRefName = f.substring(refIndex + 6).match(/^\w*/)[0];
                    // имя правой тч
                    // находим, где оно начинается
                    refIndex = relation.fields[f].search(/.refs./);
                    rightRefName = relation.fields[f].substring(refIndex + 6).match(/^\w*/)[0];
                    // если нет такого поля в структуре - создаём
                    if (!rs[leftRefName]){
                        rs[leftRefName] = {fields:{}};
                        // если при копированни между ТЧ нужно проверять минимальное количество записей
                        if (relation.behavior && relation.behavior['checkMinQuantity']){
                            if (relation.behavior['checkMinQuantity'][leftRefName]){
                                rs[leftRefName].minQuantity =  relation.behavior['checkMinQuantity'][leftRefName];
                            }
                        }
                    }
                    // записываем какое поле в какое переименовать
                    rs[leftRefName].fields[leftField] = rightField;
                    // и из какой тч в какую вставлять
                    rs.refObj[leftRefName] = rightRefName;
                }
            }
            rs.fieldsForGet = fields;
            if (/*!this.__subs[o1]*/!this.__subExists(o1)) this.__subs[o1] = {};
            if (/*!this.__subs[o1]['toNext']*/!this.__subExists(o1, 'toNext'))
                this.__subs[o1]['toNext'] = {pre: [], post: [], rb: [], uber: []};
            this.__subs[o1]['toNext'].uber[0] = rs;
            let checker = relation.condition ? new UniFilter(relation.condition) : null;
            let oldToNext = this.__objects[o1].toNext;
            // закончено формирование и сохранение служебных данных
            this.__objects[o1].toNext = async function (filter) {
                let toReturn = await oldToNext.call(this, filter);
                // имя поля, являющегося первичным ключом
                let pk;
                // имя поля, являющегося внешним ключом
                let rk;
                // буферная запись хранения промежуточных данных перед вставкой значений
                let buf;
                // результат вставки - новая запись
                let newRecord;
                let relStructure = self.__subs[o1]['toNext'].uber[0];
                // делаем гет из о1 с полученными ранее полями, сохраняем результат в переменную
                let records = (await self.query(o1, 'get', {filter: filter, fields: relStructure.fieldsForGet})).records;
                // если у подписчика есть входная проверка, прогоняем записи через неё
                // если найдётся запись с ошибкой, ругаемся
                if (checker){
                    let toCheck = UniConverter.compressRecords(records, 'old.records.');
                    for (let key in toCheck){
                        if (checker.checkRecord(toCheck[key])){
                            throw checker.errorText || `Произошла ошибка при обращении к объекту, проверьте входные данные.`;
                        }
                    }
                }

                // перебираем выборку, для каждой записи делаем вставку в o2
                pk = self.__objects[o1].__getPK();
                // перебираем полученную выборку и переносим данные
                let skipRecord;
                // ToDo: здесь надо переписать, чтобы добавлять записи в каждый объект по одному разу
                for (let key in records) {
                    skipRecord = false;
                    // делаем проверку на минимальное кол-во записей в тч
                    for (let t in relStructure.refObj){
                        if (t === o1) continue;
                        // если для данной тч определно минимальное количество записей, то проверяем
                        if (relStructure[t].minQuantity){
                            // если в записи нет такой табличной части или кол-во записей меньше требуемого, то эта запись будет пропущена
                            if (!records[key].refs || !records[key].refs[t] || Object.keys(records[key].refs[t]) < relStructure[t].minQuantity){
                                skipRecord = true;
                            }
                        }
                    }
                    // если у записи не хватает записей в тч, пропускаем её
                    if (skipRecord){
                        continue;
                    }
                    buf = {};
                    // формируем записи для вставки данных в основной объект
                    for (let f in records[key].fields) {
                        // переносим значение в буферную запись
                        // имя поля во вставляемой записи получаем из структуры отображения, если оно там указано
                        if (relStructure[o1].fields[f]){
                            // ToDO: костыль
                            if(typeof records[key].fields[f] !== "object" || records[key].fields[f] === null) {
                                buf[relStructure[o1].fields[f]] = records[key].fields[f];
                            }
                            else{
                                buf[relStructure[o1].fields[f]] = Object.keys(records[key].fields[f])[0];
                            }
                        }
                    }
                    // вставляем новую запись с переименованными полями во второй главный объект
                    newRecord = await self.query(o2, 'insert', {values: [buf]});
                    newRecord = newRecord.records[Object.keys(newRecord.records)[0]];
                    // вставляем данные в табличные части
                    // перебираем тч, указанные в структуре отображения
                    for (let t in relStructure.refObj) {
                        if (t === o1) continue;
                        // получаем имя поля, через которое тч, в которую мы копируем данные, ссылается на вышестоящий объект
                        rk = self.__objects[relStructure.refObj[t]].__getRefKey();
                        // если данные для тч, ИЗ которой копируются данные, есть в записи из выборки
                        // то переносим эти данные в переименованное поле другой тч
                        if (records[key].refs && records[key].refs[t]) {
                            let recordsForInsert = [];
                            for (let trec in records[key].refs[t]) {
                                buf = {};
                                for (let field in relStructure[t].fields) {
                                    buf[relStructure[t].fields[field]] = records[key].refs[t][trec].fields[field];
                                }
                                // достаём из новой записи значение ПК, чтобы сделать корректную ссылку из тч наверх
                                buf[rk] = newRecord.fields[pk];
                                recordsForInsert.push(buf);
                            }
                            await self.query(relStructure.refObj[t], 'insert', {values: recordsForInsert});
                        }
                        // закончен перебор записей в тч
                    }
                    // закончен перебор тч
                }
                return toReturn;
                // закончен перебор записей из гет
            };
        }
        catch(e){
            console.log(e)
        }
        // конец декоратора
    }

    /**
     * Запускает подписчиков предобработки, которые проверяют входящие значения метода.
     * Фишка этого метода в том, что во входящих параметрах могут приходить ID других объектов,
     * на которые ссылается текущий объект; метод умеет получать данные об этих связанных объектах и
     * валидировать их.
     * Значения, попадающие в параметр values, уже прошли предобработку и их можно анализировать;
     * Если условие проверки анализирует значения полей самого объекта, то всё хорошо, однако условие может проверять
     * данные связанных объектов, например объект А имеет поле B_ID, ссылающееся на объект B; условие может требовать
     * проверку значения поля field1 в объекте B, т.е. иметь примерно такой вид values.b_ID.field1 > 10.
     * Для этого случая нужно обратиться к связанному объекту и получить его данные, затем дополнить список
     * проверяемых полей таким образом, чтобы сравнятор корректно их обработал.
     * @param object Объект, на метод которого идёт проверка.
     * @param method Метод, аргументы которого проверяются
     * @param values
     * @returns {Promise.<void>}
     * @private
     */
    async __checkRun(object, method, values){
        if (!this.__subExists(object, method, 'check')){
            return;
        }
        // 1. формируем список полей для дополнительно обработки
        // это список полей
        let allFields = [];
        // это структура соответствия, которая будет использоваться при обращении к внешним объектам
        let links = {};
        // перебираем подписчиков проверки
        // поля, используемые сравнятором подписчика
        let subFields;
        for (let i in this.__subs[object][method].check){
            // список полей сбрасываем
            subFields = [];
            // если у подписчика есть условие отсева, дёргаем поля из этого условия
            if (this.__subs[object][method].check[i].relation.filter) {
                subFields = this.__subs[object][method].check[i].relation.filter.getFields();
            }
            /**
             * поле обрабатывается дальше, если:
             * его имя начинается с values;
             * оно ещё не занесено в список;
             * оно содержит ссылку на другой связанный объект.
             */
            // перебираем поля из условия
            for (let field in subFields){
                // например, подписчик проверяет значение поля values.productID.isGroup
                let hasValues = (subFields[field].indexOf('values.') === 0);
                let noEntry = (allFields.indexOf(subFields[field])  === -1);
                // поле является связанным, если имеет вид типа values+productID+isGroup
                let isLinked = (subFields[field].split('.').length === 3);
                if (hasValues && noEntry && isLinked){
                    // запоминаем, что такое поле мы уже обработали
                    allFields.push(subFields[field]);
                    // достаём имя ссылочного поля из values, которое содержит значение ПК
                    // получится values.productID
                    // todo а получше синтаксиса нет? а то страшно
                    let linkedField = subFields[field].split('.')[0]+'.'+subFields[field].split('.')[1];
                    // узнаём, на какой объект это поле ссылается
                    let linkedObject = this.__objects[object].__interface.fields[linkedField.split('.')[1]].link;
                    // сохраняем структуру, ключом служит имя связанного объекта, к которому будем обращаться
                    if (!links[linkedObject]){
                        // заряжаем фильтр для запроса
                        let filter = {
                            comparisons:{
                                'PK':{
                                    left:  {type: 'field', value: this.__objects[linkedObject].__getPK()},
                                    right: {type: 'value', value: null},
                                    sign: 'equal'
                                }
                            },
                            tree:{'and': ['PK']}
                        };
                        // сохраняем структуру
                        links[linkedObject] = {linkedField: linkedField, fieldsToCheck: [], filter: filter};
                    }
                    // добавляем имя поля, которое пойдёт в дополнение
                    // получится isGroup
                    links[linkedObject].fieldsToCheck.push(subFields[field].split('.')[2]);
                }
            }
            // конец перебора полей
        }
        // конец перебора подписчиков
        // 2. дополняем values новыми полями
        // в эту переменную будем копировать фильтр из структуры соответствия, потом будем заполнять у него значение поля
        let requestFilter;
        // в эту переменную сохраняем значение ПК, по которому пойдёт get в объект
        let key;
        // сюда будем сохранять результат get-запроса к объекту
        let records;
        // имя поля, добавляемого в values
        let fieldToAdd;
        for (let i in values){
            // перебираем внешние объекты, дёргаем данные из них
            for (let obj in links){
                // дергаем фильтр из структуры, заполняем ему поле в условии
                requestFilter = _.cloneDeep(links[obj].filter);
                // читаем значение первичного ключа, по которому будем искать
                key = values[i][links[obj].linkedField];
                requestFilter.comparisons['PK'].right.value = key;
                // делаем запрос к объекту
                records = (await this.query(obj, 'get', {fields:[], filter: requestFilter})).records;
                for (let j in links[obj].fieldsToCheck){
                    // собираем имя добавляемого поля
                    // получится values.productID + isGroup
                    fieldToAdd = links[obj].linkedField+'.'+links[obj].fieldsToCheck[j];
                    // добавляем поле в values и дергаем значение из records
                    values[i][fieldToAdd] = records[key].fields[links[obj].fieldsToCheck[j]];
                }
            }
            // 3. Прогоняем values через сравнятор подписчика
            // если хотя бы одна запись вылетела, ругаемся
            for (let sub in this.__subs[object][method].check){
                if (this.__subs[object][method].check[sub].relation.filter.checkRecord(values[i])){
                    throw `Невозможно выполнить метод ${object}.${method}, не выполнены предварительные условия.`
                }
            }
        }
    }

    // запуск предподписчиков
    async __preRun(o, m, args){
        logger.write(`debug`, `Вызов преподписчиков ${o}.${m}.`);
        if (!(this.__objects[o] && this.__objects[o][m])){}
        let preResult = [];
        let object;
        let method;
        let relation;
        let converted = [];
        // прогоняем массив подписчиков
        // преобразуем входные данные в соответствии с отображением
        for (let i = 0; i <  this.__subs[o][m].pre.length; i++){
            object = this.__subs[o][m].pre[i].object;
            method = this.__subs[o][m].pre[i].method;
            relation = this.__subs[o][m].pre[i].relation;
            converted.push(UniConverter.convertByRelation(args, relation));
            // проверяем, выгреб ли подписчик все данные, если есть такая директива
            if (relation.behavior && relation.behavior['emptyOnEnd'] && relation.behavior['emptyOnEnd'].length){
                for (let j in relation.behavior['emptyOnEnd']){
                    if (Object.keys(args[relation.behavior['emptyOnEnd'][j]]).length > 0){
                        logger.write(`error`, `После подготовки данных для подписчика ${object}.${method} остались неиспользованные данные.`);
                        throw `После подготовки данных для подписчика ${object}.${method} остались неиспользованные данные.`;
                    }
                }
            }
        }
        // после того, как преобразование закончено, вызываем подписчиков, отправляя им преобразованные данные
        try{
            for (let i = 0; i <  this.__subs[o][m].pre.length; i++){
                object = this.__subs[o][m].pre[i].object;
                method = this.__subs[o][m].pre[i].method;
                preResult.push(await this.query(object, method, converted[i]));
            }
            logger.write(`debug`, `Работа преподписчиков ${o}.${m} успешно завершена.`);
            return preResult;
        // если какой-то подписчик не выполнился, откатываем те, которые выполнились
        } catch(e) {
            logger.write(`error`, `Преподписчики ${o}.${m} выполнены с ошибкой.`, e);
            for (let i = 0; i < preResult.length; i++){
                // если часть подписчиков не сработала, откатываем те, которые сработали
                object = this.__subs[o][m].pre[i].object;
                method = this.__subs[o][m].pre[i].method;
                // вызываем откатные подписчики для отменяемого подписчика (О_О)
                await this.__rbRun(object, method, preResult[i]);
            }
            throw `Преподписчики ${o}.${m} выполнены с ошибкой.`;
        }

    }

    // запуск постподписчиков
    async __postRun(o, m, args){
        logger.write(`debug`, `Вызов постподписчиков ${o}.${m}.`);
        if (!(this.__objects[o] && this.__objects[o][m])){
            logger.write(`error`, `Метод ${o}.${m} не найден.`);
            throw "";
        }
        let postResult = [];
        let object;
        let method;
        let relation;
        let converted = [];
        // перевариваем входные данные
        for (let i = 0; i <  this.__subs[o][m].post.length; i++) {
            object = this.__subs[o][m].post[i].object;
            relation = this.__subs[o][m].post[i].relation;
            method = this.__subs[o][m].post[i].method;
            converted.push(UniConverter.convertByRelation(args, relation));
            if (relation.behavior && relation.behavior['emptyOnEnd'] && relation.behavior['emptyOnEnd'].length){
                for (let j in relation.behavior['emptyOnEnd']){
                    if (Object.keys(args[relation.behavior['emptyOnEnd'][j]]) > 0){
                        logger.write(`error`, `После подготовки данных для подписчика ${object}.${method} остались неиспользованные данные.`);
                        throw `После подготовки данных для подписчика ${object}.${method} остались неиспользованные данные.`;
                    }
                }
            }
        }
        // выполняем постподписчиков, отдавая им переработанные данные
        try{
            for (let i = 0; i <  this.__subs[o][m].post.length; i++) {
                object = this.__subs[o][m].post[i].object;
                method = this.__subs[o][m].post[i].method;
                postResult.push(await this.query(object, method, converted[i]));
            }
            logger.write(`debug`, `Работа постподписчиков ${o}.${m} успешно завершена.`);
            return postResult;
        } catch(e) {
            logger.write(`error`, `Постподписчики ${o}.${m} выполнились с ошибкой.`);
            for (let i = 0; i < postResult.length; i++){
                // если часть подписчиков не сработала, откатываем те, которые сработали (в обратном порядке)
                object = this.__subs[o][m].post[i].object;
                method = this.__subs[o][m].post[i].method;
                // вызываем откатные подписчики для отменяемого подписчика (О_О)
                await this.__rbRun(object, method, postResult[i]);
            }
            throw e;
        }
    }

    // запуск подписчиков отмены
    async __rbRun(o, m, data){
        if (/*!this.__subs[o] || !this.__subs[o][m] || !this.__subs[o][m].rb.length*/!this.__subExists(o, m, 'rb')){
            logger.write(`warning`, `Не найдены подписчики для отката ${o}.${m}`);
            return `Не найдены подписчики для отката ${o}.${m}`;
        }
        logger.write(`debug`, `Откат ${o}.${m}.`);
        // перебираем подписчиков отката для этого метода, вызываем их, преобразовывая аргументы по отображению
        let object;
        let method;
        let relation;
        let converted;
        try{
            for (let i = 0; i < this.__subs[o][m].rb.length; i++){
                object = this.__subs[o][m].rb[i].object;
                relation = this.__subs[o][m].rb[i].relation;
                method = this.__subs[o][m].rb[i].method;
                converted = UniConverter.convertByRelation(data, relation);
                await this.query(object, method, converted);
            }
        }catch(e){
            logger.write(`error`, `Ошибка при выполнении функции отката для ${o}.${m}.`);
            throw `Ошибка при выполнении функции отката для ${o}.${m}.`;
        }
    }

    // откат предподписчиков
    async __preRollback(o,m, res){
        logger.write(`debug`, `Откат преподписчиков ${o}.${m}.`);
        // перебираем всех предподписчиков, запрашиваем все откатные функции, вызываем их, передавая res туда
        let object;
        let method;
        try{
            for (let i = 0; i < this.__subs[o][m].pre.length; i++){
                object = this.__subs[o][m].pre[i].object;
                method = this.__subs[o][m].pre[i].method;
                // вызываем откат для подписчика
                await this.__rbRun(object, method, res[i]);
            }
            logger.write(`debug`, `Выполнен откат преподписчиков ${o}.${m}.`);
        } catch (e){
            logger.write(`error`, `При откате преподписчиков ${o}.${m} возникла ошибка.`);
            throw Promise.reject();
        }
    }

    // откат постподписчиков
    async __postRollback(o,m, res){
        logger.write(`debug`, `Откат постподписчиков ${o}.${m}.`);
        if (!(this.__objects[o] && this.__objects[o][m])){
            logger.write(`error`, `Метод ${o}.${m} не найден.`);
            throw Promise.reject();
        }
        // перебираем всех предподписчиков, запрашиваем все откатные функции, вызываем их, передавая res туда
        let object;
        let method;
        try{
            for (let i = 0; i < this.__subs[o][m].post.length; i++){
                object = this.__subs[o][m].post[i].object;
                method = this.__subs[o][m].post[i].method;
                // вызываем откат для подписчика
                await this.__rbRun(object, method, res[i]);
            }
            logger.write(`debug`, `Выполнен откат постподписчиков ${o}.${m}.`);
        } catch (e){
            logger.write(`error`, `При откате постподписчиков ${o}.${m} возникла ошибка.`);
            throw Promise.reject();
        }
    }

    /**
     * Преобразует набор параметров p1, p2 .. pN метода m объекта o в объект с полями p1, p2 ... pN
     * @param o Объект, метод которого обрабатывается.
     * @param m Метод, аргументы которого оборачиваюся в объект.
     * @param args Значения, которые были переданы в метод.
     * @private
     */
    __wrapArguments(o, m, args){
        let res = {};
        let p = this.__objects[o].__interface.methods[m].parameters;
        for (let i=0; i < p.length; i++){
            if (p[i].name === 'values'){
                res[p[i].name] = UniConverter.refineValues(_.cloneDeep(args[i]));
            } else res[p[i].name] = _.cloneDeep(args[i]);
        }
        return res;
    }
}

export {SubscriberView as subscriberView};