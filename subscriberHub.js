'use strict';

import {logger} from './Logger/controller';
import _ from "lodash";

class UniFilter{
    constructor(description){
        // на вход конструктора приходит фильтр, из него создаётся дерево сравнений
        this.description = description;
        // ссылка на корень дерева сравнения
        this.tree = this.buildTree(this.description.tree);
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
            comp = this.description.comparisons[context];
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
        return this.tree.check(record)
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
            // костылик
            let emptyValues = [null, 0, "''", ""];
            if(rightOperand === null) {
                if (emptyValues.indexOf(leftOperand) >= 0)
                    leftOperand = null;
            }else if(leftOperand === null) {
                if (emptyValues.indexOf(rightOperand) >= 0)
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
        if (typeof value === 'string'){
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
        if (['equal', 'unEqual', 'greaterEq', 'lessEq'].indexOf(sign)>=0){
            switch(sign){
                case 'equal': translatedSign = '==='; break;
                case 'unEqual': translatedSign = '!=='; break;
                case 'greaterEq': translatedSign = '>='; break;
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
class SubscriberHub{
    constructor(){
        // Хэш для регистрации подписок объектов друг на друга.
        this.__subs = {};
        // хэш для хранения ссылок на объекты
        this.__objects = {};
    }

    // заглушка, настоящий метод живёт в objectView
    async query(){}

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
        let field, obj = this.__objects[oName];
        // если проверяется поле
        if (fName.indexOf('fields.') === 0){
            // вычленяем имя поля и проверяем, есть ли такое поле в объекте
            field = fName.substring(7);
            return (field in obj.__interface.fields);
            // если проверяется табличная часть
        } else if (fName.indexOf('refs.') === 0){
            // вычленяем название тч
            field = fName.match(/\w{5}(\w*)/)[0];
            // проверяем, есть ли у объекта такая табличная часть и спускаемся ниже
            return (obj.__interface.refs.hasOwnProperty(field) && this.__checkRecordsField(field, fName.substring(field.length+6)));
        }
    }

    /**
     * Подготавливает объект relation, который будет сохраняться в структуру и закрепляться за подписчиком.
     * По ходу дела проверяет связываемые объекты на совместимость.
     * @param object1 Первый объек в связке.
     * @param object2 Второй объект в связке.
     * @param relation Описание связки.
     * @returns {{}} Подготовленный объект.
     * @private
     */
    __prepareRelation(object1, object2, relation){
        // если отображение не прошло проверку или объекты несовместимы, кидаем ошибку
        if (!this.__checkInterfaces(object1, object2, relation)){
            logger.write(`warning`, `Интерфейсы объектов ${o1} и ${o2} несовместимы, добавление подписчика невозможно.`);
            throw `Интерфейсы объектов ${o1} и ${o2} несовместимы, добавление подписчика невозможно.`;
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
        // подключаем фильтр, если он есть
        if (selectionFilter) result.filter = selectionFilter;
        return result;
    }

    /**
     * Сжимает выборку, полученную в результате get в кортежи, объединяя записи табличных частей
     * @param struct Обрабатываемая структура.
     * @param prefix Префикс, с помощью которого алгоритм определяет, на каком уровне структуры он находится.
     * @returns {{} Набор кортежей из выборки.
     * @private
     */
    static compressRecords(struct, prefix='records.'){
        let res = {};
        let deepRes;
        let buf;
        let rKey;
        let fKey;
        let keys = Object.keys(struct);
        let newKey = 0;
        logger.write(`debug`, `Выполняется сжатие записей.`);
        // перебираем записи в структуре
        for (let i = 0; i < keys.length; i++){
            buf = {fields: {}};
            deepRes = {};
            // перебор табличных частей
            for (let ref in struct[keys[i]].refs){
                // табличная часть может быть пустой, ставим проверку, чтобы не прогонять метод вхолостую
                if (Object.keys(struct[keys[i]].refs[ref]).length){
                    // формируем ключ - полный путь к табличной части
                    rKey = prefix+'refs.'+ref;
                    // если табличных частей несколько, то объединяем результат их обхода с помощью декартова произведения
                    if (Object.keys(deepRes).length){
                        deepRes = SubscriberHub.getCartesianProduct(deepRes, SubscriberHub.compressRecords(struct[keys[i]].refs[ref], rKey+'.'));
                    } else deepRes = SubscriberHub.compressRecords(struct[keys[i]].refs[ref], rKey+'.');
                }
            }
            // перебор полей в записи
            for (let field in struct[keys[i]].fields){
                // если поле содержит обычные данные
                // сверяемся со схемой и сохраняем данные из поля в буфер, переименовывая ключ в соответствии со схемой
                fKey = prefix+'fields.'+field;
                buf.fields[fKey] = struct[keys[i]].fields[field];
                if (buf.fields[fKey] instanceof Date){
                    buf.fields[fKey] = buf.fields[fKey].toLocaleDateString();
               }
            }
            // если функция рекурсивно спускалась вниз, то полученные оттуда записи нужно дополнить данными, надёрганными из других полей
            // затем !дополняем! результирующий массив обработанными записями
            if (Object.keys(deepRes).length){
                for (let k in deepRes) {
                    for (let f in buf.fields) {
                        deepRes[k].fields[f] = buf.fields[f];
                    }
                }
                res = SubscriberHub.concatCollections(res, deepRes);
            } else {
                // если функция не спускалась дальше (мы на самом нижнем уровне), то добавляем в результирующий массив переработанную запись
                res[newKey] = buf;
                newKey++;
            }
        }
        return res;
    }

    static concatCollections(c1, c2){
        const keys1 = Object.keys(c1);
        const keys2 = Object.keys(c2);
        let newKey = 0;
        let result = {};
        for (let i = 0; i < keys1.length; i++){
            result[newKey] = c1[keys1[i]];
            newKey++;
        }
        for (let j = 0; j < keys2.length; j++){
            result[newKey] = c2[keys2[j]];
            newKey++;
        }
        return result;
    }

    /**
     * Вспомогательный метод, формирует декартово произведение 2 наборов записей
     * @param struct1 Первая выборка.
     * @param struct2 Вторая выборка.
     * @returns {{}} Объединённый набор записей.
     */
    static getCartesianProduct(struct1, struct2){
        let buf;
        let result = {};
        let keys1 = Object.keys(struct1);
        let keys2 = Object.keys(struct2);
        let newKey = 0;
        for (let i = 0; i < keys1.length; i++){
            for (let j = 0; j < keys2.length; j++){
                buf = {};
                for (let field1 in struct1[keys1[i]].fields){
                    buf[field1] = struct1[keys1[i]].fields[field1];
                }
                for (let field2 in struct2[keys2[j]].fields){
                    buf[field2] = struct2[keys2[j]].fields[field2];
                }
                result[newKey] = buf;
                newKey++;
            }
        }
        return result;
    }

    static refineValues(source){
        let result = {};
        for (let i = 0; i < source.length; i++){
            result[i] = {};
            for (let field in source[i]){
                result[i]['values.'+field] = source[i][field];
            }
        }
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
            return await this.query(object, 'get', args);
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
        if (!mfResult || !mfResult.records || !mfResult.records.length){
            return {records: {}};
        }
        // заполняем значения для фильтра
        for (let i = 0; mfResult.records && i < mfResult.records.length; i++){
            idFilter.comparisons.idFilter.right.value.push(mfResult.records[i].fields[pk]);
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
     * Анализирует описания подписчиков для метода object.method, опеределяет, какие поля нужны для запроса данных до вызова основной функции,
     * а какие поля - после.
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
        let locations = ['post', 'rb'];
        for (let L in locations){
            let location = locations[L];
            if (this.__subs[object][method][location]){
                for (let i = 0; i < this.__subs[object][method][location].length; i++){
                    r = this.__subs[object][method][location][i].relation;
                    for (let f in r.fields){
                        refIndex = f.search(/.refs./);
                        hasRefs = (refIndex >= 0);
                        noEntry = (out[f.match(/^\w{3}/)[0]].indexOf(f.replace(/.fields./, '.').substring(refIndex+1)) < 0);
                        if (hasRefs && noEntry){
                            out[f.match(/^\w{3}/)[0]].push(f.replace(/.fields./, '.').substring(refIndex).replace(/.refs./,'ref.'));
                        }
                    }
                }
            }
        }
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
            location.splice(priority > location.length ? location.length : priority, 0, subscriber);
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
     * @param priority Приоритет выполнения подписчика (first, last, <index>);
     */
    async addSubscriber(location, o1, m1, o2, m2, relation, priority){
        logger.write(`debug`, `Добавляется подписка метода ${o2}.${m2} на метод ${o1}.${m1}.`);
        let self = this;
        let mainFunctioin;
        // сначала убеждаемся, что связанные объекты и методы существуют
        if (!this.__objects[o1]) {
            logger.write(`warning`, `Объект ${o1} не найден, добавление подписчика невозможно`);
            return Promise.resolve();
        }
        if (!this.__objects[o2]){
            logger.write(`warning`, `Объект ${o2} не найден, добавление подписчика невозможно`);
            return Promise.resolve();
        }
        if (!this.__objects[o1][m1] || typeof this.__objects[o1][m1] !== 'function'){
            logger.write(`warning`, `Метод ${o1}.${m1} не найден, добавление подписчика невозможно`);
            return Promise.resolve();
        }
        if (!this.__objects[o2][m2] || typeof this.__objects[o2][m2] !== 'function'){
            logger.write(`warning`, `Метод ${o2}.${m2} не найден, добавление подписчика невозможно`);
            return Promise.resolve();
        }
        // проверки окончены

        // если у объекта o1 нет подписчиков, резервируем место
        if (!this.__subs[o1]) this.__subs[o1] = {};
        if (!this.__subs[o1][m1]) {
            this.__subs[o1][m1] = {pre: [], post: [], rb:[]};
            // создаём декорирующую функцию, которая будет вызывать подписчиков
            mainFunctioin = this.__objects[o1][m1];
            this.__objects[o1][m1] = async function(){
                // результат работы преподписчиков
                let pre;
                // результат работы постподписчиков
                let post;
                // результат работы основной функции
                let res;
                // дополнительные поля для запроса к объекту
                let grabbedFields;
                // поля для запроса "ДО"
                let oldFields;
                // поля для запроса "ПОСЛЕ"
                let newFields;
                // записи "ДО"
                let oldRecords;
                // записи "ДО"
                let newRecords;
                // объединённая структура для записей ДО и ПОСЛЕ
                let newOld;
                // конечный результат работы декорированной функции
                let final;
                // сворачиваем аргументы подписанной функции в объект
                let wrappedArguments = self.__wrapArguments(o1, m1, arguments);
                // обработка предподписчиков, результат их выполнения сохраняем
                pre = await self.__preRun(o1, m1, _.cloneDeep(wrappedArguments));
                // анализируем поля объекта, которые используют post- и rb- подписчики
                grabbedFields = self.__grabFields(o1, m1);
                // получаем списки полей, которые будут использованы в запросах к объекту до и после вызова основной функции
                oldFields = grabbedFields.old;
                newFields = grabbedFields.new;
                // анализируем входные аргументы основной функции
                // т.к. get использует только filter и fields, остальные поля удаляем
                oldRecords = await self.__getDataBefore(o1, m1, oldFields, _.cloneDeep(wrappedArguments));
                // основная функция
                try {
                    res = await mainFunctioin.apply(self.__objects[o1], arguments);
                } catch(e){
                    logger.write(`error`, `Ошибка при выполнении основной функции ${o1}.${m1}, откат действия.`);
                    await self.__preRollback(o1, m1, pre);
                    throw e;
                }
                // основная функция выполнена, идём дальше
                newRecords = await self.__getDataAfter(o1, m1, newFields, res);
                // объединяем старые и новые записи в одну структуру и убираем древовидность
                newOld = {'new': {records: SubscriberHub.compressRecords(newRecords.records, 'new.records.')}, 'old': {records: SubscriberHub.compressRecords(oldRecords.records, 'old.records.')}};
                // вызов постподписчиков
                try{
                    post = await self.__postRun(o1, m1, _.cloneDeep(newOld));
                    // Модифицируем результат работы функции
                    // Если основная функция вернула массив, заворачиваем его в {records: []}
                    if (Array.isArray(res)){
                        final = {records: res.slice()};
                    } else {
                        // Если mF вернула объект, дополняем его
                        final = _.cloneDeep(res);
                    }
                    // Если у mF есть откатные подписчики, добавляем поле {rb: {}}
                    // В поле rb кладем скопированную при помощи _ структуру new-old
                    if (self.__subs[o1][m1].rb.length){
                        final.rb = _.cloneDeep(newOld);
                    }
                    return final;
                } catch(e){
                    logger.write(`error`, `Ошибка при выполнении постподписчиков ${o1}.${m1}, откат действия.`);
                    try{
                        await self.__rbRun(o1, m1, newOld);
                    }catch(e1){
                        logger.write(`error`, `Ошибка при откате ${o1}.${m1}.`);
                        throw e1;
                    }
                    try{
                        await self.__preRollback(o1, m1, pre);
                    }catch(e2){
                        logger.write(`error`, `Ошибка при откате преподписчиков ${o1}.${m1}.`);
                        throw e2;
                    }
                    return {};
                }
            }
        }

        // добавляем в дерево подписчиков ссылку на o2.m2
        // relation обрабатывается, чтобы при вызове подписчика все ссылки на данные и функции были на месте
        let summary = {object: o2, method: m2, relation: this.__prepareRelation(o1, o2, relation)};
        // добавляем подписчик в очередь в соответствии с приоритетом
        this.__appendSubscriber(summary, this.__subs[o1][m1][location], priority);
        logger.write(`debug`, `Добавлена подписка ${o2}.${m2} на ${o1}.${m1}.`);
    }

    // запуск предподписчиков
    async __preRun(o, m, args){
        logger.write(`debug`, `Вызов преподписчиков ${o}.${m}.`);
        if (!(this.__objects[o] && this.__objects[o][m])){}
        let preResult = [];
        let object;
        let method;
        let relation;
        // прогоняем массив подписчиков, вызывая каждый из них и преобразуя входные данные в соответствии с отображением
        try{
            for (let i = 0; i <  this.__subs[o][m].pre.length; i++){
                object = this.__subs[o][m].pre[i].object;
                method = this.__subs[o][m].pre[i].method;
                relation = this.__subs[o][m].pre[i].relation;
                preResult.push(await this.query(object, method, this.__convertByRelation(args, relation)));
                // проверяем, выгреб ли подписчик все данные, если есть такая директива
                if (relation.behavior['emptyOnEnd'] && relation.behavior['emptyOnEnd'].length){
                    for (let j in relation.behavior['emptyOnEnd']){
                        if (Object.keys(args[relation.behavior['emptyOnEnd'][j]]) > 0){
                            logger.write(`error`, `После работы подписчика ${object}.${method} остались неиспользованные данные.`);
                            throw `После работы подписчика ${object}.${method} остались неиспользованные данные.`;
                        }
                    }
                }
            }
            logger.write(`debug`, `Работа преподписчиков ${o}.${m} успешно завершена.`);
            return preResult;
        // если какой-то подписчик не выполнился, откатываем те, которые выполнились
        } catch(e) {
            logger.write(`error`, `Преподписчики ${o}.${m} выполнены с ошибкой.`);
            for (let i = 0; i < preResult.length; i++){
                // если часть подписчиков не сработала, откатываем те, которые сработали (в обратном порядке)
                object = this.__subs[o][m].pre[i].object;
                method = this.__subs[o][m].pre[i].method;
                // вызываем откатные подписчики для отменяемого подписчика (О_О)
                await this.__rbRun(object, method, preResult[i]);
            }
            throw Promise.reject();
        }

    }

    // запуск постподписчиков
    async __postRun(o, m, res){
        logger.write(`debug`, `Вызов постподписчиков ${o}.${m}.`);
        if (!(this.__objects[o] && this.__objects[o][m])){
            logger.write(`error`, `Метод ${o}.${m} не найден.`);
            throw Promise.reject();
        }
        let postResult = [];
        let object;
        let method;
        let relation;
        try{
            for (let i = 0; i <  this.__subs[o][m].post.length; i++) {
                object = this.__subs[o][m].post[i].object;
                relation = this.__subs[o][m].post[i].relation;
                method = this.__subs[o][m].post[i].method;
                postResult.push(await this.query(object, method, this.__convertByRelation(res, relation)));
                if (relation.behavior['emptyOnEnd'] && relation.behavior['emptyOnEnd'].length){
                    for (let j in relation.behavior['emptyOnEnd']){
                        if (Object.keys(res[relation.behavior['emptyOnEnd'][j]]) > 0){
                            logger.write(`error`, `После работы подписчика ${object}.${method} остались неиспользованные данные.`);
                            throw `После работы подписчика ${object}.${method} остались неиспользованные данные.`;
                        }
                    }
                }
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
        logger.write(`debug`, `Откат ${o}.${m}.`);
        // проверка на наличие объекта и его метода, который будем откатывать
        if (!(this.__objects[o] && this.__objects[o][m])){
            logger.write(`error`, `Метод ${o}.${m} не найден.`);
            throw `Метод ${o}.${m} не найден.`;
        }
        if (!(this.__subs[o] && this.__subs[o][m] && this.__subs[o][m].rb.length > 0)){
            //logger.write(`error`, `Не найдена функция отката для ${o}.${m}.`);
            //throw `Не найдена функция отката для ${o}.${m}.`;
            return Promise.resolve();
        }
        // перебираем подписчиков отката для этого метода, вызываем их, преобразовывая аргументы по отображению
        let object;
        let method;
        let relation;
        try{
            for (let i = 0; i < this.__subs[o][m].rb.length; i++){
                object = this.__subs[o][m].rb[i].object;
                relation = this.__subs[o][m].rb[i].relation;
                method = this.__subs[o][m].rb[i].method;
                await this.query(object, method, this.__convertByRelation(data, relation));
            }
        }catch(e){
            logger.write(`error`, `Ошибка при выполнении функции отката для ${o}.${m}.`);
            throw `Ошибка при выполнении функции отката для ${o}.${m}.`;
        }
    }

    // откат предподписчиков
    async __preRollback(o,m, res){
        logger.write(`debug`, `Откат преподписчиков ${o}.${m}.`);
        if (!(this.__objects[o] && this.__objects[o][m])){
            logger.write(`error`, `Метод ${o}.${m} не найден.`);
            throw Promise.reject();
        }
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
                res[p[i].name] = SubscriberHub.refineValues(_.cloneDeep(args[i]));
            } else res[p[i].name] = _.cloneDeep(args[i]);
        }
        return res;
    }

    /**
     * Преобразует структуру данных source в соответствии с отображением, описанным в relation.
     * @param source Структура данных, например, результат работы запроса, которую нужно преобразовать.
     * @param relation Хэш, описывающий схему преобразования исходной структуры данных в структуру, пригодную для обработки другой функцией.
     * @private
     */
    __convertByRelation(source, relation){
        // флаг, который показывает, делятся ли входные данные на new/old
        let newOld;
        // хранит ссылку на элемент source, данные из которого будут использованы
        let data;
        // формат преобразуемых данных
        let from;
        // в какой формат преобразуем
        let to;
        // имя функции-конвертереа
        let converter;
        // список использованных конвертеров
        let operations = [];
        // ассоциативный массив с числовыми ключами, в котором будет возвращён результат
        let result = {};

        /**
         * Конвертер для преобразования выборки данных (формат records) в значения для insert/update (формат values)
         * @param records Выборка, данные из которой будем преобразовывать.
         * @returns {Array} Значения, полученные в результате обхода.
         */
        function recordsToValues(records){
            let res = [];
            let bufValue = null;
            let ids = Object.keys(records);
            logger.write(`debug`, `Выполняется преобразование записей в значение`);
            // перебираем записи в структуре
            for (let i = 0; i < ids.length; i++){
                bufValue = {};
                // если фильтр отсутствует или условие отсева выполняется
                if ((relation.filter && relation.filter.checkRecord(records[ids[i]])) || !relation.filter) {
                    // перебор полей в записи
                    for (let field in records[ids[i]].fields){
                        // если поле содержит обычные данные
                        // сверяемся со схемой и сохраняем данные из поля в буфер, переименовывая ключ в соответствии со схемой
                        // перебираем поля в relation
                        if (field in relation.fields){
                            // если поле относится к преобразованию records, то используем его
                            if (field.search('records.') === 0 || field.search('records.') === 4){
                                // по имени поля в relation достаём имя поля в результате
                                const v = relation.fields[field].match(/\.(\w*)/)[1];
                                bufValue[v] = records[ids[i]].fields[field];
                            }

                        }
                    }
                    res.push(bufValue);
                }
                // если у подписчика стоит директива на удаление записей из входных данных, то удаляем запись,
                // прошедшую фильтр; если фильтр не указан, то удаляются все записи подряд.
                if (relation.behavior['pullOut']){
                    delete records[ids[i]];
                }
            }
            return res;
        }

        /**
         * Вложенная функция, конвертирующая значения в другой формат.
         * @param values Преобразуемые данные
         */
        function valuesToValues(values){
            let res = [], buf, keys = Object.keys(values);
            logger.write(`debug`, `Выполняется преобразование значений.`);
            // перебираем значения
            for (let i = 0; i < keys.length; i++){
                // если фильтр отсутствует или запись через него проходит, то добавляем запись в результат
                if(relation.filter && relation.filter.checkRecord(values[keys[i]]) || !relation.filter){
                    buf = {};
                    for (let f in relation.fields){
                        buf[relation.fields[f].substring(7)] = values[keys[i]][f];
                    }
                    res.push(buf);
                    // если у подписчика стоит директива на удаление записей из входных данных, то удаляем запись,
                    // прошедшую фильтр; если фильтр не указан, то удаляются все записи подряд.
                    if (relation.behavior['pullOut']){
                        delete values[keys[i]];
                    }
                }
            }
            return res;
        }

        /**
         * Преобразует по схеме один фильтр в другой
         * @param filter Исходный фильтр
         * @returns {{comparisons: {}, tree: {}}} Преобразованный фильтр
         */
        function filterToFilter(filter){
            let result = null;
            let fieldName;
            let fieldNameNew;
            // перебираем поля в relation, ищем те, которы используются для преобразования фильтра
            for (let field in relation.fields){
                if (field.search('filter.') === 0){
                    // если используется простая конвертация через переименование полей
                    if (field.substring(7).indexOf('all.') === 0){
                        // копируем исходный фильтр, если это ещё не сделано
                        if (!result) result = _.cloneDeep(filter);
                        // перебираем элементы фильтра, ищем в левой и правой части сравнения поле, указанное в relation, переименовываем его
                        for (let comp in result.comparisons){
                            // вычленяем имя поля из поля relation
                            fieldName = field.substring(11);
                            fieldNameNew = relation.fields[field].substring(11);
                            if (result.comparisons[comp].left.type === 'field'){
                                if (result.comparisons[comp].left.value === fieldName){
                                    result.comparisons[comp].left.value = fieldNameNew;
                                }
                            } else if (result.comparisons[comp].right.type === 'field'){
                                if (result.comparisons[comp].right.value === fieldName){
                                    result.comparisons[comp].right.value = fieldNameNew;
                                }
                            }
                        }
                    // если используется сложная конвертация, то полностью собираем фильтр по указаниям relation
                    } else {
                        // todo сложное преобразование фильтра
                        // копируем исходный фильтр, если это ещё не сделано (затычка)
                        if (!result) result = _.cloneDeep(filter);
                    }
                }
            }
            return result;
        }
        // -------------- основной код функции --------------
        logger.write(`debug`, `Выполняется преобразование данных`);
        for (let key in relation.fields){
            newOld = (['new', 'old'].indexOf(key.match(/^\w*/)[0]) >= 0);
            if (newOld) {
                newOld = key.match(/^\w*/)[0];
                from = key.substring(4).match(/^\w*/)[0];
            } else {
                from = key.match(/^\w*/)[0];
            }
            /**
             * смотрим, какую часть входной структутуры данных мы используем для преобразования
             * если подписчик использует данные, разделённые на new и old, то делаем ссылку на соответствующую часть
             * если нет, то ссылаемся на структуру целиком
             */
            data = newOld ? source[newOld] : source;
            // если на вход не подано то, что указано в отображении, кидаем ошибку
            if (!(from in data) && (from !== 'signs') && (from !== 'literals')){
                logger.write(`error`, `Невозможно выполнить преобразование, так как исходная структура данных не соответствует отображению.`);
                throw new Error(`Невозможно выполнить преобразование, так как исходная структура данных не соответствует отображению.`);
            }
            // смотрим, во что нужно конвертировать данные
            to = relation.fields[key].match(/\w*/)[0];
            // собираем имя функции-конвертера, которую будем вызывать
            converter = from+'To'+to.charAt(0).toUpperCase()+to.slice(1);
            // если такой конвертер ещё не использовался
            if (operations.indexOf(converter) === -1){
                // запоминаем, что конвертер уже использован
                operations.push(converter);
                // если в объекте, который возвращается в качестве результата, нет поля под конвертированные данные, создаём его
                if (!(to in result)){
                    result[to] = [];
                }
                // вызываем конвертер и пушим его результат в соответствующее поле объекта
                let boo = eval(converter+'(data[from])');
                result[to] = result[to].concat(boo);
            }
        }
        return result;
    }

    // создаение простого отображения, если оно не указано при создании подписчика
    __createSimpleRelation(o1, o2){
        logger.write(`debug`, `Создание прямого отображения полей объекта ${o1} в объект ${o2}`);
        let result = {};
        let obj1 = this.__objects[o1], obj2 = this.__objects[o2];
        for (let f in obj1.__interface.fields){
            if (!obj1.__interface.fields[f].isPrimary && f in obj2.__interface.fields){
                result['values.'+f] = 'values.'+f;
            }
        }
        return result;
    }
}

export {SubscriberHub};