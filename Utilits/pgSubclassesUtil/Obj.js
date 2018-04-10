/**
 * Класс для формирования sql строки из главного объекта, подобъектов и фильтра
 */
import {Filter} from "./Filter";
import {CryptAliasesMapUtil} from "../../src/main/util/cryptAliasesMapUtil";
import {HashMap} from "hashmap";
import {pgFormatter} from "./pgFormatter";
import * as validator from "validator";

export class Obj {
    //todo создать мапу key - строка из objInfo value - encryptedMap.
    constructor(object, objInfo, filter, utils) {
        this.object = object;
        this.tableNameKeyObjInfoCryptMap = this._getCryptAliasesMap(objInfo);
        this.objInfo = objInfo;
        this.filter = filter || null;
        this.utils = utils;
    }

    _getCryptAliasesMap(objInfo) {
        if (objInfo === {} || objInfo === undefined || objInfo === null) {
            return new HashMap();
        }
        let tableNameKeyObjInfoCryptMap = new HashMap();
        tableNameKeyObjInfoCryptMap.cryptAliasesMapUtil = new CryptAliasesMapUtil();
        // let preProperty;
        for (let property in objInfo) {
            let tableName = objInfo[property].object;
            if (tableNameKeyObjInfoCryptMap.has(tableName)) {
                let keyObjCryptMap = tableNameKeyObjInfoCryptMap.get(tableName);
                keyObjCryptMap.set(property, tableNameKeyObjInfoCryptMap.cryptAliasesMapUtil.cryptValue(property, "ObjInfoProperty-"));
            } else {
                let keyObjCryptMap = new HashMap();
                keyObjCryptMap.set(property, tableNameKeyObjInfoCryptMap.cryptAliasesMapUtil.cryptValue(property, "ObjInfoProperty-"));
                tableNameKeyObjInfoCryptMap.set(tableName, keyObjCryptMap);
            }
        }
        return tableNameKeyObjInfoCryptMap;
    }


    _getPropertyObj(link) {
        if (this.objInfo[link]) {
            const table = this.objInfo[link].object;
            const PK = Object.keys(this.objInfo[link].PK)[0];
            const type = this.objInfo[link].PK[Object.keys(this.objInfo[link].PK)[0]];
            return {table: table, PK: PK, type: type};
        }
        throw('PK is not found');
    }

    getTableNameObject() {
        return this.object.name;
    }

// тут получить алиас и подставить в лефт джойн
    async _makeJoin() {
        if (Object.keys(this.objInfo).length === 0) {
            return Promise.resolve('');
        }
        this.objInfo = this._sortObject(this.objInfo);
        let inner = '';
        if (this.object.link && this.object.PK) {

            //todo o как ключ к мапе алиасов
            for (let o in this.object.link) {
                if (this.objInfo[o]) {
                    let mainTable = this.object.name;
                    let mainTableFK = o;
                    let foreignTable = this.objInfo[o].object;
                    let foreignTablePK = Object.keys(this.objInfo[o].PK)[0];
                    let alias1 = this._getTableAlias(o, foreignTable);
                    // mainTable = this._getTableAlias(o, mainTable);
                    inner += `LEFT JOIN "${foreignTable}" as "${alias1}" ON "${alias1}"."${foreignTablePK}"="${mainTable}"."${mainTableFK}" \n`;
                    //console.log();
                }
            }
        }


        //todo obj как ключ к мапе алиасов
        for (let propertyObjInfo in this.objInfo) {
            let currentObject = this.objInfo[propertyObjInfo];
            if (!currentObject.PK) {
                return {error: 'Error create join. Missing PK'};
            }

            if (currentObject.rLink) {
                const refTable = currentObject.object;
                const FK = currentObject.rLink.field;

                let mainTable;
                let PK;
                let ancestorObjectField
                if (propertyObjInfo.lastIndexOf(".ref") === -1) {
                    mainTable = this.object.name;
                    PK = Object.keys(this.object.PK)[0];
                } else {
                     ancestorObjectField = propertyObjInfo.slice(0, propertyObjInfo.lastIndexOf(".ref"));
                    mainTable = this.objInfo[ancestorObjectField].object;
                    PK = Object.keys(this.objInfo[ancestorObjectField].PK)[0];
                }
                let alias2 = this._getTableAlias(propertyObjInfo, refTable);
                mainTable = this._getTableAlias(ancestorObjectField, mainTable);
                inner += `LEFT JOIN "${refTable}" as "${alias2}" ON "${mainTable}"."${PK}"="${alias2}"."${FK}" \n`;
            }

            if (currentObject.link && currentObject.link.length !== 0) {
                for (let l in currentObject.link) {
                    let mainTable = currentObject.object;//
                    let dataFk = this._getPropertyObj(propertyObjInfo + "." + l);
                    let linkTable = dataFk.table;
                    let linkTablePK = dataFk.PK;
                    if (typeof(dataFk.error) === 'undefined') {
                        let alias3 = this._getTableAlias(propertyObjInfo + "." + l, linkTable);
                        mainTable = this._getTableAlias(propertyObjInfo , mainTable);
                        inner += `LEFT JOIN "${linkTable}" as "${alias3}"  ON "${mainTable}"."${l}"="${alias3}"."${linkTablePK}" \n`;
                        //console.log();
                    }
                }
            }
        }
        return Promise.resolve(inner);
    }

    _getTableAlias(propertyObjInfo, tableName) {
        if (this.tableNameKeyObjInfoCryptMap.has(tableName) &&
            this.tableNameKeyObjInfoCryptMap.get(tableName).has(propertyObjInfo)) {
            return this.tableNameKeyObjInfoCryptMap.get(tableName).get(propertyObjInfo);
        } else {
            return tableName;
        }
    }

    async _makeFields(cryptAliasesMapUtil) {
        let f1 = await this._fieldsFromMainObject(cryptAliasesMapUtil);
        let f2 = {};
        if (Object.keys(this.objInfo).length !== 0) {
            f2 = await this._fieldsFromObjInfo(cryptAliasesMapUtil);
        }
        let res;
        if (Object.keys(this.objInfo).length !== 0) {
            res = f1 + ',\n' + f2 + '\n';
        } else {
            res = f1 + '\n';
        }
        return res;
    }

    async _fieldsFromMainObject(cryptAliasesMapUtil) {
        if (!this.object.fields || !this.object.PK || !this.object.name) {
            return Promise.reject('Broken main object.');
        }
        let table = this.object.name;
        let arrFields = [];

        for (let link in this.object.link) {
            let uuid = cryptAliasesMapUtil.cryptValue(`"${table}.${link}"`);
            arrFields.push(`${this.utils.dQuotes(table)}.${this.utils.dQuotes(link)} as "${uuid}"`);
        }
        for (let field in this.object.fields) {
            let uuid = cryptAliasesMapUtil.cryptValue(`"${table}.${field}"`);
            arrFields.push(`${this.utils.dQuotes(table)}.${this.utils.dQuotes(field)} as "${uuid}"`);
        }
        return Promise.resolve(arrFields.join(',\n'));
    }

    async _fieldsFromObjInfo(cryptAliasesMapUtil) {
        let arrFields = [];
        for (let ref in this.objInfo) {
            //если этот объект является табличной частью, то добавляем ключ

            if (this.objInfo[ref].rLink) {
                let table = this.objInfo[ref].rLink.object;
                let FK = this.objInfo[ref].rLink.field;
                let nameObject = `${ref}.${FK}`;
                let alias = this._getTableAlias(ref, table);
                let uuid1 = cryptAliasesMapUtil.cryptValue(`"${nameObject}"`);
                arrFields.push(`${this.utils.dQuotes(alias)}.${this.utils.dQuotes(FK)} as "${uuid1}"`);
            }
            let table = this.objInfo[ref].object;
            let alias = this._getTableAlias(ref, table);
            let PK = Object.keys(this.objInfo[ref].PK)[0];
            let uuid2 = cryptAliasesMapUtil.cryptValue(`"${ref}.${PK}"`);
            arrFields.push(`${this.utils.dQuotes(alias)}.${this.utils.dQuotes(PK)} as "${uuid2}" `);

            let fields = this.objInfo[ref].fields;
            for (let f in fields) {
                let uuid3 = cryptAliasesMapUtil.cryptValue(`"${ref}.${f}"`);
                arrFields.push(`${this.utils.dQuotes(alias)}.${this.utils.dQuotes(f)} as "${uuid3}"`);
            }
        }
        return Promise.resolve(arrFields.join(',\n'));
    }

    _mainobjLinkToTable() {
        let res = [];
        for (let o in this.object.link) {
            if (this.objInfo[o]) {
                res.push(this.utils.dQuotes(this.objInfo[o].object));
            }
        }
        return res.join(', ');
    }

    _makeFrom() {
        if (!this.object['name'] && this.object['name'].length === 0) {
            throw('Name object is undefined');
        }
        let from = 'FROM ';
        let nameObj = this.utils.dQuotes(this.object['name']);
        from += nameObj + '\n';
        return from;
    }

    async makeSet(values) {
        let f = new Filter(this);
        let res = '';
        let str = [];

        for (let field in values) {
            let infoField = f._objToSqlField(field);
            if (infoField.type === 'string') {
                infoField.type = [infoField.type];
            }
            let dataFormVal = {type: infoField.type, value: values[field]};
            let tmpStr = `${this.utils.dQuotes(infoField.smallField)} = ${(await pgFormatter.formatValue(dataFormVal)) || 'null'}`;
            str.push(tmpStr);
        }
        res += 'SET ';
        res += str.join(',') + ' ';
        return Promise.resolve(res);
    }

    async makeWhere() {
        if (Object.keys(this.filter).length === 0) {
            return Promise.resolve('');
        }
        let qStr = '';
        let filter = new Filter(this);
        filter.checkFields(['comparisons', 'tree']);
        if (Object.keys(this.filter.comparisons).length === 0 || Object.keys(this.filter.tree).length === 0) {
            return '';
        }
        let comparisons = await filter.getComparisons();
        qStr += 'WHERE ';
        qStr += `${comparisons}\n`;
        return qStr;
    }

    async makeSqlStringSelect(params, cryptAliasesMapUtil) {
        // генерируем строки, которые не портят агрегатную функцию count
        const select = this._makeSelect();
        const from = this._makeFrom();
        const where = await this.makeWhere();
        const join = await this._makeJoin();

        // проверка на агрегатные функции, если есть то формируем особый sql-запрос
        if (this._isAggregate(params)) {
            if (this._isAggregateOnlyCount(params)) {
                const count = this._switchAggregate({name: 'count', field: params.aggregate.count});
                return {sqlString: `${select} ${count} ${from} ${join} ${where}`, aggregate: true};
            }

            // методы для формирования агрегатных функций
            const aggregateFunctions = params.aggregate;
            let aggregateFields = [];
            for (let func in aggregateFunctions) {
                aggregateFields.push(this._switchAggregate({name: func, field: aggregateFunctions[func]}));
            }
            aggregateFields = aggregateFields.join(',');

            return {sqlString: `${select} ${aggregateFields} ${from} ${where}`, aggregate: true};
        }

        const distinct = this._makeDistinct(params);
        const fields = await this._makeFields(cryptAliasesMapUtil);

       let orderBy = this._makeOrderBy(params);

        // todo: groupBy
        const pagination = await this._makePagination(params);

        return {
            sqlString: `${select} ${distinct} ${fields} ${from} ${join} ${where} ${orderBy} ${pagination};`,
            aggregate: false
        };
    }

    _switchAggregate(aggregates) {
        const name = aggregates.name;
        const field = aggregates.field;
        switch (name) {
            case 'max':
                return `MAX(${field}) as ${field}`;
            case 'min':
                return `MIN(${field}) as ${field}`;
            case 'avg':
                return `AVG(${field}) as ${field}`;
            case 'sum':
                return `SUM(${field}) as ${field}`;
            case 'count':
                if (field === true) {
                    return `COUNT(*)`;
                }
                if (typeof(field) === 'string') {
                    return `COUNT(${field}) as ${field}`;
                }
                return '';
            default:
                // throw('Unrecognized aggregate function.');
                return '';
        }
    }

    _isAggregateOnlyCount(params) {
        let countMethods = params.aggregate.length;
        if (countMethods === 1 && params.aggregate.count) {
            return true;
        }
        return false;
    }

    _isAggregate(params) {
        if (params.aggregate && typeof(params.aggregate) === 'object' && Object.keys(params.aggregate).length > 0) return true;
        return false;
    }

    //todo: crypt tableName with cryptMap, use table name key, after fields name (ref.tablename.anotherTableID.refanotherTable).

    _makeOrderBy(params) {
        const f = new Filter(this);
        let qStr = '';
        if (typeof(params) === 'undefined' ||
            Object.keys(params).length === 0 ||
            typeof(params.orderBy) === 'undefined' ||
            !Array.isArray(params.orderBy) ||
            params.orderBy.length === 0) {
            const PK = Object.keys(this.object.PK)[0];
            const field = f._objToSqlField(PK).field;
            return `ORDER BY ${field} ASC`;
        }

        let orderFields = [];
        if (params.unique) {
            for (let i = 0; i < params.unique.length; i++) {
                const field = f._objToSqlField(params.unique[i]).field;
                let orderSort = 'asc';
                orderSort = getOrderSort(orderSort);
                orderFields.push(field + ' ' + orderSort);
            }
        }
        for (let i = 0; i < params.orderBy.length; i++) {
            const field = f._objToSqlField(params.orderBy[i].field).field;
            let orderSort = params.orderBy[i].sort || 'ASC';
            orderSort = orderSort.toLowerCase();
            orderSort = getOrderSort(orderSort);
            orderFields.push(field + ' ' + orderSort);
        }
        if (orderFields.length !== 0) {
            qStr += `ORDER BY ${orderFields.join(',')}\n`;
        }

        function getOrderSort(order) {
            switch (order) {
                case 'asc':
                    return 'ASC';
                case 'desc':
                    return 'DESC';
                default:
                    return 'ASC'
            }
        }

        return qStr;
    }
//todo: crypt tableName with cryptMap, use table name key, after fields name (ref.tablename.anotherTableID.refanotherTable).
    _makeDistinct(params) {
        const f = new Filter(this);
        let qStr = '';
        if (params === null || typeof(params.unique) === 'undefined' || !Array.isArray(params.unique)) {
            return '';
        }

        let distinctFields = [];
        for (let i = 0; i < params.unique.length; i++) {
            const fieldInfo = f._objToSqlField(params.unique[i]);
            distinctFields.push(fieldInfo.field);
        }
        if (distinctFields.length !== 0) {
            qStr += `DISTINCT ON (${distinctFields.join(',')})`;
        }

        return qStr;
    }

    _makeSelect() {
        return 'SELECT';
    }

    async _makePagination(params) {
        let f = new Filter(this);
        let qStr = '';

        if (!params.pagination || !params.pagination.limit) {
            return '';
        }
        if (!validator.isInt(params.pagination.limit.toString(), {min: 1, max: 50000}) || !params.orderBy) {
            throw('Incorrect parameters for pagination.');
        }
        if (params.pagination.offset || validator.isInt(params.pagination.offset.toString(), {min: 0})) {
            qStr += `OFFSET ${params.pagination.offset} `;
        }

        qStr += `LIMIT ${params.pagination.limit}\n`;
        return qStr;
    }

    _sortObject(o) {
        function compareLengthStr(a, b) {
            if (a.search(/[.]/) === -1) {
                a = 1;
            } else {
                a = a.split('.').length;
            }

            if (b.search(/[.]/) === -1) {
                b = 1;
            } else {
                b = b.split('.').length;
            }
            return a - b;
        }

        let sorted = {},
            key, a = [];

        for (key in o) {
            if (o.hasOwnProperty(key)) {
                a.push(key);
            }
        }

        a.sort(compareLengthStr);

        for (key = 0; key < a.length; key++) {
            sorted[a[key]] = o[a[key]];
        }
        return sorted;
    }
}