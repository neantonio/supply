/**
 * Класс для работы с фильтром
 */
import {pgFormatter} from "./pgFormatter";
import {logger} from '../../Logger/controller';
import * as textM from "../../src/main/util/TextM";

export class Filter {
    constructor(obj) {
        this.filter = obj.filter;
        this.comparisons = null;
        this.objInfo = obj.objInfo;
        this.mainObj = obj.object;
        this.utils = obj.utils;
        this.tableNameKeyObjInfoCryptMap = obj.tableNameKeyObjInfoCryptMap;
    }

    async getComparisons() {
        let comparisons = {};
        for (let s in this.filter.comparisons) {
            let row = '';
            let coms = this.filter.comparisons[s];
            let left = coms.left;
            let right = coms.right;
            let fieldType = {

            };
            let field  = {

            };

            //ищем тип поля для последующей подстановки в formatValue
            if (left.type === 'field') {
                let infoSqlField = this._objToSqlField(left.value);
                fieldType.left = infoSqlField.type;
                field.left = infoSqlField.field;
            }
            if (right.type === 'field' || right.type === 'max') {
                let infoSqlField = this._objToSqlField(right.value);
                fieldType.right = infoSqlField.type;
                field.right = infoSqlField.field;
            }

            //обработка левой части выражения
            if (left.type === 'field') {
                row += field.left;
            } else {
                row += await pgFormatter.formatValue({type: fieldType.right, value: left.value});
            }

            let sign = coms.sign;
            let formattedSign;

            //обработка знака сравнения
            if (typeof sign !== 'undefined' && typeof textM.znak[sign] !== 'undefined') {
                if (sign.toUpperCase() === 'RIN' && right.value !== null) {
                    let tableName = this._getTableName(left, right, field.left);
                    comparisons[s] = this._getRinWhereQueryString(tableName, right.value,left.value);
                    continue;
                }
                if (sign === 'equal' && (right.value === null  || right.value === '')) {
                    row += ' is NULL ';
                    comparisons[s] = row;
                    continue;
                }
                if (sign === 'unEqual' && (right.value === null || right.value === '')) {
                    row += ' is NOT NULL ';
                    comparisons[s] = row;
                    continue;
                }
                formattedSign = textM.znak[sign];
                row += ` ${formattedSign} `;
            } else {
                throw('Incorrect sign: ' + sign);
            }

            //обработка правой части
            if (right.type === 'field') {
                row += field.right;
            } else if (right.type === 'max') {
                row += `${this._getMaxValue()}`;
            } else {
                if (sign === 'consist') {
                    const ilikeExpression = this.utils.addQuotes('%' + right.value + '%');
                    row += ` ${ilikeExpression} `;
                } else if (Array.isArray(right.value)) {
                    let values = [];
                    for (let i = 0; i < right.value.length; i++) {
                        values.push(await pgFormatter.formatValue({type: fieldType.left, value: right.value[i]}));
                    }
                    row += this.utils.addBrackets(values.join(','));
                } else {
                    const trueValue = await pgFormatter.formatValue({type: ["boolean", "string"], value: true});
                    const falseValue = await pgFormatter.formatValue({type: ["boolean", "string"], value: false});
                    const formattedValue = await pgFormatter.formatValue({type: fieldType.left, value: coms.right.value});
                    if (sign === 'equal' && formattedValue === falseValue || sign === 'unEqual' && formattedValue === trueValue) {
                        row = `${field.right} is NULL OR ${field.right} ${formattedSign} ${formattedValue}`;
                    } else {
                        row += formattedValue;
                    }
                }
            }
            comparisons[s] = row;
        }
        this.comparisons = comparisons;
        let concatComparisons = await this._recursiveConcatComparisons();
        return concatComparisons;
    }

    _getMaxValue(field, table) {
        const fieldInfo = this._objToSqlField(field);

        return `SELECT max(${field}) FROM ${table} `;
    }

    checkFields(chkFields) {
        if (this.filter.length === 0) {
            throw new Error('empty filter');
        }
        return this._checkParams(this.filter, chkFields);
    }

    _recursiveConcatComparisons() {
        // return new Promise((resolve, reject) => {
        let self = this;
        let tree = this.filter.tree;
        if (tree.length === 0 || typeof tree === 'undefined') {
            return Promise.reject('empty array');
        }
        let res = [];
        for (let condition in tree) {
            switch (condition) {
                case 'and':
                    res.push(repeat(tree[condition], condition));
                    break;
                case 'or':
                    res.push(repeat(tree[condition], condition));
                    break;
            }
            if (res.error) {
                return Promise.reject(res.error);
            }
            res = res.join();
        }
        return Promise.resolve(res);

        function repeat(tree, condition) {
            // [ 'date', 'soap', 'rope' ], and
            let result = [];
            for (let i = 0; i < tree.length; i++) {
                if (typeof tree[i] === 'object') {
                    if (typeof tree[i]['and'] !== 'undefined') {
                        result.push(`(${repeat(tree[i]['and'], 'and')})`);
                    } else if (typeof tree[i]['or'] !== 'undefined') {
                        result.push(`(${repeat(tree[i]['or'], 'or')})`);
                    }
                } else {
                    let comparison = self._getComparisonFromTextComparison(tree[i]);
                    if (comparison.error) {
                        return {error: comparison.error};
                    } else {
                        result.push(`(${self._getComparisonFromTextComparison(tree[i])})`);
                    }
                }
            }
            return result.join(` ${condition} `);
        }

    }

    _getComparisonFromTextComparison(inputCondition) {
        if (this.comparisons[inputCondition]) {
            return this.comparisons[inputCondition];
        }
        return {error: 'Condition is not found'}
    }

    _checkParams(params, list) {
        for (let i = 0; i < list.length; i++) {
            if (params[list[i]] === undefined) {
                throw('Empty ' + list[i]);
            }
        }
        return 'Check params success';
    }

    _objToSqlField(obj) {
        let result;
        let table;
        let type;
        let field;
        if (obj.search(/[.]/) !== -1) {
            let splObj = obj.split('.');
            let lastField = splObj[splObj.length - 1];//кроме последнего элемента
            splObj.length = splObj.length - 1;
            let objWithoutLastField = splObj.join('.');//вся строка до последнего элемента

            //если есть тч то работает
            if (this.objInfo[objWithoutLastField]) {
                table = this.objInfo[objWithoutLastField].object;
                let object = this.objInfo[objWithoutLastField];
                if (object.PK && object.PK[Object.keys[0]] === lastField) {
                    type = object.PK[lastField];
                } else {
                    //иначе смотрим в полях и ищем это поле там
                    if (object.fields) {
                        let fields = object.fields;
                        if (fields[lastField]) {
                            type = fields[lastField];
                            let alias = this._getTableAlias(objWithoutLastField, table);
                            field = `"${alias}"."${lastField}"`;
                        }
                    }
                }
            } else {
                //перебираем весь objInfo тк. ключи неизвестны и ищем там обычное поле
                for (let o in this.objInfo) {
                    if (this.objInfo[o].object === objWithoutLastField) {
                        table = objWithoutLastField;

                        field = `"${table}"."${lastField}"`;
                        let object = this.objInfo[o];
                        if (object.PK && Object.keys(object.PK)[0] === lastField) {
                            type = object.PK[lastField];
                        } else {
                            if (object.fields) {
                                let fields = object.fields;
                                if (fields[lastField]) {
                                    type = fields[lastField];
                                }
                            }
                        }

                    }
                }
            }
            result = {
                field: field,
                type: type,
                smallField: lastField
            };
        } else {
            if (this.mainObj.link[obj]) {
                table = this.mainObj.name;
                field = `${this.utils.dQuotes(table)}.${this.utils.dQuotes(obj)}`;
                type = this.mainObj.link[obj];
            } else {
                table = this.mainObj.name;

                field = `${this.utils.dQuotes(table)}.${this.utils.dQuotes(obj)}`;
                if (this.mainObj.fields[obj]) {
                    type = this.mainObj.fields[obj];
                }
            }
            result = {
                field: field,
                type: type,
                smallField: obj
            };
        }
        for (let f in result) {
            if (typeof(result[f]) === 'undefined') {
                logger.write(`error`, `Модуль PG. Ошибка в функции objToSql.`, new Error());
                throw(`Модуль PG. Ошибка в функции objToSql.`);
            }
        }
        return result;
    }

    _getTableAlias(propertyObjInfo, tableName) {
        if (this.tableNameKeyObjInfoCryptMap.has(tableName) &&
            this.tableNameKeyObjInfoCryptMap.get(tableName).has(propertyObjInfo)) {
            return this.tableNameKeyObjInfoCryptMap.get(tableName).get(propertyObjInfo);
        } else {
            return tableName;
        }
    }


    _getRinWhereQueryString(tableName, parentIDArray, cryptField) {
        if (!Array.isArray(parentIDArray)) {
            let value = parentIDArray;
            parentIDArray = [];
            parentIDArray.push(value);
        }

        let aliasTableName = this._getTableAlias(cryptField, tableName);
        let resultString = "";
        for (let i = 0; i < parentIDArray.length; i++) {
            if (i > 0) {
                resultString += ' OR ';
            }
            let parentID = parentIDArray[i];
            resultString +=
                `"${aliasTableName}"."ID" IN (
                SELECT ${tableName}."ID" FROM
                ${tableName} WHERE ${tableName}."ID" ='${parentID}'
                UNION
                
                SELECT ${tableName}."ID"
                FROM
                  ( WITH RECURSIVE recurcy_table AS (
                SELECT
                "ID",
                "parentID"
                FROM ${tableName}
                WHERE "parentID" = '${parentID}'
                
                UNION
                
                -- рекурсивная часть
                SELECT
                ${tableName}."ID",
                ${tableName}."parentID"
                FROM ${tableName}
                JOIN recurcy_table ON ${tableName}."parentID" = recurcy_table."ID"
                )
                SELECT *
                FROM recurcy_table) AS x, ${tableName}
                WHERE ${tableName}."ID" IN (x."ID"))`

        }


        return resultString;
    }

    _getTableName(left, right, field) {
        let foreignFieldCandidates = [];
        if (left.type === "field") {
            foreignFieldCandidates.push(left.value);
        }
        if (right.type === "field") {
            foreignFieldCandidates.push(right.value);
        }

        for (let foreignFieldCandidat of foreignFieldCandidates) {
            if (foreignFieldCandidates in this.objInfo) {
                let tableName = this.objInfo[foreignFieldCandidates].object;
                return tableName;
            }
        }
        return field.split(".")[0];
    }
}