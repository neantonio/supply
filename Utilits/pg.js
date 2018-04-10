import {logger} from '../Logger/controller';
import _ from "lodash";
import {CryptAliasesMapUtil} from "../src/main/util/cryptAliasesMapUtil";

import * as pgModule from "pg";
delete pgModule.native;
let utils;


'use strict';
import {Obj} from "./pgSubclassesUtil/Obj";
import {Utils} from "./pgSubclassesUtil/Utils";
import {pgFormatter} from "./pgSubclassesUtil/pgFormatter";

class pgLib {
    constructor(iPG, config) {
        this.__interface = iPG;
        this.__config = config;
        this.__pool = new pgModule.Pool(config);
        this.__subquerySupport = true;
        this.__formatters = {};
        // регистрируем обработчики стандартных типов
        //this.__setDefaultFormatters();
    }

    get config() {
        return Promise.resolve(this.__config);
    }


    /**
     Сверяет объект с его описанием в драйвере, если объект отсутствует или описание некорректно, выдает ошибки
     */
    async checkObject(oName, oDesc) {
        let
            errors = [],
            missingFields = [],
            brokenFields = [];
        // проверяем наличие объекта в структуре
        if (!this.__structure.objects[oName]) {
            errors.push({type: "object", object: oName});
            // если объекта нет в структуре, выходим из функции, дальше проверять нечего
            return Promise.reject(errors);
        }
        // сверяем поля объекта
        for (let field in oDesc) {
            // если поле отсутствует
            if (!(field in this.__structure.objects[oName].columns)) {
                missingFields.push(field);
            } else
            // если тип данных не совпадает
            if (!this.__getNativeType(oDesc[field]).has(this.__structure.objects[oName].columns[field])) {
                brokenFields.push(field);
            }
        }
        // формируем списки битых и отсутствующих полей
        if (missingFields.length) {
            errors.push({
                type: 'absent',
                fields: missingFields
            });
        }
        if (brokenFields.length) {
            errors.push({
                type: 'type',
                fields: brokenFields
            });
        }
        // если есть ошибки возвращаем их в качестве исключения
        if(errors.length){
            throw errors;
        }
        //let result = errors.length ? Promise.reject(errors) : Promise.resolve();
        //return result;
    }

    /**
     Запрашивает структуру базы данных и сохраняет её. Сохраняются следующие данные:
     {
         addObjects: [true|false], // флаг, отвечающий за возможность добавления объектов в БД (пока не активно)
         objects:{
             obj1: { // имя объекта
                 permissions:{
                     canSelect: [true|false],   // разрешена выборка
                     canInsert: [true|false],   // разрешена вставка
                     canUpdate: [true|false],   // разрешено изменение
                     canDelete: [true|false],   // разрешено удаление
                     canTruncate: [true|false], // разрешена очистка
                 },
                 columns:{
                     fName: fType // имя и тип колонки в таблице БД
                 }
             }
         }
     }
     Результат работы функции записывается в приватное поле объекта, функция ничего не возвращает.
     */
    async __extractDBStructure() {
        let
            query = '',
            structure = {objects: {}},
            nextObj = {},
            result = [];

        // получаем список таблиц с правами и полями
        // структура выборки вот такая:
        // table_name | can_select | can_insert | can_update | can_delete | can_truncate | column_list | type_list
        query = `
            SELECT
                DISTINCT rtg.table_name,
                CASE 
                    WHEN EXISTS(SELECT 1 FROM information_schema.role_table_grants t WHERE t.table_name = rtg.table_name AND t.privilege_type = 'SELECT' AND t.is_grantable = 'YES') THEN TRUE
                    ELSE FALSE END AS can_select,
                CASE 
                    WHEN EXISTS(SELECT 1 FROM information_schema.role_table_grants t WHERE t.table_name = rtg.table_name AND t.privilege_type = 'INSERT' AND t.is_grantable = 'YES') THEN TRUE
                    ELSE FALSE END AS can_insert,
                CASE 
                    WHEN EXISTS(SELECT 1 FROM information_schema.role_table_grants t WHERE t.table_name = rtg.table_name AND t.privilege_type = 'UPDATE' AND t.is_grantable = 'YES') THEN TRUE
                    ELSE FALSE END AS can_update,
                CASE 
                    WHEN EXISTS(SELECT 1 FROM information_schema.role_table_grants t WHERE t.table_name = rtg.table_name AND t.privilege_type = 'DELETE' AND t.is_grantable = 'YES') THEN TRUE
                    ELSE FALSE END AS can_delete,
                CASE 
                    WHEN EXISTS(SELECT 1 FROM information_schema.role_table_grants t WHERE t.table_name = rtg.table_name AND t.privilege_type = 'TRUNCATE' AND t.is_grantable = 'YES') THEN TRUE
                    ELSE FALSE END AS can_truncate,
                col_struct.column_list,
                col_struct.type_list
            FROM 
                information_schema.role_table_grants AS rtg
                JOIN (
                    SELECT 
                        ord.table_name,
                        array_agg(ord.column_name::text) AS column_list,
                        array_agg(ord.data_type::text) AS type_list 
                    FROM (
                        SELECT 
                            table_name, 
                            ordinal_position, 
                            column_name, 
                            data_type 
                        FROM 
                            information_schema.columns          
                        ORDER BY table_name, ordinal_position
                    ) AS ord
                    GROUP BY table_name     
                ) as col_struct ON (col_struct.table_name = rtg.table_name)
            ORDER BY table_name
        `;

        // получаем список колонок с указанием типов данных
        try {
            result = await this.__sendQuery(query);
            // получили выборку, парсим её
            for (let i = 0; i < result.rows.length; i++) {
                // заготовка для объекта, пишем права
                nextObj = {
                    'permissions': {
                        'canSelect': result.rows[i][1] == 't' ? true : false,
                        'canInsert': result.rows[i][2] == 't' ? true : false,
                        'canUpdate': result.rows[i][3] == 't' ? true : false,
                        'canDelete': result.rows[i][4] == 't' ? true : false,
                        'canTruncate': result.rows[i][5] == 't' ? true : false
                    },
                    'columns': {}
                }
                // разбираем колонки и их типы данных
                for (let j = 0; j < result.rows[i][6].length; j++) {
                    nextObj['columns'][result.rows[i][6][j]] = result.rows[i][7][j];
                }
                structure.objects[result.rows[i][0]] = nextObj;
            }
        } catch (e) {
            throw new Error(e);
        }
        this._structure = structure;
    }

    async __sendQuery(query) {
        const client = await this.__pool.connect();
        try {
            let result = await client.query(query);
            client.release();
            return result.rows;
        }
        catch(err){
            logger.write(`error`, `Ошибка при выполнении запроса к БД: \n Запрос: ${query} \n Ошибка СУБД: ${err}`, new Error());
            throw `Ошибка при выполнении запроса к БД`;
        }
        //  старая версия на callback
        // return new Promise((res, rej) => {
            /*
            this.__pool.connect(function (err, client, done) {
                if (err) {
                    logger.write(`error`, `Ошибка подключения к БД. \n Ошибка: ${err}`, new Error());
                    rej(`Ошибка подключения к БД`);
                    return;
                }
                client.query(query, [], function (err, result) {
                    done();

                    if (err) {
                        logger.write(`error`, `Ошибка при выполнении запроса к БД: \n Запрос: ${query} \n Ошибка СУБД: ${err}`, new Error());
                        rej(`Ошибка при выполнении запроса к БД`);
                        return;
                    }
                    res(result.rows);
                });
            });


            this.__pool.on('error', function (err, client) {
                logger.write(`error`, `Не получается связаться с СУБД. \n Ошибка: ${err}`, new Error());
                rej(`Не получается связаться с СУБД`);
                return;
            })
            */
        //});
    }

    get subquerySupport() {
        return Promise.resolve(this.__subquerySupport);
    }

    /*
    set subquerySupport(val) {
        logger.write(`warning`, `Нельзя определить значение поля поддержки вложенных запросов из вне.`, new Error());
        return Promise.reject();
    }
    */
    async init(config) {
        let self = this;

        await this.__extractDBStructure();

    }

    /**
     Возвращает родной тип данных СУБД, соответствующий системному типу.
     Системный тип указывается в виде массива с иерархией типов от потомка к предку, ['address' , 'string'], ['age', 'integer'].
     Функция перебирает эти типы и возвращает соответствие для первого попавшегося.
     @arg {Array} types Иерархическая последовательность системных типов.
     @return {String} Тип данных, используемый в СУБД.

     */

    __getNativeType(types) {
        let done = false;
        let dbtype = null;
        for (let i = 0; i < types.length && !done; i++) {
            switch (types[i]) {
                case 'uuid':
                    dbtype = new Set(['uuid']);
                    break;
                case 'integer':
                    dbtype = new Set(['integer']);
                    break;
                case 'float':
                    dbtype = new Set(['double precision']);
                    break;
                case 'date':
                    dbtype = new Set(['date']);
                    break;
                case 'time':
                    dbtype = new Set(['time']);
                    break;
                case 'timestamp':
                    dbtype = new Set(['timestamp', 'timestamp without time zone']);
                    break;
                case 'string':
                case 'array':
                    dbtype = new Set(['text']);
                    break;
                case 'boolean':
                    dbtype = new Set(['boolean']);
                    break;
                //case 'object':
            }
            done = dbtype;
        }
        return dbtype;
    }

    async __extractDBStructure() {
        let
            query = '',
            structure = {objects: {}},
            nextObj = {},
            result = [];

        // получаем список таблиц с правами и полями
        // структура выборки вот такая:
        // table_name | can_select | can_insert | can_update | can_delete | can_truncate | column_list | type_list
        query = `
            SELECT
                DISTINCT rtg.table_name,
                CASE 
                    WHEN EXISTS(SELECT 1 FROM information_schema.role_table_grants t WHERE t.table_name = rtg.table_name AND t.privilege_type = 'SELECT' AND t.is_grantable = 'YES') THEN TRUE
                    ELSE FALSE END AS can_select,
                CASE 
                    WHEN EXISTS(SELECT 1 FROM information_schema.role_table_grants t WHERE t.table_name = rtg.table_name AND t.privilege_type = 'INSERT' AND t.is_grantable = 'YES') THEN TRUE
                    ELSE FALSE END AS can_insert,
                CASE 
                    WHEN EXISTS(SELECT 1 FROM information_schema.role_table_grants t WHERE t.table_name = rtg.table_name AND t.privilege_type = 'UPDATE' AND t.is_grantable = 'YES') THEN TRUE
                    ELSE FALSE END AS can_update,
                CASE 
                    WHEN EXISTS(SELECT 1 FROM information_schema.role_table_grants t WHERE t.table_name = rtg.table_name AND t.privilege_type = 'DELETE' AND t.is_grantable = 'YES') THEN TRUE
                    ELSE FALSE END AS can_delete,
                CASE 
                    WHEN EXISTS(SELECT 1 FROM information_schema.role_table_grants t WHERE t.table_name = rtg.table_name AND t.privilege_type = 'TRUNCATE' AND t.is_grantable = 'YES') THEN TRUE
                    ELSE FALSE END AS can_truncate,
                col_struct.column_list,
                col_struct.type_list
            FROM 
                information_schema.role_table_grants AS rtg
                JOIN (
                    SELECT 
                        ord.table_name,
                        array_agg(ord.column_name::text) AS column_list,
                        array_agg(ord.data_type::text) AS type_list 
                    FROM (
                        SELECT 
                            table_name, 
                            ordinal_position, 
                            column_name, 
                            data_type 
                        FROM 
                            information_schema.columns          
                        ORDER BY table_name, ordinal_position
                    ) AS ord
                    GROUP BY table_name     
                ) as col_struct ON (col_struct.table_name = rtg.table_name)
            ORDER BY table_name
        `;

        // получаем список колонок с указанием типов данных
        try {
            result = await this.__sendQuery(query);
            // получили выборку, парсим её
            for (let i = 0; i < result.length; i++) {
                // заготовка для объекта, пишем права
                nextObj = {
                    'permissions': {
                        'canSelect': result[i].canSelect,
                        'canInsert': result[i].canInsert,
                        'canUpdate': result[i].canUpdate,
                        'canDelete': result[i].canDelete,
                        'canTruncate': result[i].canTruncate
                    },
                    'columns': {}
                }
                // разбираем колонки и их типы данных
                for (let j = 0; j < result[i].column_list.length; j++) {
                    nextObj['columns'][result[i].column_list[j]] = result[i].type_list[j];
                }
                structure.objects[result[i].table_name] = nextObj;
            }
        } catch (e) {
            throw new Error(e);
        }
        this.__structure = structure;
    }

    __getSchema() {
        /**
         * SELECT table_name as table, column_name as column, data_type as type FROM information_schema.columns ORDER BY table_name;
         * */
    }

    checkConfig(config) {
        let result = true;
        for (let key in this.__config)
            result = result && (this.__config[key] == config[key])

        for (let key in config)
            result = result && (this.__config[key] == config[key])

        return Promise.resolve(result);
    }

    /**
     Генерирует запрос на добавление таблицы по её описанию.
     Описание имеет следующую структуру:
     {
         oName: ' ... ',
         oDesc: [
             {
                 name: " ... ",
                 type: ["type1", "type0"],
                 properties:[]
             }
         ]
     }
     */
    async addObject(oName, oDesc) {
        // проверяем наличие такого объекта в структуре
        if (this.__structure.objects.hasOwnProperty(oName)) {
            logger.write(`error`, `Объект ${oName} уже существует.`, new Error());
            throw new Error();
        }
        let fieldsOk = true;
        let brokenField = '';
        let fieldsDesc = [];
        // перебрать все поля в описании, узнать поддерживаются ли такие типы данных
        for (let i = 0; i < oDesc.length && fieldsOk; i++) {
            let native = [...this.__getNativeType(oDesc[i].type)][0];
            if (!native) {
                fieldsOk = false;
                brokenField = oDesc[i].name;
            } else {
                // формируем описание свойств поля
                // поле, идущее по порядку первым, считается первичным ключом
                // если у поля есть свойства, описанные в массиве properties, пишем их сюда.
                let fieldProperties = (i === 0 ? 'PRIMARY KEY ' : '') + (!!oDesc[i].properties ? oDesc[i].properties.join(' ') : '');
                fieldsDesc.push(`"${oDesc[i].name}" ${native} ${fieldProperties}`);
            }
        }
        // тип данных не поддерживается
        if (!fieldsOk) {
            logger.write(`error`, `Тип данных поля '${brokenField}' не поддерживается.`, new Error());
            throw new Error();
        }
        // формируем запрос и выполняем его, вносим изменения в структуру, логируем действие, возвращаем сообщение об успешном выполнении операции
        let query = `CREATE TABLE \"${oName}\" (${fieldsDesc.join(',')});`;
        try {
            await this.__sendQuery(query);
            // обновляем структуру БД
            await this.__extractDBStructure();
            logger.write(`debug`, `Добавлен объект ${oName}.`);
            return `New object ${oName} successfully created.`;
        } catch (e) {
            logger.write(`error`, `При выполнении запроса на добавление таблицы ${oName} возникла ошибка.`, e);
            throw e;
        }
    }

    /**
     Удаляет таблицу oName из БД
     */
    async delObject(oName) {
        // проверяем наличие таблицы в структуре
        if (!this.__structure.objects[oName]) {
            logger.write(`error`, `Объект ${oName} не существует.`, new Error());
            throw new Error();
        }
        // формируем запрос, выполняем его, изменяем описание структуры БД, пишем в лог, ретурним сообщение
        try {
            let query = `DROP TABLE \"${oName}\";`;
            await this.__sendQuery(query);
            delete this.__structure.objects[oName];
            logger.write(`debug`, `Удален объект ${oName}.`);
            return 'Object ${oName} successfully removed.'
        } catch (e) {
            logger.write(`error`, `При выполнении запроса на удаление таблицы ${oName} возникла ошибка.`, new Error());
            throw new Error();
        }

    }

    /**
     Формирует запрос на добавление нового поля таблицу
     */
    async addColumn(oName, name, type, properties) {
        // проверяем по структуре, существует ли такая таблица
        if (!this.__structure.objects.hasOwnProperty(oName)) {
            logger.write(`error`, `Объект ${oName} не существует.`, new Error());
            throw new Error();
        }
        // проверяем по структуре, нет ли в этой таблице поля с тем же именем
        if (this.__structure.objects[oName].columns[name]) {
            logger.write(`error`, `Поле ${name} уже существует.`, new Error());
            throw new Error();
        }
        // проверяем, поддерживается ли тип данных
        let native = [...this.__getNativeType(type)][0];
        if (!native) {
            logger.write(`error`, `В ${type} не найден поддерживаемый тип данных.`, new Error());
            throw new Error();
        }
        // проверяем, не указано ли свойство PRIMARY KEY
        let noPrimary = true;
        properties.forEach(function (item) {
            if (item.toLowerCase() === 'primary key') {
                noPrimary = false
            }
        });
        if (!noPrimary) {
            logger.write(`error`, `Попытка добавить ещё один первичный ключ.`, new Error());
            throw new Error();
        }
        // формируем и отправляем запрос
        let query = `ALTER TABLE \"${oName}\" ADD COLUMN \"${name}\" ${native} ${properties && properties.length ? properties.join(' ') : ''}`;
        try {
            await this.__sendQuery(query);
            this.__structure.objects[oName].columns[name] = native;
            logger.write(`debug`, `В объект ${oName} добавлено поле ${name}.`);
            return `Column ${name} for table ${oName} successfully added.`
        } catch (e) {
            logger.write(`error`, `При выполнении запроса на добавление поля ${name} в таблицу ${oName} возникла ошибка.`, new Error());
            throw e;
        }
    }

    /**
     Удаляет колонку name из таблицы oName. Первичный ключ удалить нельзя.
     */
    async delColumn(oName, name) {
        // проверяем наличие в структуре таблицы и колонки
        if (!this.__structure.objects[oName]) {
            logger.write(`error`, `Объект ${oName} не существует.`, new Error());
            throw new Error();
        }
        if (this.__structure.objects[oName].columns[name]) {
            logger.write(`error`, `Поле ${name} объекта ${oName} не существует.`, new Error());
            throw new Error();
        }
        // проверяем не является ли свойство первичным ключом
        if (Object.keys(this.__structure.objects[oName].columns).indexOf(name) > 0) {
            logger.write(`error`, `Попытка удалить первичный ключ.`, new Error());
            throw new Error();
        }
        // формируем запрос, выполняем его, изменяем описание структуры БД, логируем действие, ретурним сообщение
        let query = `ALTER TABLE \"${oName}\" DROP COLUMN ]"${name}\"`;
        await this.__sendQuery(query);
        delete this.__structure.objects[oName].columns[name];
        logger.write(`debug`, `Из объекта ${oName} удалено поле ${name}.`);
        return `Field ${name} was successfully removed from object ${oName}.`
    }


    getPermissions() {
        /**
         * SELECT table_name, privilege_type, is_grantable, with_hierarchy
         * FROM information_schema.role_table_grants
         * */
    }

    /**
     * Метод для генерирования запроса на добавление таблицы @name с полями  @fields
     *  name - имя добавляемой таблицы,
     *  fields - список полей
     *
     *  fields - ассоциативный массив
     *  {
     *      имя:{
     *          type: тип,
     *          props: ['UNIQUE', 'NOT NULL', etc.] - список свойств
     *      }
     *  }
     */
    createTable(name, fields) {
        let fieldsDesc = [];
        for (let field in fields)
            fieldsDesc.push(`\"${field}\" ${fields[field].type} ${fields[field].props.join(" ")}`);
        return this.__sendQuery([`CREATE TABLE IF NOT EXISTS \"${name}\" (${fieldsDesc.join(",")});`]);
    }

    __addField(table, name, description = {type: "text"}) {
        return this.__sendQuery(`SELECT "addColumn"('${table}','${name}','${description.type}');`);
    }

    /**
     * Метод для добавления полей @fields в таблицу @name
     *  для его работы необходим метод addField в СУБД, генерирующий процедуру добавления поля в таблицу!!!
     *  В методе стоит проверка существования метода addFieldProcedure, генерирующего эту функцию,
     *  если такого метода в классе-наследнике нет, возвращается соответствующая ошибка.
     *
     *  name - имя  таблицы,
     *  fields - список полей
     *
     *  fields - ассоциативный массив
     *  {
     *      имя:{
     *          type: тип,
     *          props: ['UNIQUE', 'NOT NULL', etc.] - список свойств
     *      }
     *  }
     * */
    __addFields(tableName, fields) {
        if (!this.__addField) {
            logger.write(`warning`, `Компонент не поддерживает функцию добавления поля.`, new Error());
            return Promise.reject();
        }
        else {
            return Promise.all(
                Object.keys(fields).map(
                    field => this.__sendQuery(this.__addField(tableName, field, fields[field]))
                )
            )
        }
    }

    /**
     * Метод для удаления полей @fields из таблицы @name
     * работает аналогично с addFields, требует наличия функции delFieldProcedure у потомка
     *
     *  name - имя  таблицы,
     *  fields - список полей
     *      ["field1", "field2"]
     * */
    __delFields(tableName, fields) {
        if (!this.__delField) {
            logger.write(`warning`, `Компонент '${this.name}' не поддерживает метод удаления полей.`, new Error());
            return Promise.reject();
        }
        else {
            return Promise.all(
                fields.map(field => this.__delField(tableName, field))
            )
                .then(response, reject);
        }
    }

    /**
     * Метод для удаления таблицы @name
     *  name - имя  таблицы
     * */
    deleteTable(name) {
        return this.__sendQuery(`DROP TABLE "${name}";`);
    }

    /**
     * Метод для множественного добавления записей
     * @param {string} object - Имя таблицы
     * @param {object} values - массив с записями, [{field: value}, {field: value}]
     * [{description: 'afasdf'},{polygon: (234234, 1123)}]
     * //insert into tableName1 (field1, field2) values(value1, value2)
     * //[{description: 'adsfadsf', polygon: '(0,0)'}, {description: ';lkj;lkj', contragent: 'ca'}]
     * insert into tableName1 (description, polygon, contragent) values('adsfadsf', '(0,0)', null),(';lkj;lkj', null, 'ca')
     *
     */
    //вставка с разными полями
    async insert(object, values) {
        if (!object && typeof(object.name) !== 'string') {
            logger.write(`error`, `PGComponent. Множественное добавление. Не задана таблица.`, new Error());
            throw `PGComponent. Множественное добавление. Не задана таблица.`;
        }
        if (!values instanceof Array || values.length === 0) {
            logger.write(`warning`, `PGComponent. Множественное добавление. Пустой массив с записями.`, new Error());
            return [];
            // throw `PGComponent. Множественное добавление. Пустой массив с записями.`;
        }

        let tableName = object.name;
        let qStr = '';

        // цель - найти уникальные поля в массиве хэшей
        // для этого объединяем все хэши в один хэш
        let mergeValues = {};
        for (let row in values) {
            _.merge(mergeValues, values[row]);
        }

        // далее вытаскиваем все поля, которые по дефолту уникальные
        // заодно формируем строку с кавычками для строки sql
        let uniqFields = [];
        let qoutUniqFields = [];
        for (let f in mergeValues) {
            qoutUniqFields.push(utils.dQuotes(f));
            uniqFields.push(f);
        }


        qStr += `INSERT INTO "${tableName}" 
                (${qoutUniqFields.filter(fieldName => fieldName !== "\"undefined\"").join(',')}) 
                VALUES`;

        //далее нужно собрать строку values для sql, для
        //пробегаем каждый хэш из массива
        //затем смотрим по порядку из уникальных полей, если поле имеется то добавляем в массив с полями для sql
        //иначе такого поля нету в данной строке и пишем для sql 'null'
        let fields = [];
        for (let u in values) {
            let tmpArr = [];
            for (let un in uniqFields) {
                let dataFormVal = {type: object.fields[uniqFields[un]] || object.link[uniqFields[un]], value: values[u][uniqFields[un]]};
                let formatedValue = await pgFormatter.formatValue(dataFormVal);
                //let tmpStr = `${utils.dQuotes(infoField.smallField)} = ${formatedValue}`;
                if (typeof(values[u][uniqFields[un]]) !== 'undefined' && values[u][uniqFields[un]] !== null) {
                    tmpArr.push(formatedValue);
                } else {
                    tmpArr.push('null');
                }
            }
            fields.push(`(${tmpArr.join(',')})`);
        }
        qStr += `${fields.join(',')};`;

        try {
            await this.__sendQuery(qStr);
        }
        catch(e){
            logger.write(`warning`, `PostgreSQL. Ошибка при обращении к базе данных.`, new Error());
            throw `PostgreSQL. Ошибка при обращении к базе данных.`;
        }

        return values;
    }

    /** SELECT - получение записей из postgres
     * @param {string} object - главный объект
     * {
        "name": "query_table",
        "fields": {
            "ID": "uuid",
            "description": "string",
            "date": "date"
        },
        "PK": {"ID": 'uuid'}
     * }
     * @param {object} fields - массив полей, ['description', 'geoZone.description'] (не используется)
     * @param {object} filter - ассоциативый массив с условиями и деревом условий,
     * {
        comparisons: {
            "soap": {
                "left": {
                    "type": "field",
                    "value": "ref.position_table.product_id__uuid.name__string"
                },
                "sign": "equal",
                "right": {
                    "type": "value",
                    "value": "Мыло"
                }
            },
            "rope": {
                "left": {
                    "type": "field",
                    "value": "ref.position_table.product_id__uuid.maker_id__uuid.country__uuid"
                },
                "sign": "equal",
                "right": {
                    "type": "value",
                    "value": "Веревка"
                }
            },
            "date": {
                "left": {
                    "type": "field",
                    "value": "date__date"
                },
                "sign": "equal",
                "right": {
                    "type": "value",
                    "value": "2017.01.01"
                }
            }
        },
        "tree": {
            "and": ["date", "soap", "rope"]
        }
     }
     * @param {object} objInfo - таблицы(объекты), используемые для связей,
     {"ref.position_table": {
        // имя объекта
        "object": "position_table",
        // первичный ключ объекта
        "PK": {"ID": 'uuid'},
        // описание ссылок на внешние объекты
        "link": {
            "ref.position_table.productID": 'uuid',
            "ref.position_table.recipientID": 'uuid'
        },
        // описание связи табличной части с объектом верхнего уровня
        "rLink": "ownerID"
       },
     "ref.position_table.productID": {
        "object": "product_table",
        "PK": {"ID": 'uuid'},
        "fields": {
            "description": "string"
        },
        "link": {
            "ref.position_table.productID.makerID": 'uuid'
        }
     }
     * @param {object} params - ассоциативный массив для пагинации, сортировки выборки (не реализовано)
     * */
    async select(object, fields, filter, objInfo, params) {
        let obj = new Obj(object, objInfo, filter, utils);
        let cryptAliasesMapUtil = new CryptAliasesMapUtil();
        let sqlInfo = await obj.makeSqlStringSelect(params, cryptAliasesMapUtil);
        //crypt
        // console.log(sqlInfo.sqlString);
        let resSql = await this.__sendQuery(sqlInfo.sqlString);
        await cryptAliasesMapUtil.getDecryptedMass(resSql);
        //обработка результата с sql
        if (resSql.length === 0) {
            return {
                [object.name]: []
            };
        }
        if (sqlInfo.aggregate) {
            if (resSql[0].count) {
                return {count: resSql[0].count};
            }
            return resSql[0];
        }

        let mainObj = obj.object.name;
        let result1 = {};
        result1[obj.object.name] = {};
        for (let f in objInfo)
            result1[f] = {};

        // перебираем все результаты
        resSql.forEach(record => {
            let mainPK = Object.keys(object.PK)[0];
            let fullNameField = `"${mainObj}.${mainPK}"`;
            let tableName = obj.object.name;
            let fullNameFieldId = record[fullNameField];
            if (!result1[tableName][fullNameFieldId]) {
                result1[tableName][fullNameFieldId] = {};
                // восстанавливаем первичный ключ
                result1[tableName][fullNameFieldId][mainPK] = record[`"${mainObj}.${mainPK}"`];
                // добавляем поля
                for (let objectField in object.fields) {
                    let fieldValue = record[`"${mainObj}.${objectField}"`];
                    result1[tableName][fullNameFieldId][objectField] = fieldValue;
                }
                // и внешние ключи
                for (let LinkID in object.link) {
                    let boolean = new Boolean(objInfo[LinkID]);
                    if (objInfo[LinkID]) {
                        result1[tableName][fullNameFieldId][LinkID] = record[`"${LinkID}.${Object.keys(objInfo[LinkID].PK)[0]}"`];
                    } else {
                        let foreignID = record[`"${mainObj}.${LinkID}"`];
                        result1[tableName][fullNameFieldId][LinkID] = foreignID;
                    }
                }
            }
            // проверяем все связанные объекты
            for (let refTable in objInfo) {
                // находим первичный ключ
                let objPK = Object.keys(objInfo[refTable].PK)[0];
                // если такой записи еще нет, добавляем
                let primaryKey = record[`"${refTable}.${objPK}"`];

                //
                if (!result1[refTable][primaryKey]) {
                    result1[refTable][primaryKey] = {};
                    // определяем первичный ключ
                    result1[refTable][primaryKey][objPK] = primaryKey;
                    // определяем все поля и их значения
                    for (let f in objInfo[refTable].fields)

                        result1[refTable][primaryKey][f] = record[`"${refTable}.${f}"`];
                    // заполняем значения для внешних ключей
                    for (let linkName in objInfo[refTable].link) {
                        //todo replace number ID (5) to "ID" string
                        let primaryKeyName = Object.keys(objInfo[`${refTable}.${linkName}`].PK)[0];
                        result1[refTable][primaryKey][linkName] = record[`"${refTable}.${linkName}.${primaryKeyName}"`];

                    }
                    // подхватываем id тч если имеется
                    if (objInfo[refTable].rLink) {
                        result1[refTable][primaryKey][objInfo[refTable].rLink.field] = record[`"${refTable}.${objInfo[refTable].rLink.field}"`];
                    }
                }
            }
        });
        let result = {};
        for (let o in result1) {
            result[o] = [];
            for (let r in result1[o])
                result[o].push(result1[o][r]);
        }
        return result;
    }

    /**
     * Метод для обновления записей в таблице @table по выборке
     *
     * values = [ список значений в виде отформатированных строк ]
     * Пример values = [
     *          "\"Name\" = 'eugene'",
     *          "\"role\" = 'admin'"
     *        ]
     *
     * filter = форматированное условие выборки для обновления
     * Пример filter = "\"description\" = 'имя' OR number > 10"
     * */

    async update(values, object, objInfo, filter) {
        let qStr = '';
        qStr += 'UPDATE ';
        let obj = new Obj(object, objInfo, filter, utils);
        let tableName = obj.getTableNameObject();
        qStr += utils.dQuotes(tableName) + ' ';
        let set = await obj.makeSet(values);
        qStr += set;
        let res = await obj.makeWhere();
        qStr += res;
        return await this.__sendQuery(qStr);
    }

    /**
     * Метод для удаления записей из таблицы @table по выборке @filter
     *
     * filter = [ список условий в виде отформатированных строк ]
     * Пример filter = "\"description\" = 'имя' OR number > 10"
     * */
    delete(object, objInfo, filter) {
        return new Promise((resolve, reject) => {
            let qStr = '';
            if (!object || !objInfo || !filter) {
                logger.write(`warning`, `PGComponent. Для удаления необходимы object, objInfo и filter.`, new Error());
                return reject();
            }
            let obj = new Obj(object, objInfo, filter, utils);
            let tableName = obj.getTableNameObject();
            obj.makeWhere()
                .then(res => {
                    qStr = `DELETE FROM "${tableName}" ${res}`;
                    this.__sendQuery(qStr)
                        .then(res => resolve(res))
                        .catch(err => {
                            logger.write(`warning`, `PGComponent. Модуль удаления вернул ошибку: ` + err, new Error());
                            reject();
                        });
                })
                .catch(err => {
                    logger.write(`warning`, `PGComponent. Модуль удаления вернул ошибку: ` + err, new Error());
                    return reject();
                });
        });
    }

}






utils = new Utils();
export {pgLib as pg};