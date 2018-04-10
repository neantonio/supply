let builder = require('../../../../../../builder');
let dataRouter = require('../../../../../../routers/dataRouter');
import {utils} from '../../../../../../utils';
//import {StandartListForm} from '../../../../helper';
//import {getConfigParam} from '../../../configs/listForm';

let Response = builder.Response;
let Layout = builder.Layout;
let Panel = builder.Panel;
let Grid = builder.Grid;
let Tabs = builder.Tabs;
let Tab = builder.Tab;
let Map = builder.Map;

async function handler(clientData) {

    let path = clientData.path;
    let token = clientData.token;
    let objViewClient = clientData.objView;
    let object = utils.getObjectName(path);
    let filterID = clientData.data.headIDForFiltersAction;

    let response = new Response({path: path});

    let panels = response.buildLayoutCarcass({
        path: path
    });
    let panel = panels.main;


    // получим все объекты и все действия над ними
    let objectsAndActions = await getObjectActions();
    // получим дейсвия, которые определены для текущего фильтра
    let existActions = await getExistFilters();
    // проставим id существующих записей во всех действиях
    let mergedActions = mergeActions(objectsAndActions, existActions);
    // образуем колонки и записи, по которым будем строить таблицу на клиенте
    let colsAndRecs = getColsAndRecs(mergedActions);

    let crossGrid = {
        id: 'crossGrid',
        path: path,
        type: 'crossGrid',
        properties: {},
        elements: [],
        columns: colsAndRecs.columns,
        records: colsAndRecs.records,
        headID: filterID,
        events: {}
    };

    panel.elements.push(crossGrid);


    response.extendWithCode();
    return response;

    async function getObjectActions() {

        let options = {
            object: 'objects_actions',
            objViewClient: objViewClient,
            token: token,
            fields: [
                'objectID.description'
            ]
        };

        //let {object, objViewClient, method = 'get', filter: filterParams, fields, relation = {}, pagination = {}, orderBy = [], token} = options;
        let serverData;
        try {
            serverData = await dataRouter.getServerData(options);
            console.log('');
        } catch (err) {
            throw(err);
        }

        let objectActions = {};

        let records = serverData.records;
        for (let recID in records) {
            let fields = records[recID].fields;
            let objDescription = fields.objectID.description;
            let actionID = fields.ID;
            let actionDescr = fields.description;
            if (!objectActions[objDescription]) {
                objectActions[objDescription] = {};
            }

            objectActions[objDescription][actionDescr] = {
                actionID: actionID
            };
        }

        return objectActions;

    }

    async function getExistFilters() {

        let objectActions = {};

        let filter = {
            comparisons: {
                filterID: {
                    left: {
                        type: 'field',
                        value: 'filterID'
                    },
                    right: {
                        type: 'value',
                        value: filterID
                    },
                    sign: 'equal'
                }
            },
            tree: {
                and: ['filterID']
            }
        };

        if (filterID) {
            let options = {
                object: 'filters_actions',
                objViewClient: objViewClient,
                token: token,
                fields: [
                    'actionID.description',
                    'actionID.objectID',
                    'actionID.objectID.description'
                ],
                /*filter: {
                    filterID: {
                        //value: '95621544-a9a4-63b8-6ba9-42797a941177', // adminFilter
                        //value: '65512348-6534-10a1-75a9-b72ba59869b1', // testFilter
                        value: filterID,
                        sign: 'equal'
                    }
                }*/
                queryParams: {
                    filter: filter
                }
            };

            let serverData;
            try {
                serverData = await dataRouter.getServerData(options);
                console.log('');
            } catch (err) {
                throw(err);
            }

            let records = serverData.records;
            for (let recID in records) {
                let fields = records[recID].fields;
                let ID = fields.ID;
                let actionIDField = fields.actionID;
                let actionIDKey = Object.keys(actionIDField)[0];
                let objDescription = actionIDField[actionIDKey].fields.objectID.description;
                let actionDescription = actionIDField[actionIDKey].fields.description;

                if (!objectActions[objDescription]) {
                    objectActions[objDescription] = {};

                }

                objectActions[objDescription][actionDescription] = {
                    recID: ID
                };
            }
        }

        return objectActions;

    }

    function mergeActions(allActions, existActions) {
        for (let objectName in existActions) {
            let actions = existActions[objectName];
            for (let actionName in actions) {
                let actionFilterID = actions[actionName].recID;
                // никаких проверок, в allActions обязательно должны быть такие object и action, иначе это ошибка
                try {
                    allActions[objectName][actionName]['recID'] = actionFilterID;
                } catch (err) {
                    console.log(err.stack);
                }
            }
        }
        return allActions;
    }

    function getColsAndRecs(mergedActions) {
        // объект для хранения всех возможных колонок
        let columns = [
            {
                name: 'object',
                caption: "Объект"
            }
        ];
        let records = [];

        for (let objectName in mergedActions) {
            let actions = mergedActions[objectName];
            let recordData = {
                object: {
                    name: objectName
                }
            };
            for (let actionName in actions) {

                /*if (!columns[actionName]) {
                    columns[actionName] = {caption: actionName};
                }*/
                let exist = false;
                for (let i = 0; i < columns.length; i++) {
                    let col = columns[i];
                    if (col.name === actionName) {
                        exist = true;
                        break;
                    }
                }
                if (!exist) {
                    columns.push({
                        name: actionName,
                        caption: actionName
                    });
                }

                // actionID есть всегда
                let actionID = actions[actionName].actionID;
                // actionFilterID может и не быть
                let actionFilterID = actions[actionName].recID;

                recordData[actionName] = {
                    actionID: actionID
                };
                if (actionFilterID) {
                    recordData[actionName]['recID'] = actionFilterID;
                }
            }
            records.push(recordData);
        }

        return {
            columns: columns,
            records: records
        }

    }

}


module.exports = {
    handler: handler
};