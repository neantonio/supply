'use strict'
let dataRouter = require('../../routers/dataRouter');
let builder = require('../../builder');

let Response = builder.Response;

import {utils} from '../../utils.js';
import {getConfigParam} from '../configs/listForm.js';
import {_} from 'lodash';

let cloneDeep = require('lodash.clonedeep');

async function handler(clientData) {

    let path = clientData.path;
    let type = clientData.data.type;
    let action = clientData.action;
    console.log(action);
    let expGridPostfix = clientData.data.expGridPostfix || "";
    let recordData = clientData.data.record;
    let values = [];
    if (Array.isArray(recordData)) {
        values = recordData;
    } else {
        values.push(recordData);
    }
    let filter = clientData.data.filter;
    let queryParams = clientData.data.queryParams || {};
    let objViewClient = clientData.objView;
    let token = clientData.token;
    // дополнительные поля с клиента
    let additionalFields = clientData.data.additionalFields || [];

    let response = new Response();

    let object = utils.getObjectName(path);
    let commonInterface = await dataRouter.getInterface(objViewClient, null, token);

    console.log(action);
    if (action === 'update') {
        let serverData = await updateRecord(path, queryParams, values, token, objViewClient);
        response.addContent(path, serverData.fields, serverData.records);
    } else if (action === 'add') {
        let serverData = await addRecord(path, values, token, objViewClient);
        response.addContent(path, serverData.fields, serverData.records);
    } else if (action === 'copy') {
        let serverData = await copyRecord(path, queryParams, token, objViewClient);
        response.addContent(path, serverData.fields, serverData.records);
    } else if (action === 'getContent') {
        if (type === 'gridRecords') {
            let objInterface = utils.getObjectInterface(commonInterface, object);
            // копируем для того, чтобы не коверкать конфигурацию
            let gridColumns = cloneDeep(objInterface.fields);
            let mainFK = getConfigParam('common', 'mainFK');
            let fkInfo = getConfigParam(object, 'fkInfo');
            let queryOptionalFields = utils.getOptionalFields(gridColumns, fkInfo, mainFK);
            // добавим дополнительные поля, которые пришли от клиента
            additionalFields.forEach((field) => {
                let value = _.find(queryOptionalFields.additionalFields, item => item === field);
                if (!value) queryOptionalFields.additionalFields.push(field);
            });
            let refCol = utils.getRefCol(gridColumns);
            let filter = queryParams.filter;
            if (filter !== undefined && filter.comparisons.FK !== undefined) {
                filter.comparisons[refCol] = filter.comparisons.FK;
                filter.comparisons[refCol].right.value = filter.comparisons['FK'].right.value;
                //filter[refCol] = {};
                //filter[refCol] = filter.FK;
                delete filter.comparisons.FK
            }
            if (!Array.isArray(queryOptionalFields) && (queryOptionalFields.objectFields.length > 0 || queryOptionalFields.additionalFields.length > 0)) {
                // дозапрашиваем поля
                try {
                    let result = await utils.extendOptionalFields(object, gridColumns, queryOptionalFields, fkInfo, mainFK, token, objViewClient, commonInterface);
                    gridColumns = result.gridColumns;
                    queryOptionalFields = result.queryOptionalFields;
                } catch (e) {
                    console.log("Ошибка utils.extendOptionalFields : " + e);
                    throw (e);
                }

            }
            let gridRecords = [];
            try {
                gridRecords = await utils.getRecords({
                    object: object,
                    fields: queryOptionalFields || [],
                    //filter: filter,
                    queryParams: queryParams,
                    // relation: clientData.data.relation,
                    // pagination: {
                    //     offset: clientData.data.offset,
                    //     limit: clientData.data.limit
                    // },
                    // orderBy: clientData.data.orderBy,
                    token: token,
                    objViewClient: objViewClient
                }, mainFK, commonInterface);
            } catch (e) {
                console.log("Ошибка utils.getRecords : " + e);
                throw (e);
            }
            // форматируем записи
            let dataRenderer = getConfigParam(object, 'dataRenderer');
            if (dataRenderer) {
                gridRecords = dataRenderer({gridRecords: gridRecords}).gridRecords;
            }
            let content = response.makeContent(gridColumns, gridRecords);
            let forId = path + (expGridPostfix ? `-grid-${expGridPostfix}` : '-grid-listForm');
            response.content.push({
                forId: [forId],
                records: content.records,
                fk: content.fk
            });
        } else if (type === "getFieldValues") {
            let records = await getFieldValues(path, queryParams, token, objViewClient);
            response.addFk(path, records);
        }
    }

    return response;

    async function copyRecord(path, queryParams, token, objViewClient) {

        let object = utils.getObjectName(path);
        // формируем параметры запроса на сервер
        let queryOptions = {
            object: object,
            //filter: filter,
            queryParams: queryParams,
            token: token,
            objViewClient: objViewClient
        };

        let interfaceData;
        let formFields;
        try {
            interfaceData = utils.getObjectInterface(commonInterface, object);
            formFields = cloneDeep(interfaceData.fields);
        } catch (err) {
            throw('Ошибка при получении интерфейса объекта: ' + object + ' при копировании записи');
        }

        // ищем поле которое является первичным ключом для запроса по нему
        let PK = utils.getPrimaryKeyField(formFields);

        if (!PK) throw('Для объекта ' + object + " не найден первичный ключ!");

        // в фильтре должен быть отбор только по первичному ключу
        if (Object.keys(queryParams.filter.comparisons).length !== 1 || !queryParams.filter.comparisons[PK]) {
            throw('Для объекта ' + object + " при обновлении записи не задан отбор по первичному ключу!");
        }

        // копируем запись
        let serverData;
        try {
            serverData = await dataRouter.copyServerData(queryOptions);
        } catch (err) {
            throw("Ошибка при копировании записи объекта " + object + ": " + err)
        }

        let newID = Object.keys(serverData.records)[0];
        if (!newID) {
            throw("Сервер БД не вернул ID добавленной записи при копировании объекта " + object);
        }

        // Отредактируем filter чтобы запросить скопированную запись
        queryParams.filter.comparisons[PK].right.value = newID;

        // запрашиваем только что добавленные данные
        let recordData;
        try {
            let additionalFields = getConfigParam(object, 'fkInfo');
            let queryOptionalFields = utils.getOptionalFields(formFields, additionalFields);
            if (!Array.isArray(queryOptionalFields) && (queryOptionalFields.objectFields.length > 0 || queryOptionalFields.additionalFields.length > 0)) {
                //дозапрашиваем поля
                try {
                    let result = await utils.extendOptionalFields(object, formFields, queryOptionalFields, undefined, undefined, token, objViewClient, commonInterface);
                    formFields = result.gridColumns;
                    queryOptionalFields = result.queryOptionalFields;
                } catch (e) {
                    console.log("Ошибка utils.extendOptionalFields : " + e);
                    throw (e);
                }
            }
            recordData = await utils.getRecords({
                object: object,
                fields: queryOptionalFields,
                //filter: filter,
                queryParams: queryParams,
                token: token,
                objViewClient: objViewClient
            }, undefined, commonInterface);
        } catch (err) {
            console.log("Ошибка при считывании записи после копирования записи объекта " + object + ": " + err);
            throw(err);
        }
        return {
            fields: formFields,
            records: recordData
        };

    }

    async function updateRecord(path, queryParams, values, token, objViewClient) {

        let object = utils.getObjectName(path);
        // формируем параметры запроса на сервер
        let queryOptions = {
            object: object,
            //filter: filter,
            queryParams: queryParams,
            values: values,
            token: token,
            objViewClient: objViewClient
        };

        // необходимо проконтролировать что мы задаем filter только по PK, чтобы не обновить сразу много чего
        let interfaceData;
        let formFields;
        try {
            interfaceData = utils.getObjectInterface(commonInterface, object);
            formFields = cloneDeep(interfaceData.fields);
        } catch (err) {
            throw('Ошибка при получении интерфейса объекта: ' + object + ' при обновлении записи');
        }

        // ищем поле которое является первичным ключом для запроса по нему
        let PK = utils.getPrimaryKeyField(formFields);

        if (!PK) throw('Для объекта ' + object + " не найден первичный ключ!");

        // в фильтре должен быть отбор только по первичному ключу
        if (Object.keys(queryParams.filter.comparisons).length !== 1 || !queryParams.filter.comparisons[PK]) {
            throw('Для объекта ' + object + " при обновлении записи не задан отбор по первичному ключу!");
        }

        // добавляем запись
        let serverData;
        try {
            serverData = await dataRouter.updateServerData(queryOptions);
        } catch (err) {
            throw("Ошибка при изменении записи в объекте " + object + ": " + err)
        }

        // запрашиваем только что добавленные данные
        let recordData;
        try {
            let additionalFields = getConfigParam(object, 'fkInfo');
            let queryOptionalFields = utils.getOptionalFields(formFields, additionalFields);
            if (!Array.isArray(queryOptionalFields) && (queryOptionalFields.objectFields.length > 0 || queryOptionalFields.additionalFields.length > 0)) {
                //дозапрашиваем поля
                try {
                    let result = await utils.extendOptionalFields(object, formFields, queryOptionalFields, undefined, undefined, token, objViewClient, commonInterface);
                    formFields = result.gridColumns;
                    queryOptionalFields = result.queryOptionalFields;
                } catch (e) {
                    console.log("Ошибка utils.extendOptionalFields : " + e);
                    throw (e);
                }
            }
            recordData = await utils.getRecords({
                object: object,
                fields: queryOptionalFields,
                //filter: filter,
                queryParams: queryParams,
                token: token,
                objViewClient: objViewClient
            }, undefined, commonInterface);
        } catch (err) {
            console.log("Ошибка при считывании записи после обновления записи в объект " + object + ": " + err);
            throw(err);
        }
        return {
            fields: formFields,
            records: recordData
        };

    }

    async function addRecord(path, values, token, objViewClient) {

        let object = utils.getObjectName(path);
        // формируем параметры запроса на сервер
        let queryOptions = {
            object: object,
            values: values,
            token: token,
            objViewClient: objViewClient
        };

        // добавляем запись
        let serverData;
        let formFields;
        try {
            serverData = await dataRouter.insertServerData(queryOptions);
            formFields = cloneDeep(serverData.tableDesc.object.fields);
        } catch (err) {
            console.log("Ошибка при добавлении записи в объект " + object + ": " + err);
            throw(err);
        }

        // ищем поле которое является первичным ключом для запроса по нему
        let PK = utils.getPrimaryKeyField(formFields);

        let newIDs = [];
        for (let index in serverData.records) {
            newIDs.push(index);
        }
        if (!newIDs.length) {
            throw("Сервер БД не вернул ID добавленной записи при копировании объекта " + object);
        }

        /*if (!values[0][PK]) {
            throw("Сервер БД не вернул ID добавленной записи при записи объекта " + object);
        }*/

        // запрашиваем только что добавленные данные
        let recordData;
        try {
            let filterRef = {
                comparisons: {
                    [PK] : {
                        left: {
                            type :'field',
                            value: PK
                        },
                        right: {
                            type :'value',
                            value: newIDs
                        },
                        sign: 'in'
                    }
                },
                tree: {
                    and : [PK]
                }
            };
            let queryParams = {
                filter : filterRef
            };
            /*let filter = {
                [PK]: {
                    value: newIDs,
                    sign: 'in'
                }
            };*/
            let additionalParams = getConfigParam(object, 'fkInfo');
            let queryOptionalFields = utils.getOptionalFields(formFields, additionalParams);
            if (!Array.isArray(queryOptionalFields) && (queryOptionalFields.objectFields.length > 0 || queryOptionalFields.additionalFields.length > 0)) {
                //дозапрашиваем поля
                try {
                    let result = await utils.extendOptionalFields(object, formFields, queryOptionalFields, undefined, undefined, token, objViewClient, commonInterface);
                    formFields = result.gridColumns;
                    queryOptionalFields = result.queryOptionalFields;
                } catch (err) {
                    console.log("Ошибка utils.extendOptionalFields : " + err);
                    throw (err);
                }

            }
            recordData = await utils.getRecords({
                object: object,
                fields: queryOptionalFields || [],
                // filter: filter,
                queryParams: queryParams,
                token: token,
                objViewClient: objViewClient
            }, undefined, commonInterface);
        } catch (err) {
            throw("Ошибка при считывании записи после добавления в объект " + object + ": " + err)
        }

        return {
            fields: formFields,
            records: recordData
        };

    }

    async function getFieldValues(path, queryParams, token, objViewClient) {
        let object = utils.getObjectName(path);
        let serverData;
        try {
            serverData = await utils.getRecords({
                object: object,
                //filter: filter,
                queryParams: queryParams,
                token: token,
                objViewClient: objViewClient
            }, undefined, commonInterface);
        } catch (err) {
            throw('Ошибка получения данных для поля ' + object + ": " + err);
        }

        return serverData;
    }

}

module.exports = {
    handler: handler
};