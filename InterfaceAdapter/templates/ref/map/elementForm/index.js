let builder
try {
    builder = require('../../../builder.js');
} catch (e) {
    console.log(e)
}
let Response = builder.Response;
let Layout = builder.Layout;
let Panel = builder.Panel;
let Grid = builder.Grid;
let Popup = builder.Popup;
let Tabs = builder.Tabs;
let Tab = builder.Tab;
let Form = builder.Form;
let Field = builder.Field;
let Button = builder.Button;

function handler(serverData, clientData) {

    let path = clientData.path;
    let fields = serverData.description.fields || {};
    let refs = fields.refs || false;
    // remove refs from fields
    //delete fields.refs;
    let records = serverData.records || [];

    let response = new Response();
    let popupBtns = [
        {
            "type": "button",
            "id": "save",
            "events": {
                "click": "popupSaveClick"
            },
            "properties": {
                "caption": "Сохранить"
            }
        },
        {
            "type": "button",
            "id": "saveandclose",
            "events": {
                "click": "popupSaveClick"
            },
            "properties": {
                "caption": "Сохранить и закрыть",
                "param": "close"
            }
        }];
    let popup = new Popup({
        path: path,
        page: response,
        properties: {
            "width": 800,
            "height": 640
        },
        buttons: popupBtns
    });
    response.appendChild(popup);

    let layout = new Layout({
        path: path,
        page: response
    });
    popup.appendChild(layout);
    let panel = new Panel({
        path: path,
        page: response
    });
    layout.appendChild(panel);

    // если нет табличных частей - то просто делаем форму
    if (!refs) {

        let form = new Form({
            path: path,
            page: response,
            fields: fields,
            record: records
        });
        panel.appendChild(form);

    } else { // если есть табличные части - то делаем вкладки

        let tabs = new Tabs({
            path: path,
            page: response
        });
        panel.appendChild(tabs);

        let tabTitle = serverData.description.title || "Вкладка 1";

        let tab = new Tab({
            path: path,
            page: response,
            properties: {
                "header": tabTitle
            }
        });
        tabs.appendChild(tab);

        let layout = new Layout({
            path: path,
            page: response
        });
        tab.appendChild(layout);

        let panel2 = new Panel({
            path: path,
            page: response
        });
        layout.appendChild(panel2);

        let form = new Form({
            path: path,
            page: response,
            fields: fields,
            record: records
        });
        panel2.appendChild(form);


        let index = 2;
        for (let tbl in refs) {
            let tabTitle = refs[tbl].title || "Вкладка " + index;

            let tab = new Tab({
                path: path + '-refs-' + tbl,
                page: response,
                properties: {
                    "header": tabTitle
                },
                events: {
                    beforeShow: 'beforeShow'
                }
            });
            tabs.appendChild(tab);

            let layout = new Layout({
                path: path + '-refs-' + tbl,
                page: response
            });
            tab.appendChild(layout);

            let panel = new Panel({
                path: path,
                page: response
            });
            layout.appendChild(panel);
            let btnsGrid = [
                {
                    "type": "toolbarItem",
                    "id": "add",
                    "events": {
                        "onClick": "addRecord"
                    }
                    ,
                    "properties": {
                        "caption": "Добавить",
                        "icon": "fa fa-plus",
                        "more": false
                    },
                    "rights": []

                }
                ,
                {
                    "type": "toolbarItem",
                    "id": "edit",
                    "events": {
                        "onClick": "editRecord"
                    }
                    ,
                    "properties": {
                        "caption": "Изменить",
                        "icon": "fa fa-pencil",
                        "more": true,
                        "needOnceSelected": true
                    },
                    "rights": []
                }
                ,
                {
                    "type": "toolbarItem",
                    "id": "el",
                    "events": {
                        "onClick": "delRecord"
                    }
                    ,
                    "properties": {
                        "caption": "Удалить",
                        "icon": "fa fa-times",
                        "more": false,
                        "needSelected": true
                    },
                    "rights": []
                }
            ];
            let grid = new Grid({
                path: path + '-refs-' + tbl,
                id: 'listForm',
                recordsData: records[0].refs[tbl],
                columnsData: refs[tbl].fields,
                page: response,
                buttons: btnsGrid
            })
            panel.appendChild(grid);
            index++;
        }
    }
    // когда вся страница готова, можно посмотреть какие обработчики нам нужно передать
    response.extendWithCode();

    return response;

}


'use strict'
let type = 'elementForm';
let tmpl = {
    "elements": [
        {
            "type": "popup",
            "elements": [
                {
                    "type": "header",
                    "properties": {
                        "caption": ""
                    }
                },
                {
                    "type": "body",
                    "elements": [
                        {
                            "type": "layout",
                            "path": "",
                            "elements": [
                                {
                                    "type": "panel",
                                    "elements": [],
                                    "properties": {
                                        "position": "main",
                                        "width": "50%"
                                    }
                                }
                            ]
                        }
                    ]
                },
                {
                    "type": "footer",
                    "elements": []
                }
            ],
            "properties": {
                "width": 800,
                "height": 640
            }
        }
    ],
    "code": [],
    "content": [],
    "needToCache": true
}

let btns = {
    'gridToolbar': [
        {
            "type": "toolbarItem",
            "id": "refreshGrid",
            "events": {
                "onClick": "refreshGrid"
            }
            ,
            "properties": {
                "caption": "Обновить",
                "icon": "fa fa-refresh",
                "more": false
            },
            "rights": []
        },
        {
            "type": "toolbarItem",
            "id": "add",
            "events": {
                "onClick": "addRecord"
            }
            ,
            "properties": {
                "caption": "Добавить",
                "icon": "fa fa-plus",
                "more": false
            },
            "rights": []

        }
        ,
        {
            "type": "toolbarItem",
            "id": "edit",
            "events": {
                "onClick": "editRecord"
            }
            ,
            "properties": {
                "caption": "Изменить",
                "icon": "fa fa-pencil",
                "more": true,
                "needOnceSelected": true
            },
            "rights": []
        }
        ,
        {
            "type": "toolbarItem",
            "id": "el",
            "events": {
                "onClick": "delRecord"
            }
            ,
            "properties": {
                "caption": "Удалить",
                "icon": "fa fa-times",
                "more": false,
                "needSelected": true
            },
            "rights": []
        }
    ],
    'popupButtons': [
        {
            "type": "button",
            "id": "save",
            "events": {
                "click": "popupSaveClick"
            },
            "properties": {
                "caption": "Сохранить"
            }
        },
        {
            "type": "button",
            "id": "saveandclose",
            "events": {
                "click": "popupSaveClick"
            },
            "properties": {
                "caption": "Сохранить и закрыть",
                "param": "close"
            }
        }
    ]
}

module.exports = {
    handler: handler
}