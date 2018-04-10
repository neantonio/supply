let builder = require('../../../../builder');
let dataRouter = require('../../../../routers/dataRouter');
import {utils} from '../../../../utils';
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
        header : 'Информация по счету',
        panelsCount: 1
    });
    let panelMain = panels.main;

    let serverData = await getData();
    let preparedData = await prepareData(serverData);


    let grid = new Grid({
        path: path,
        id: 'positionInfoForm',
        properties: {
            groupBy: ['query']
        },
        recordsData: preparedData.records,
        columnsData: preparedData.columns,
        page: response
    });

    panelMain.appendChild(grid);

    response.extendWithCode();
    return response;

    async function getData() {

        let requestOptions = {
            object : 'query_position',
            objViewClient : 'supply',
            //filter : filter,
            queryParams: queryParams,
            token : token,
            fields : ['queryID.description',
            'productID.description']
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

    async function prepareData(serverData){

        let columns = makeColumns();
        let records = makeRecords(serverData);

        return {
            columns : columns,
            records : records
        }

    }

    function makeColumns(){

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
            }
        };

        return columns;
    }

    function makeRecords(serverData){
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

        let resultRecs = {};
        let records = serverData.records;

        // цикл по позициям
        for (let posID in records) {
            // формируем укороченную запись(только колонки ID, query, position)
            let shortRec = {fields : {}};
            let rec = records[posID];
            let recFields = rec.fields;

            // формируем данные для колонки position
            let posDescr = recFields.description;
            let position = {};
            position[posID] = {
                fields : {
                    ID : posID,
                    description : posDescr
                }
            };

            // формируем данные для колонки query
            let queryID = recFields.queryID.ID;
            let query = {};
            query[queryID] = {
                fields : recFields.queryID
            };

            shortRec.fields = {
                ID : posID,
                query : query,
                position : position
            };

            resultRecs[posID] = shortRec;

        }

        return resultRecs;
    }

}

module.exports = {
    handler: handler
};