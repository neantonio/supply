let builder = require('../../../../builder');
let dataRouter = require('../../../../routers/dataRouter');
import {utils} from '../../../../utils';
import {EntityParserUtil} from "../../../../../src/main/util/entityParserUtil";
import {_} from 'lodash';

let uuid = require('uuid');
import {getConfigParam} from '../../../configs/listForm';

let Response = builder.Response;
let Grid = builder.Grid;

async function handler(clientData) {

    let path = clientData.path;
    let object = utils.getObjectName(path);
    let type = clientData.data.type;
    //let filter = clientData.data.filter;
    let queryParams = clientData.data.queryParams;
    let supDescription = clientData.data.supDescription || "";
    let token = clientData.token;
    let objViewClient = clientData.objView;

    let response = new Response({path: path});

    let panels = response.buildPopupCarcass({
        path: path,
        header: `Котировки по ${supDescription}`,
        panelsCount: 1
    });
    let panelMain = panels.main;

    let commonInterface = await dataRouter.getInterface(objViewClient, null, token);
    let repeatedColumns = ['price', 'deliveryTime', 'quantity'];
    let objInterface = utils.getObjectInterface(commonInterface, 'stages_initialOffer_offers');

    let records = await getData();
    //let preparedData = await prepareData(data);
    let columns = makeColumns();

    let grid = new Grid({
        path: 'ref-stages_initialOffer_offers',
        id: 'quotationsBySupplierForm',
        recordsData: records,
        columnsData: columns,
        properties: {
            editable: true
        },
        page: response
    });

    panelMain.appendChild(grid);
    response.extendWithCode();

    return response;

    async function getData() {
        let requestOptions = {
            object: 'stages_initialOffer_offers',
            objViewClient: objViewClient,
            //filter: filter,
            queryParams: queryParams,
            token: token,
            fields: [
                'initialOfferID.productID',
                'initialOfferID.productID.description',
                'supplier.description'
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

        // вытащим номенклатуру наверх
        parsedRecords.forEach((rec) => {
            let recid = rec.fields.ID;
            let product = rec.fields.initialOfferID.productID;
            serverData.records[recid].fields.product = product;
        });

        return serverData.records;
    }

    async function prepareData(serverData) {

        let columns = makeColumns(uniqueIDs);
        let records = makeRecords(serverData);

        return {
            columns: columns,
            records: records
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
            "product": {
                "type": "link",
                "link": "product",
                "title": "Позиция"
            }
        };

        repeatedColumns.forEach((colName) => {
            if (objInterface.fields[colName]) {
                let newColName = `${colName}`;
                columns[newColName] = {
                    "type": objInterface.fields[colName].type,
                    "title": objInterface.fields[colName].title
                }
            }
        });

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