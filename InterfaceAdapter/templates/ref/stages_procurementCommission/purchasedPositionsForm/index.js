let builder = require('../../../../builder');
let dataRouter = require('../../../../routers/dataRouter');
import {utils} from '../../../../utils';
import {EntityParserUtil} from "../../../../../src/main/util/entityParserUtil";
import {StandartListForm} from '../../../../helper';
import {getConfigParam} from '../../../configs/listForm';

let Response = builder.Response;
let Grid = builder.Grid;

async function handler(clientData) {

    let path = clientData.path;
    let object = utils.getObjectName(path);
    let type = clientData.data.type;
    //let filter = clientData.data.filter;
    let queryParams = clientData.data.queryParams;
    let token = clientData.token;
    let objViewClient = clientData.objView;

    let response = new Response({path: path});

    let panels = response.buildPopupCarcass({
        path: path,
        header: 'Купленные позиции по смете',
        panelsCount: 1
    });
    let panelMain = panels.main;

    let data = await getData();

    if (data) {
        let grid = new Grid({
            path: path,
            id: 'purchased',
            properties: {
                groupBy: ['query']
            },
            recordsData: data.records,
            columnsData: data.columns,
            summaryData: data.summary,
            page: response
        });

        panelMain.appendChild(grid);
        response.extendWithCode();
    }

    return response;

    async function getData() {
        let outlayData = await getOutlayData();
        if (!outlayData) return null;
        let positionsData = await getPositionsData();
        let preparedData = await prepareData(positionsData);
        preparedData.summary.push({
            recid: 'outlaySummary',
            query: 'Всего по смете:',
            quantity: outlayData.quantity,
            price: outlayData.price
        });

        return preparedData;

        async function getOutlayData() {
            let requestOptions = {
                object: object,
                objViewClient: 'supply',
                //filter: filter,
                queryParams: queryParams,
                token: token,
                fields: [
                    'positionID.outlayDocument_positionID.quantity',
                    'positionID.outlayDocument_positionID.price'
                ]
            };

            let serverData;
            try {
                serverData = await dataRouter.getServerData(requestOptions);
            } catch (err) {
                console.log('Ошибка при получении данных о позициях счета: ' + err.stack);
                throw(err);
            }

            let parsedRecords = EntityParserUtil.parse(serverData);

            let recData = parsedRecords[0].fields;
            let outlayData = recData.positionID.fields.outlayDocument_positionID;
            let result = null;

            // у позиции может не быть ссылки на позицию из сметы
            if (outlayData) {
                result = {
                    outlayDocument_positionID: outlayData.fields.ID,
                    quantity: outlayData.fields.quantity,
                    price: outlayData.fields.price
                };
            }

            return result;
        }

        async function getPositionsData() {

            /*let filter = {
                outlayDocument_positionID: {
                    value: outlayData.outlayDocument_positionID
                },
                price: {
                    value: 0,
                    sign: 'greater'
                }
            };*/

            let filter = {
                comparisons: {
                    outlayDocument_positionID: {
                        left: {
                            type: 'field',
                            value: 'outlayDocument_positionID'
                        },
                        right: {
                            type: 'value',
                            value: outlayData.outlayDocument_positionID
                        },
                        sign: 'equal'
                    },
                    price: {
                        left: {
                            type: 'field',
                            value: 'price'
                        },
                        right: {
                            type: 'value',
                            value: 0
                        },
                        sign: 'greater'
                    }
                },
                tree: {
                    and: ['outlayDocument_positionID', 'price']
                }
            };

            let requestOptions = {
                object: 'query_position',
                objViewClient: 'supply',
                //filter: filter,
                queryParams: {
                    filter: filter
                },
                token: token,
                fields: [
                    "queryID.description"
                ]
            };

            let serverData;
            try {
                serverData = await dataRouter.getServerData(requestOptions);
            } catch (err) {
                console.log('Ошибка при получении данных о позициях счета: ' + err.stack);
                throw(err);
            }

            return serverData;
        }

    }

    async function prepareData(serverData) {

        let columns = makeColumns();
        let data = makeRecords(serverData);

        return {
            columns: columns,
            records: data.records,
            summary: data.summary
        }

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
                "type": "float",
                "title": "Количество"
            },
            "price": {
                "type": "float",
                "title": "Стоимость"
            }
        };

        return columns;
    }

    function makeRecords(serverData) {
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
        let data = {};
        let resultRecs = {};
        let summaryRecs = {
            recid: 'positionsSummary',
            query: 'Всего по позициям:',
            quantity: 0,
            price: 0
        };
        let records = serverData.records;

        // цикл по позициям
        for (let posID in records) {
            // формируем укороченную запись(только колонки ID, query, position)
            let shortRec = {fields: {}};
            let rec = records[posID];
            let recFields = rec.fields;

            // формируем данные для колонки position
            let posDescr = recFields.description || "Позиция без названия";
            let position = {};
            position[posID] = {
                fields: {
                    ID: posID,
                    description: posDescr
                }
            };

            // формируем данные для колонки query
            let queryID = recFields.queryID.ID;
            let queryDescr = recFields.queryID.description || "Заявка без названия";
            let query = {};
            query[queryID] = {
                fields: {
                    ID: queryID,
                    description: queryDescr
                }
            };

            // формируем данные для колонки количество
            let quantity = recFields.quantity || 0;
            summaryRecs.quantity += quantity;

            // формируем данные для колонки цена
            let price = recFields.price || 0;
            summaryRecs.price += price;

            shortRec.fields = {
                ID: posID,
                query: query,
                position: position,
                quantity: quantity,
                price: price
            };

            resultRecs[posID] = shortRec;

        }

        data.records = resultRecs;
        data.summary = [summaryRecs];

        return data;
    }

}

module.exports = {
    handler: handler
};