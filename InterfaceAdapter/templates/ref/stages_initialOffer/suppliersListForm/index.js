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
    let token = clientData.token;
    let objViewClient = clientData.objView;

    let response = new Response({path: path});

    let panels = response.buildPopupCarcass({
        path: path,
        header: 'Поставщики',
        panelsCount: 1
    });
    let panelMain = panels.main;

    let records = await getData();
    //let preparedData = await prepareData(data);
    let columns = makeColumns();

    let grid = new Grid({
        path: path,
        id: 'suppliersListForm',
        recordsData: records,
        columnsData: columns,
        properties: {},
        buttons: [
            {
                "type": "toolbarItem",
                "id": "getQuotationsBySupplierForm",
                "events": {
                    "onClick": "getQuotationsBySupplierForm"
                },
                "properties": {
                    "caption": "Показать котировки",
                    "icon": "fa fa-list",
                    "more": false,
                    "needSelected": true,
                    "needOnceSelected": true
                },
                "rights": []
            }
        ],
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

        let recordsWithUniqueSup = _.cloneDeep(serverData.records);
        let uniqueSupID = {};
        parsedRecords.forEach((rec) => {
            let recid = rec.fields.ID;
            let supID = rec.fields.supplier.fields.ID;
            if (!uniqueSupID[supID]) {
                uniqueSupID[supID] = 1;
            } else {
                delete recordsWithUniqueSup[recid];
            }
        });

        return recordsWithUniqueSup;
    }

    async function prepareData(serverData) {

        let columns = makeColumns();
        let records = makeRecords(serverData);

        return {
            columns: columns,
            records: records,
            uniqueIDs: uniqueIDs
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
            "supplier": {
                "type": "link",
                "link": "supplier",
                "title": "Поставщик"
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