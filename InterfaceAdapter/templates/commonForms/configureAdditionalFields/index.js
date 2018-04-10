let builder = require('../../../builder');
let Grid = builder.Grid;
let dataRouter = require('../../../routers/dataRouter');
import {utils} from '../../../utils';
import * as uuid from "uuid";

let Response = builder.Response;

async function handler(clientData) {

    let path = 'additionalFieldsForm';
    let objViewClient = clientData.objView;
    let object = clientData.data.object;
    let token = clientData.token;

    let response = new Response();

    let panels = response.buildPopupCarcass({
        path: path,
        header: 'Добавление полей',
        popupBtns: [
            {
                "type": "button",
                "id": "addFields",
                "events": {
                    "click": "addFields"
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

    let commonInterface = await dataRouter.getInterface(objViewClient, null, token);
    let objInterface = utils.getObjectInterface(commonInterface, object);

    let grid = new Grid({
        path: path,
        page: response,
        id: 'id',
        recordsData: makeRecords(objInterface),
        columnsData: makeColumns(),
        hiddenColumns: ['field','link','parentID','isGroup'],
        properties: {
            editable: false,
            hierachy: true,
            showSelectColumn: true,
            multiselect: true,
            data: {
                object: object
            }
        }
    });

    panels.main.appendChild(grid);

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
        let data = {};
        let fields = interfaceData.fields;

        // проходимся по всем полям, оставляя только поля ссылочных типов
        for (let fieldName in fields) {
            let field = fields[fieldName];
            if (field.type !== 'link') {
                continue;
            }
            let id = uuid.v4();
            data[id] = {
                fields: {
                    "ID": id,
                    "title": field.title || fieldName,
                    "field" : fieldName,
                    "link": field.link,
                    "parentID": null,
                    "isGroup": true
                }
            };
            // создаем по одной вложенной записе
            /*let innerID = uuid.v4();
            data[innerID] = {
                fields: {
                    "ID": innerID,
                    "fieldName": 'Вложенное поле',
                    "parentID": id,
                    "isGroup": false
                }
            };*/
        }

        return data;
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
            "title": {
                "type": ["string"],
                "title": "Поле"
            },
            "field": {
                "type": ["string"],
                "title": "field"
            },
            "link": {
                "type": ["string"],
                "title": "link"
            },
            "parentID": {
                "type": ["uuid"],
                "title": "parentID"
            },
            "isGroup": {
                "type": ["boolean"],
                "title": "isGroup"
            }
        };
        return columns;
    }

    response.extendWithCode();
    return response;

}

module.exports = {
    handler: handler
};