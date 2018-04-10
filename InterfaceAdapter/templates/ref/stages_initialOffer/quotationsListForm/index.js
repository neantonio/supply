let builder = require('../../../../builder');
let dataRouter = require('../../../../routers/dataRouter');
import {utils} from '../../../../utils';
import {EntityParserUtil} from "../../../../../src/main/util/entityParserUtil";

let uuid = require('uuid');
import {getConfigParam} from '../../../configs/listForm';

let Response = builder.Response;
let CrossGrid = builder.CrossGridQuotationList;

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
        header: 'Котировочный лист',
        panelsCount: 1,
        popupBtns: [
            {
                "type": "button",
                "id": "saveQuotationList",
                "events": {
                    "click": "saveQuotationList"
                },
                "properties": {
                    "caption": "Сохранить",
                    "style": "w2ui-btn"
                }
            },
            {
                "type": "button",
                "id": "close",
                "events": {
                    "click": "popupClose"
                },
                "properties": {
                    "caption": "Закрыть",
                    "style": "w2ui-btn"
                }
            }
        ]
    });
    let panelMain = panels.main;
    let commonInterface = await dataRouter.getInterface(objViewClient, null, token);
    let repeatedColumns = ['price', 'deliveryTime', 'quantity'];
    let objInterface = utils.getObjectInterface(commonInterface, 'stages_initialOffer_offers');

    let data = await getData();
    let preparedData = await prepareData(data);

    let crossGrid = new CrossGrid({
        path: path,
        id: 'quotationListForm',
        recordsData: preparedData.records,
        columnsData: preparedData.columns,
        colGroupsNames: preparedData.uniqueIDs,
        properties: {
            PK: 'mainID',
            groupColName: 'supplier',
            colsInGroup: 3,
            editableFields: repeatedColumns
        },
        page: response
    });

    panelMain.appendChild(crossGrid);
    response.extendWithCode();

    return response;

    async function getData() {

        let data = await getInOneQuery();

        return data;

        async function getInOneQuery() {
            let requestOptions = {
                object: object,
                objViewClient: objViewClient,
                //filter: filter,
                queryParams: queryParams,
                token: token,
                fields: [
                    'ref.stages_initialOffer_offers.supplier',
                    'ref.stages_initialOffer_offers.supplier.description',
                    'productID.description',
                    'ref.stages_initialOffer_offers.price',
                    'ref.stages_initialOffer_offers.deliveryTime',
                    'ref.stages_initialOffer_offers.quantity'
                ]
            };

            let serverData;
            try {
                serverData = await dataRouter.getServerData(requestOptions);
            } catch (err) {
                console.log('Ошибка при получении данных: ' + err.stack);
                throw(err);
            }

            let parsedRecords = EntityParserUtil.parse(serverData);
            return parsedRecords;
        }

    }

    async function prepareData(serverData) {
        // получить всех уникальных поставщиков
        let uniqueIDs = getUniqueGroupColIDs(serverData);
        // сделать из колонки supplier несколько колонок по количеству уникальных поставщиков с постфиксом из УИДа поставщика

        let columns = makeColumns(uniqueIDs);
        let records = makeRecords(serverData);

        return {
            columns: columns,
            records: records,
            uniqueIDs: uniqueIDs
        }
    }

    function getUniqueGroupColIDs(records) {
        let uniqueIDs = {};
        records.forEach((rec) => {
            let supRef = rec.refs.stages_initialOffer_offers ? rec.refs.stages_initialOffer_offers : null;
            if (supRef) {
                supRef.forEach((refRec) => {
                    let supID = refRec.fields.supplier ? refRec.fields.supplier.fields.ID : null;
                    let supDescription = refRec.fields.supplier ? refRec.fields.supplier.fields.description : null;
                    if (supID) {
                        uniqueIDs[supID] = supDescription;
                    }
                });
            }
        });
        return uniqueIDs;
    }

    function makeColumns(uniqueGroupColIDs) {
        // задаем статикой
        let columns = {
            /*            "ID": {
                            "type": [
                                "uuid",
                                "string",
                                "object"
                            ],
                            "isPrimary": true,
                            "readonly": true
                        },*/
            "mainID": {
                "type": [
                    "uuid",
                    "string",
                    "object"
                ]
            },
            "childID": {
                "type": "map"
            },
            "description": {
                "type": "text",
                "title": "Позиция"
            }
        };

        for (let id in uniqueGroupColIDs) {
            repeatedColumns.forEach((colName) => {
                if (objInterface.fields[colName]) {
                    let newColName = `${colName}-${id}`;
                    columns[newColName] = {
                        "type": objInterface.fields[colName].type,
                        "title": objInterface.fields[colName].title
                    }
                }
            });

        }

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
        let records = serverData;

        records.forEach((rec) => {
            let mainID = rec.fields.ID;
            let childID = {};
            let description = rec.fields.productID.fields.description;
            let groupedCols = {};
            let refRecords = rec.refs.stages_initialOffer_offers ? rec.refs.stages_initialOffer_offers : null;

            if (refRecords) {
                refRecords.forEach((refRec) => {
                    let supID = refRec.fields.supplier.fields.ID;
                    //let supDescription = refRec.fields.supplier.fields.description;
                    //supCols[supID] = supDescription;
                    repeatedColumns.forEach((colName) => {
                        groupedCols[`${colName}-${supID}`] = refRec.fields[colName] || 0;
                    });
                    childID[supID] = refRec.fields.ID;
                });
                addRecordToData(mainID, childID, description, groupedCols);
            }
        });

        function addRecordToData(mainID, childID, description, groupedCols) {

            data[mainID] = {
                fields: {
                    mainID: mainID,
                    childID: childID,
                    description: description
                }
            };

            for (let colName in groupedCols) {
                let value = groupedCols[colName];
                data[mainID]['fields'][colName] = value;
            }
        }

        return data;
    }

}

module.exports = {
    handler: handler
};