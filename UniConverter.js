'use strict';

import {logger} from './Logger/controller';
import _ from "lodash";
import {EntityParserUtil} from "./src/main/util/entityParserUtil";


class UniConverter{
    constructor(){}

    /**
     * Преобразует структуру данных source в соответствии с отображением, описанным в relation.
     * @param source Структура данных, например, результат работы запроса, которую нужно преобразовать.
     * @param relation Хэш, описывающий схему преобразования исходной структуры данных в структуру, пригодную для обработки другой функцией.
     *
     */
    static convertByRelation(source, relation){
        // флаг, который показывает, делятся ли входные данные на new/old
        //let newOld;
        // хранит ссылку на элемент source, данные из которого будут использованы
        //let data;
        // формат преобразуемых данных
        let from;
        // в какой формат преобразуем
        let to;
        // имя функции-конвертереа
        let converter;
        let sourceField;
        // список использованных конвертеров
        let operations = [];
        // ассоциативный массив с числовыми ключами, в котором будет возвращён результат
        let result = {};
        logger.write(`debug`, `Выполняется преобразование данных`);
        for (let key in relation.fields){
            if ((key.indexOf('new.records') === 0) || (key.indexOf('old.records') === 0)){
                from = 'records';
                sourceField = key.match(/^\w*/)[0];
            } else if (key.indexOf('values') === 0){
                from = 'values';
                sourceField = 'values';
            } else if (key.indexOf('filter') === 0){
                from = 'filter';
                sourceField = 'filter';
            }

            // newOld = (['new', 'old'].indexOf(key.match(/^\w*/)[0]) >= 0);
            // if (newOld) {
            //     newOld = key.match(/^\w*/)[0];
            //     from = key.substring(4).match(/^\w*/)[0];
            // } else {
            //     from = key.match(/^\w*/)[0];
            // }

            /**
             * смотрим, какую часть входной структутуры данных мы используем для преобразования
             * если подписчик использует данные, разделённые на new и old, то делаем ссылку на соответствующую часть
             * если нет, то ссылаемся на структуру целиком
             */
            //data = newOld ? source[newOld] : source;
            // если на вход не подано то, что указано в отображении, кидаем ошибку
            if (!(sourceField in source) && (from !== 'signs') && (from !== 'literals')){
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
                //result[to] = eval(converter+'(source, relation, sourceField)');
                result[to] = UniConverter[converter](source, relation, sourceField);
                /* if (!(to in result)){
                     result[to] = [];
                 }
                 // вызываем конвертер и пушим его результат в соответствующее поле объекта
                 let boo = eval(converter+'(data[from])');
                 result[to] = result[to].concat(boo);*/
            }
        }
        // когда преобразование по полям закончено, смотрим, есть ли параметры, добавляемые напрямую
        if (relation.direct){
            for (let field in relation.direct){
                result[field] = relation.direct[field];
            }
        }
        result.parameters = {
          token: source.parameters ? source.parameters.token : null
        };
        return result;
    }

    /**
     * Функция, конвертирующая значения в другой формат.
     * @param source Преобразуемые данные
     * @param relation Схема преобразования
     * @param key Имя поля в source, из которого берутся данные
     * @returns {Array} Преобразованные значения в формате values
     */
    static valuesToValues(source, relation, key){
        let res = [];
        let buf;
        let values = source[key];
        let keys = Object.keys(values);
        logger.write(`debug`, `Выполняется преобразование значений.`);
        // перебираем значения
        for (let i = 0; i < keys.length; i++){
            // если фильтр отсутствует или запись через него проходит, то добавляем запись в результат
            if(relation.filter && relation.filter.checkRecord(values[keys[i]]) || !relation.filter){
                buf = {};
                for (let f in relation.fields){
                    if (f.indexOf('values.') === 0){
                        buf[relation.fields[f].substring(7)] = values[keys[i]][f];
                    }
                }
                // если relation содержит указание на дополнение каждой записи определёнными значениями
                if (relation.fields['addConst']){
                    for (let c in source['addConst']){
                        buf[c] = source['addConst'][c];
                    }
                }
                res.push(buf);
                // если у подписчика стоит директива на удаление записей из входных данных, то удаляем запись,
                // прошедшую фильтр; если фильтр не указан, то удаляются все записи подряд.
                if (relation.behavior && relation.behavior['pullOut']){
                    delete values[keys[i]];
                }
            }
        }
        return res;
    }

    /**
     * Конвертер для преобразования выборки данных (формат records) в значения для insert/update (формат values)
     * @param source Преобразуемые данные
     * @param relation Схема преобразования
     * @param key Имя поля в source, из которого берутся данные
     * @returns {Array} Значения в формате records, полученные в результате обхода.
     */
    static recordsToValues(source, relation, key){
        let res = [];
        let bufValue = null;
        let records = source[key].records;
        let ids = Object.keys(records);
        logger.write(`debug`, `Выполняется преобразование записей в значение`);
        // перебираем записи в структуре
        for (let i = 0; i < ids.length; i++){
            bufValue = {};
            // если фильтр отсутствует или условие отсева выполняется
            if (!relation.filter || (relation.filter && relation.filter.checkRecord(records[ids[i]]))) {
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
                // если relation содержит указание на дополнение каждой записи определёнными значениями
                if (relation['addConst']){
                    for (let c in source['addConst']){
                        bufValue[c] = source['addConst'][c];
                    }
                }
                res.push(bufValue);
            }
            // если у подписчика стоит директива на удаление записей из входных данных, то удаляем запись,
            // прошедшую фильтр; если фильтр не указан, то удаляются все записи подряд.
            if (relation.behavior && relation.behavior['pullOut']){
                delete records[ids[i]];
            }
        }
        return res;
    }

    /**
     * Преобразует по схеме один фильтр в другой
     * @param source Данные для преобразования, содержащие исходный фильтр
     * @param relation Схема преобразования
     * @param key Поле в source, из которого берутся данные для преобразования
     * @returns {{comparisons: {}, tree: {}}} Преобразованный фильтр
     */
    static filterToFilter(source, relation, key){
        let result = null;
        let fieldName;
        let fieldNameNew;
        let filter = source[key];
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

    /**
     * Сжимает выборку, полученную в результате get в кортежи, объединяя записи табличных частей
     * @param source Обрабатываемая структура.
     * @param prefix Префикс, с помощью которого алгоритм определяет, на каком уровне структуры он находится.
     * @returns {{}} Набор кортежей из выборки.
     */
    static compressRecords(source, prefix='records.'){
        let res = {};
        let deepRes;
        let buf;
        let rKey;
        let fKey;
        let keys = Object.keys(source);
        let tmp = EntityParserUtil.parse({records: _.cloneDeep(source)});
        let newKey = 0;
        logger.write(`debug`, `Выполняется сжатие записей.`);
        // перебираем записи в структуре
        for (let i = 0; i < keys.length; i++){
            buf = {fields: {}};
            deepRes = {};
            // перебор табличных частей
            for (let ref in source[keys[i]].refs){
                // табличная часть может быть пустой, ставим проверку, чтобы не прогонять метод вхолостую
                if (Object.keys(source[keys[i]].refs[ref]).length){
                    // формируем ключ - полный путь к табличной части
                    rKey = prefix+'refs.'+ref;
                    // если табличных частей несколько, то объединяем результат их обхода с помощью декартова произведения
                    if (Object.keys(deepRes).length){
                        deepRes = UniConverter.getCartesianProduct(deepRes, UniConverter.compressRecords(source[keys[i]].refs[ref], rKey+'.'));
                    } else deepRes = UniConverter.compressRecords(source[keys[i]].refs[ref], rKey+'.');
                }
            }
            // перебор полей в записи
            for (let field in source[keys[i]].fields){
                // если поле содержит обычные данные
                // сверяемся со схемой и сохраняем данные из поля в буфер, переименовывая ключ в соответствии со схемой
                fKey = prefix+'fields.'+field;
                if(source[keys[i]].fields[field] !== null && typeof source[keys[i]].fields[field] === "object"){
                    let deepField = UniConverter.compressRecords(source[keys[i]].fields[field], fKey+'.');
                    if(Object.keys(deepField).length > 0){
                        buf.fields[fKey] = Object.keys(source[keys[i]].fields[field])[0];
                        buf.fields = _.assign(buf.fields, deepField[0].fields);
                    }
                    else{
                        buf.fields[fKey] = source[keys[i]].fields[field];
                    }
                    console.log()
                }
                else {
                    buf.fields[fKey] = source[keys[i]].fields[field];
                }
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
                res = UniConverter.concatCollections(res, deepRes);
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
}

export {UniConverter as UniConverter};