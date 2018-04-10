let express = require('express');
let router = express.Router();
let dataRouter = require('../routers/dataRouter');
import {utils} from '../utils'
import * as uuid from "uuid";

let _ = require('lodash');

// запрашиваем дополнительную информацию для закупочной комиссии по переданным позициям
router.post('/getDataForGroupInZK', async function (req, res, next) {
    let clientData = req.body;
    let positionIDArr = clientData.data.positionIDs;
    let token = clientData.token;
    let objViewClient = clientData.objView;

    try {
        // запрашиваем информацию о заявках для позиций
        let posQueryMap = await getPosQueryMap();
        // получем массив уникальных queryID
        let queryIDArr = _.uniq(_.values(posQueryMap));
        // получаем данные о количестве всех позиций на различных этапах и представления(description) для заявок
        let otherInfo = await getOtherInfo(queryIDArr);
        // формируем ответ, который поймет клиент
        let responseRes = prepareResponseResult(posQueryMap, otherInfo);

        res.send({
            status: 'success',
            message: responseRes
        });
    } catch (err) {
        next(err);
    }

    // функция по заданному массиву id позиций формирует соответствие id позиции : id заявки
    async function getPosQueryMap() {

        /*let filter = {
            "ID": {
                sign: "in",
                value: positionIDArr
            }
        };*/

        let filter = {
            comparisons: {
                ID: {
                    left: {
                        type: 'field',
                        value: 'ID'
                    },
                    right: {
                        type: 'value',
                        value: positionIDArr
                    },
                    sign: 'in'
                }
            },
            tree: {
                and: ['ID']
            }
        };

        let queryParams = {
            object: 'query_position',
            method: 'get',
            // filter: filter,
            queryParams: {
                filter: filter
            },
            token: token,
            objViewClient: objViewClient
        };

        // запрашиваем информацию о заявках позиций
        let serverData = await dataRouter.getServerData(queryParams);

        let posQueryMap = {};
        for (let recID in serverData.records) {
            let record = serverData.records[recID];
            let positionID = record.fields.ID;
            let queryID = record.fields.queryID;
            posQueryMap[positionID] = queryID;
        }

        return posQueryMap;
    }

    // получаем данные о количестве всех позиций на различных этапах и представления(description) для заявок
    async function getOtherInfo(queryIDArr) {
        /*let filter = {
            "queryID": {
                sign: "in",
                value: queryIDArr
            }
        };*/

        let filter = {
            comparisons: {
                queryID: {
                    left: {
                        type: 'field',
                        value: 'queryID'
                    },
                    right: {
                        type: 'value',
                        value: queryIDArr
                    },
                    sign: 'in'
                }
            },
            tree: {
                and: ['queryID']
            }
        };

        let queryParams = {
            object: 'query_position',
            method: 'get',
            //filter: filter,
            queryParams: {
                filter: filter
            },
            token: token,
            fields: ['queryID.description'],
            objViewClient: objViewClient
        };

        // запрашиваем информацию о всех позициях по списку заявок
        let serverData = await dataRouter.getServerData(queryParams);

        // объект для хранения данных о количестве позиций на этапах в разрезе заявок
        let stagesData = {};
        // информация о представлении(description) заявки
        let queriesInfo = {
            queryIDFromServer: {}
        };

        // цикл по позициям
        for (let recID in serverData.records) {
            let record = serverData.records[recID];
            let query = record.fields.queryID;
            let stage = record.fields.stage;
            let queryID = query.ID;
            let queryDescr = query.description;

            if (stagesData[queryID] === undefined) {
                stagesData[queryID] = {};
            }
            // считаем позиции на текущей стадии
            if (stagesData[queryID][stage] === undefined) {
                stagesData[queryID][stage] = 1;
            } else {
                ++stagesData[queryID][stage];
            }

            queriesInfo.queryIDFromServer[queryID] = queryDescr;
        }

        stagesInfoToText();

        return {
            stagesData: stagesData,
            queriesInfo: queriesInfo
        };

        // функция преобразует объект с количественной информацией об этапах в строку
        function stagesInfoToText() {
            for (let queryID in stagesData) {
                let stagesText = '';
                let stagesInfo = stagesData[queryID];
                for (let stage in stagesInfo) {
                    let stageValue = stagesInfo[stage];
                    let stageName = (stage === 'null' || stage === 'undefined') ? 'Без стадии' : stage;
                    stagesText += stageName + ' : ' + stageValue + '; ';
                }
                stagesData[queryID] = stagesText;
            }
        }
    }

    // формируем ответ, который поймет клиент
    function prepareResponseResult(posQueryMap, data) {

        // информация о дополнительных колонках
        let columns = {
            stagesInfo: {
                field: "stagesInfo",
                hidden: false,
                type: "string",
                caption: "Стадии",
                size: '30%'
            },
            queryIDFromServer: {
                field: "queryIDFromServer",
                hidden: false,
                link: "query",
                type: "reference",
                caption: "Заявка",
                size: '30%'
            }
        };

        for (let positionID in posQueryMap) {
            let queryID = posQueryMap[positionID];
            let stagesInfo = data.stagesData[queryID];
            posQueryMap[positionID] = {
                queryIDFromServer: [queryID],
                stagesInfo: stagesInfo
            };
        }

        let records = posQueryMap;
        let fk = data.queriesInfo;

        return {
            columns: columns,
            records: records,
            fk: fk
        }
    }
});
// запрашиваем информацию о движении позиции по этапам
router.post('/getPositionHisory', async function (req, res, next) {
    let clientData = req.body;
    let positionID = clientData.data.positionID;
    let token = clientData.token;
    let objViewClient = clientData.objView;

    try {
        let responseRes = await getPositionHistory();

        res.send({
            status: 'success',
            message: responseRes
        });
    } catch (err) {
        next(err);
    }

    async function getPositionHistory() {

        /*let filter = {
            "qid": {
                sign: "equal",
                value: positionID
            }
        };*/

        let filter = {
            comparisons: {
                qid: {
                    left: {
                        type: 'field',
                        value: 'qid'
                    },
                    right: {
                        type: 'value',
                        value: positionID
                    },
                    sign: 'equal'
                }
            },
            tree: {
                and: ['qid']
            }
        };

        let orderBy = [
            {
                field: 'date',
                sort: 'ASC'
            }
        ];

        let queryParams = {
            object: 'stages',
            method: 'get',
            queryParams: {
                filter: filter,
                parameters: {
                    orderBy : orderBy
                }
            },
            /*filter: filter,
            orderBy: orderBy,*/
            token: token,
            objViewClient: objViewClient
        };

        let serverData = await dataRouter.getServerData(queryParams);

        let serverResponse = formHtmlResponse(serverData);

        return serverResponse;

        function formHtmlResponse(serverData) {

            let HTML = '<ul class="list-group">';
            for (let recID in serverData.records) {
                let record = serverData.records[recID];
                let date = record.fields.date.toLocaleString("ru");
                let stageName = record.fields.stageName;
                HTML += `<li class="list-group-item" style = "text-align: left">
                            ${stageName}
                            <span style = "float: right">${date}</span>
                         </li>`;
            }

            HTML += '</ul>';
            return HTML;
        }

    }
});
// запрашиваем информацию о других позициях с такой же номенклатурой как в передаваймой позиции
router.post('/outlayInfo', async function (req, res, next) {

    let clientData = req.body;
    let positionID = clientData.data.positionID;
    let token = clientData.token;
    let objViewClient = clientData.objView;

    // получаем productID и outlayDocumentID
    let productAndOutlay = getProductIDAndOutlayID();

    // если сметы нет то дальше не продолжаем 
    if (!productAndOutlay.outlayDocumentID) {
        res.send({
            status: 'error',
            message: "Заявка позиции не привязана к смете"
        });
    }

    // получаем позиции с нужной номенклатурой из всех заявок с заданной сметой
    let positionsInfo = getPositionsByOutlayID(productAndOutlay.productID, productAndOutlay.outlayDocumentID);

    /*1) Отправляем id позиции
    2) Делаем запрос к query_position с фильтром по ID и получаем productID и outlayDocumentID(через заявку)
    3) Если outlayID === null отправляем сообщение что нет сметы
    4) Делаем запрос к outlayDocument_position с фильтром по outlayDocumentID и productID и получаем все заявки, которые прикреплены к этой смете и имеют позиции с номенклатурой productID
    5) Делаем запрос к query_position с фильтром по queryID и productID (получаем все позиции с номенклатурой productID из заявок которые прикреплены к смете outlayDocumentID)*/


    async function getProductIDAndOutlayID() {
        let result = {};
        /*let filter = {
            "ID": {
                sign: "equal",
                value: positionID
            }
        };*/

        let filter = {
            comparisons: {
                ID: {
                    left: {
                        type: 'field',
                        value: 'ID'
                    },
                    right: {
                        type: 'value',
                        value: positionID
                    },
                    sign: 'equal'
                }
            },
            tree: {
                and: ['ID']
            }
        };

        let fields = [
            'queryID.outlayDocumentID'
        ];

        let queryParams = {
            object: 'query_position',
            method: 'get',
            //filter: filter,
            queryParams: {
                filter: filter
            },
            token: token,
            fields: fields,
            objViewClient: objViewClient
        };

        let serverData = await dataRouter.getServerData(queryParams);

        let posID = Object.keys(serverData)[0];
        let record = serverData.records[posID].fields;
        let productID = record.productID;
        let outlayDocumentID = record.queryID.outlayDocumentID;

        return {
            productID: productID,
            outlayDocumentID: outlayDocumentID
        };
    }

    async function getPositionsByOutlayID(productID, outlayDocumentID) {
        let result = {};
        let filter = {
            "productID": {
                sign: "equal",
                value: productID
            },
            "outlayDocumentID": {
                sign: "equal",
                value: outlayDocumentID
            }
        };

        let fields = [
            'queryID.description'
        ];

        let queryParams = {
            object: 'query_position',
            method: 'get',
            filter: filter,
            token: token,
            objViewClient: objViewClient
        };

        let serverData = await dataRouter.getServerData(queryParams);

        for (let posID in serverData.records) {
            let record = serverData.records[posID].fields;
            let position = {
                id: posID,
                description: record
            };
            result[posID] = {
                query: {},
                position: {},
                quantity: 0,
                cost: 0
            };

            let productID = record.productID;
            let outlayDocumentID = record.queryID.outlayDocumentID;

        }


        return {
            productID: productID,
            outlayDocumentID: outlayDocumentID
        };
    }

    function makeColumns() {

        // задаем статикой
        let columns = {
            "ID": {
                "type": [
                    "uuid",
                    "string",
                    "object"
                ],
                "isPrimary": true,
                "readonly": true
            },
            "query": {
                "type": "link",
                "link": "query",
                "title": "Заявка"
            },
            "position": {
                "type": "link",
                "link": "query_position",
                "title": "Позиция"
            },
            "quantity": {
                "type": [
                    "integer",
                    "object"
                ],
                "title": "Количество"
            },
            "cost": {
                "type": [
                    "integer",
                    "object"
                ],
                "title": "Стоимость"
            }
        };

        return columns;
    }

});

// теперь используется createQueryFromOutlay, но может и это снова понадобится
router.post('/copyPosToOutlay', async function (req, res, next) {

    let clientData = req.body;
    // id копируемой заявки
    let queryID = clientData.data.queryID;
    // id документа "Смета" в который копируются позиции заявки
    let outlayID = clientData.data.outlayID;
    let token = clientData.token;
    let objViewClient = clientData.objView;

    try {
        if (!queryID || !outlayID) throw(new Error('Не переданы все данные для копирования!'));
        // получаем все позиции по queryID
        let positionsData = await getPositionsByQueryID();
        // если у заявки нет позиции сообщим об этом
        checkPositionsCount(positionsData);
        let values = getValuesInsert(positionsData);
        if (!values.length) throw(new Error('Не удалось сформировать данные для копирования!'));
        // делаем insert необходимых полей в ТЧ документы "Смета"
        await insertToOutlayPositions(values);
        res.status(200).send({
            status: 'success',
            message: 'success'
        });
    } catch (err) {
        next(err);
    }

    async function getPositionsByQueryID() {
        /*let filter = {
            "queryID": {
                sign: "equal",
                value: queryID
            }
        };*/

        let filter = {
            comparisons: {
                queryID: {
                    left: {
                        type: 'field',
                        value: 'queryID'
                    },
                    right: {
                        type: 'value',
                        value: queryID
                    },
                    sign: 'equal'
                }
            },
            tree: {
                and: ['queryID']
            }
        };

        let queryParams = {
            object: 'query_position',
            method: 'get',
            queryParams: {
                filter: filter
            },
            token: token,
            objViewClient: objViewClient
        };

        let serverData;
        try {
            serverData = await dataRouter.getServerData(queryParams);
        } catch (err) {
            console.log(err.stack);
            throw(err);
        }

        return serverData;
    }

    function getValuesInsert(positionsData) {
        let fieldsToCopy = ['productID', 'quantity', 'price'];
        let valuesArr = [];
        for (let posID in positionsData.records) {
            let positionRec = positionsData.records[posID].fields;
            let dataToCopy = {
                outlayDocumentID: outlayID,
                description: positionRec.tz
            };
            fieldsToCopy.forEach((fieldName) => {
                let fieldValue = positionRec[fieldName];
                // цена проставляется в ЗК, но при копировании она всегда должна быть 0
                if (fieldName === 'price') {
                    fieldValue = 1;
                }
                if (fieldValue !== undefined) {
                    dataToCopy[fieldName] = fieldValue;
                }
            });
            valuesArr.push(dataToCopy);
        }
        return valuesArr;
    }

    async function insertToOutlayPositions(values) {
        let queryOptions = {
            object: 'outlayDocument_position',
            values: values,
            token: token,
            objViewClient: objViewClient
        };

        let serverData;
        try {
            serverData = await dataRouter.insertServerData(queryOptions);
        } catch (err) {
            console.log("Ошибка при добавлении записи в объект " + object + ": " + err);
            throw(err);
        }
    }

    function checkPositionsCount(positionsData) {
        let count = Object.keys(positionsData.records).length;
        if (!count) throw(new Error('У заявки нет позиций!'));
    }

});

// создает заявку на основании сметы (вызывается из сметы)
router.post('/createQueryFromOutlay', async function (req, res, next) {

    let clientData = req.body;
    // id документа "Смета" из которого создается заявка
    let outlayID = clientData.data.outlayID;
    let token = clientData.token;
    let objViewClient = clientData.objView;

    try {
        // получаем данные сметы
        let outlayData = await getOutlayData();
        // готовим данные для создания заявки
        let queryData = prepareDataForQuery(outlayData);
        // создаем заявку
        let queryID = await createQuery(queryData);
        if (!queryID) throw(new Error('Не удалось создать заявку!'));
        // получаем все позиции сметы по outlayID
        let outlayPosData = await getPositionsByOutlayID();

        let positionsData = prepareValuesForQueryPos(outlayPosData, queryID);

        // делаем insert необходимых полей в ТЧ документы "Смета"
        await createQueryPositions(positionsData);

        res.status(200).send({
            status: 'success',
            message: 'success'
        });
    } catch (err) {
        next(err);
    }

    // получает данные сметы
    async function getOutlayData() {
        // let filter = {
        //     "ID": {
        //         value: outlayID
        //     }
        // };

        let filter = {
            comparisons: {
                ID: {
                    left: {
                        type: 'field',
                        value: 'ID'
                    },
                    right: {
                        type: 'value',
                        value: outlayID
                    },
                    sign: 'equal'
                }
            },
            tree: {
                and: ['ID']
            }
        };

        let queryParams = {
            object: 'outlayDocument',
            method: 'get',
            queryParams: {
                filter: filter
            },
            token: token,
            objViewClient: objViewClient
        };

        let serverData;
        try {
            serverData = await dataRouter.getServerData(queryParams);
        } catch (err) {
            console.log(err.stack);
            throw(err);
        }

        return serverData;
    }

    // формирует данные для создания заявки
    function prepareDataForQuery(outlayData) {
        let fieldsToCopy = ['organization', 'subdivision', 'stock'];

        if (outlayData.records[outlayID] === undefined) throw('Нет данных');
        let outlayRec = outlayData.records[outlayID].fields;

        let valuesArr = [];
        let dataToCopy = {
            outlayDocumentID: outlayID,
            description: outlayRec.description,
            date: (new Date()).toISOString()
        };

        fieldsToCopy.forEach((fieldName) => {
            let fieldValue = outlayRec[fieldName];
            if (fieldValue !== undefined) {
                dataToCopy[fieldName] = fieldValue;
            }
        });

        valuesArr.push(dataToCopy);
        return valuesArr;
    }

    // создает заявку
    async function createQuery(values) {
        let queryOptions = {
            object: 'query',
            values: values,
            token: token,
            objViewClient: objViewClient
        };

        let serverData;
        try {
            serverData = await dataRouter.insertServerData(queryOptions);
        } catch (err) {
            console.log("Ошибка при добавлении записи в объект " + object + ": " + err);
            throw(err);
        }

        let queryID = Object.keys(serverData.records)[0];

        return queryID;
    }

    // получает позиции из ТЧ счеты
    async function getPositionsByOutlayID() {
        // let filter = {
        //     "outlayDocumentID": {
        //         value: outlayID
        //     }
        // };

        let filter = {
            comparisons: {
                outlayDocumentID: {
                    left: {
                        type: 'field',
                        value: 'outlayDocumentID'
                    },
                    right: {
                        type: 'value',
                        value: outlayID
                    },
                    sign: 'equal'
                }
            },
            tree: {
                and: ['outlayDocumentID']
            }
        };

        let queryParams = {
            object: 'outlayDocument_position',
            method: 'get',
            queryParams: {
                filter: filter
            },
            token: token,
            objViewClient: objViewClient
        };

        let serverData;
        try {
            serverData = await dataRouter.getServerData(queryParams);
        } catch (err) {
            console.log(err.stack);
            throw(err);
        }

        return serverData;
    }

    // формирует данные для создания позиций заявки
    function prepareValuesForQueryPos(positionsData, queryID) {
        let fieldsToCopy = ['quantity'];
        let valuesArr = [];
        for (let outlayPosID in positionsData.records) {
            let outlayPosRec = positionsData.records[outlayPosID].fields;
            let dataToCopy = {
                outlayDocument_positionID: outlayPosRec.ID,
                tz: outlayPosRec.description,
                queryID: queryID
            };
            fieldsToCopy.forEach((fieldName) => {
                let fieldValue = outlayPosRec[fieldName];
                if (fieldValue !== undefined) {
                    dataToCopy[fieldName] = fieldValue;
                }
            });
            valuesArr.push(dataToCopy);
        }
        return valuesArr;
    }

    async function createQueryPositions(values) {
        let queryOptions = {
            object: 'query_position',
            values: values,
            token: token,
            objViewClient: objViewClient
        };

        let serverData;
        try {
            serverData = await dataRouter.insertServerData(queryOptions);
        } catch (err) {
            console.log("Ошибка при добавлении записи в объект " + object + ": " + err);
            throw(err);
        }
    }

});

router.post('/backToPreviousStage', async function (req, res, next) {

    let clientData = req.body;
    let token = clientData.token;
    let objViewClient = clientData.objView;

    let recordsToMove = clientData.data.recordsToMove;
    let stageMoveTo = clientData.data.stageTo;
    let stageMoveFrom = clientData.data.stageFrom;

    // получаем интерфейс схемы
    let commonInterface = await dataRouter.getInterface(objViewClient, null, token);
    let schemeInterface = utils.getObjectInterface(commonInterface, 'stages');
    let uniqueField = schemeInterface.uniqueFields[0];
    let stageMoveFromObj = schemeInterface.stages[stageMoveFrom];
    let stageUniqueField = stageMoveFromObj.unique[uniqueField];

    let uniqueFieldsValues = [];
    recordsToMove.forEach((rec) => {
        let value = rec[stageUniqueField];
        if (value) {
            if (Array.isArray(value)) {
                value = value[0];
            }
            uniqueFieldsValues.push(value);
        }
    });

    if (!uniqueFieldsValues.length) throw('Ошибка при подготовке перехода на предыдущий этап!');

    /*let filter = {
        [uniqueField]: {
            value: uniqueFieldsValues,
            sign: 'in'
        }
    };*/

    let filter = {
        comparisons: {
            [uniqueField]: {
                left: {
                    type: 'field',
                    value: uniqueField
                },
                right: {
                    type: 'value',
                    value: uniqueFieldsValues
                },
                sign: 'in'
            }
        },
        tree: {
            and: [uniqueField]
        }
    };

    let values = [{
        stage: stageMoveTo
    }];

    let queryOptions = {
        object: 'stages',
        values: values,
        //filter: filter,
        queryParams: {
            filter: filter
        },
        method: 'backTo',
        token: token,
        objViewClient: objViewClient
    };

    try {
        await dataRouter.performCustomAction(queryOptions);
        res.status(200).send({
            status: 'success',
            message: 'success'
        });
    } catch (err) {
        next(err);
    }
});

router.post('/decline', async function (req, res, next) {

    let clientData = req.body;
    let token = clientData.token;
    let objViewClient = clientData.objView;
    let path = clientData.path;

    let recordsToMove = clientData.data.recordsToMove;
    let stage = utils.getObjectName(path);

    // получаем интерфейс схемы
    let commonInterface = await dataRouter.getInterface(objViewClient, null, token);
    let schemeInterface = utils.getObjectInterface(commonInterface, 'stages');
    let uniqueField = schemeInterface.uniqueFields[0];
    let stageObj = schemeInterface.stages[stage];
    let stageUniqueField = stageObj.unique[uniqueField];

    let uniqueFieldsValues = [];
    recordsToMove.forEach((rec) => {
        let value = rec[stageUniqueField];
        if (value) {
            if (Array.isArray(value)) {
                value = value[0];
            }
            uniqueFieldsValues.push(value);
        }
    });

    if (!uniqueFieldsValues.length) throw('Ошибка при подготовке отказа позиции!');

    /*let filter = {
        [uniqueField]: {
            value: uniqueFieldsValues,
            sign: 'in'
        }
    };*/

    let filter = {
        comparisons: {
            [uniqueField]: {
                left: {
                    type: 'field',
                    value: uniqueField
                },
                right: {
                    type: 'value',
                    value: uniqueFieldsValues
                },
                sign: 'in'
            }
        },
        tree: {
            and: [uniqueField]
        }
    };

    let queryOptions = {
        object: 'stages',
        //filter: filter,
        queryParams: {
            filter: filter
        },
        method: 'abort',
        token: token,
        objViewClient: objViewClient
    };

    try {
        await dataRouter.performCustomAction(queryOptions);
        res.status(200).send({
            status: 'success',
            message: 'success'
        });
    } catch (err) {
        next(err);
    }
});

router.post('/getInnerFields', async function (req, res, next) {
    let clientData = req.body;
    let token = clientData.token;
    let objViewClient = clientData.objView;

    let parentID = clientData.data.parentID;
    let link = clientData.data.link;
    let formID = clientData.data.formID;

    // получаем интерфейс схемы
    let commonInterface = await dataRouter.getInterface(objViewClient, null, token);
    let objInterface = utils.getObjectInterface(commonInterface, link);

    try {
        res.status(200).send({
            status: 'success',
            message: {
                content: [
                    {
                        fk: {},
                        forId: [formID],
                        records: makeRecords(objInterface)
                    }
                ]
            }
        });
    } catch (err) {
        next(err);
    }

    function makeRecords(interfaceData) {
        // example of the output format
        /*let records = {
            "8a16764b-8555-97aa-274a-541721451037": {
                "fields": {
                    "ID": "8a16764b-8555-97aa-274a-541721451037",
                    "query" : {
                        "8a16764b-8555-97aa-274a-541721451038" : {
                            "fields" : {
                                "ID" : "8a16764b-8555-97aa-274a-541721451038",
                                "description" : "Заявка 1"
                            }
                        }
                    },
                    "position" : {
                        "8a16764b-8555-97aa-274a-541721451037" : {
                            "fields" : {
                                "ID" : "8a16764b-8555-97aa-274a-541721451037",
                                "description" : "Позиция 1"
                            }
                        }
                    }
                },
                "refs": {}
            }
        };*/
        let data = [];
        let fields = interfaceData.fields;

        for (let fieldName in fields) {
            let field = fields[fieldName];
            let id = uuid.v4();
            let record = {
                "ID": id,
                "title": field.title || fieldName,
                "field": fieldName,
                "link": field.link || fieldName,
                "parentID": parentID,
                "isGroup": field.type === 'link'
            };
            data.push(record);
        }

        return data;
    }
});

router.use(function (err, req, res, next) {
    res.send({
        status: 'error',
        message: err.message
    });
});

module.exports = router;