let config = {
    default: {
        dropListsToLoad: ['recipient'],
        popupBtns: [
            {
                "type": "button",
                "id": "save",
                "events": {
                    "click": "popupSaveClick"
                },
                "properties": {
                    "caption": "Сохранить",
                    "style": "w2ui-btn"
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
                    "param": "close",
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
    },
    query: {
        refsLoadAfter: ['position'],
        customizator: changeHeader,
        filterFields: {
            // поля stock и subdivision зависят от значения поля organization (могут зависеть от нескольких полей)
            stock: [
                {
                    filterBy: 'organization', // фильтровать по полю organization объекта query
                    alias: 'organizationID' // alias для поля organization в объекте stock
                }
            ],
            subdivision: [
                {
                    filterBy: 'organization',
                    alias: 'organizationID' // alias для поля organization в объекте subdivision
                }
            ]
        },
        popupBtns: [
            {
                "type": "button",
                "id": "save",
                "events": {
                    "click": "popupSaveClick"
                },
                "properties": {
                    "caption": "Сохранить",
                    "style": "w2ui-btn"
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
                    "param": "close",
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
    },
    position: {
        fields: {
            productID: {
                // кнопки относющиеся к конкретному филду
                buttons: [
                    {
                        type: "button",
                        properties: {
                            icon: "fa fa-ellipsis-h fa-lg",
                            style: "btn btn-success"
                        },
                        id: 'more',
                        events: {
                            click: "showLink"
                        }
                    }
                ],
                events: {
                    "changeValue": "onProductChangeValue"
                }
            },
            makerID: {
                // кнопки относющиеся к конкретному филду
                buttons: [
                    {
                        type: "button",
                        properties: {
                            icon: "fa fa-ellipsis-h fa-lg",
                            style: "btn btn-success"
                        },
                        id: 'more',
                        events: {
                            click: "showLink"
                        }
                    }
                ],
                events: {
                    "changeValue": "onProductChangeValue"
                }
            }
        }
    },
    filters: {
        popupBtns: [
            {
                "type": "button",
                "id": "save",
                "events": {
                    "click": "popupSaveClick"
                },
                "properties": {
                    "caption": "Сохранить",
                    "style": "w2ui-btn"
                }
            },
            {
                "type": "button",
                "id": "saveandclose",
                "events": {
                    "click": "onRoleFilterSaveClick"
                },
                "properties": {
                    "caption": "Сохранить и закрыть",
                    "param": "close",
                    "style": "w2ui-btn"
                }
            },
            {
                "type": "button",
                "id": "close",
                "events": {
                    "click": "onRoleFilterClose"
                },
                "properties": {
                    "caption": "Закрыть",
                    "style": "w2ui-btn"
                }
            }
        ]
    }
};

function changeHeader(response) {
    let records = {};
    let popupBtns = [];
    let header = '';
    for (let i in response.content) {
        if (response.content[i].forId.indexOf('ref-query-form') >= 0) {
            records = response.content[i].records;
        }
    }
    for (let i in response.elements[0].elements) {
        if (response.elements[0].elements[i].type === 'header') {
            header = response.elements[0].elements[i];
        }
    }
    for (let i in response.elements[0].elements) {
        if (response.elements[0].elements[i].type === 'footer') {
            popupBtns = response.elements[0].elements[i].elements;
        }
    }
    if (records.length === 1) {
        // if (!records[0].date) {
        //     header.properties.caption = 'Какого хера заявка без даты!!!'
        // }
    } else {
        // Скроем кнопку активировать
        for (let i = 0; i < popupBtns.length; i++) {
            let btn = popupBtns[i];
            if (btn.id === 'elementForm-activate') {
                btn.properties.hidden = true;
                break;
            }
        }

    }

    return response;
}

/**
 * Функция для получения параметра из конфига
 * @param object - объект
 * @param param - параметр
 * @returns {*|string}
 */
export function getConfigParam(object, param) {
    if (config[object] === undefined) {
        return config['default'][param] || ''
    } else {
        if (config[object][param] === undefined) {
            return config['default'][param] || ''
        } else {
            return config[object][param] || ''
        }
    }
}