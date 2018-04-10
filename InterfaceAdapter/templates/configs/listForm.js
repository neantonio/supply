let dataRouter = require('../../routers/dataRouter');
let cloneDeep = require('lodash.clonedeep');
import {ButtonGetter} from "../../buttonGetter";
import {utils} from '../../utils.js';
import {_} from 'lodash';

let config = {
    common: {
        mainFK: 'description'
    },
    query: {
        pagination: false,
        limit: 50,
        orderBy: [
            {field: 'date', sort: 'desc'}
        ],
        fkInfo: {
            organization: {
                additional: {
                    'organization.INN': 'ИНН',
                    'organization.KPP': 'КПП'
                }
            },
            subdivision: {
                additional: {
                    'subdivision.parentID': 'Основное подразделение'
                }
            }
        },
        hiddenColumns: ['workOut', 'outlayDocumentID', 'urgency'],
        columnsOrder: ['organization', 'description'],
        /*groupBy: ['date'],
         showGroupCol: 'description',*/
        multiselect: true,
        showSelectColumn: true,
        dataRenderer: dataRender,
        formButtons: {
            copyToOutlay: {
                "type": "toolbarItem",
                "id": "getCopyToOutlayForm",
                "events": {
                    "onClick": "getCopyToOutlayForm"
                },
                "properties": {
                    "caption": "Копировать в смету",
                    "more": true,
                    "needSelected": true,
                    "needOnceSelected": true
                },
                "rights": []
            },
            configureAdditionalFields: {
                "type": "toolbarItem",
                "id": "configureAdditionalFields",
                "events": {
                    "onClick": "getFormForAdditionalFields"
                },
                "properties": {
                    "caption": "Добавить поля",
                    "icon": "fa fa-plus",
                    "more": true,
                    "needSelected": false,
                    "needOnceSelected": false
                },
                "rights": []
            }
        }
    },
    query_position: {
        multiselect: true,
        fkInfo: {
            productID: {
                additional: {
                    'productID.unitID': 'Ед. изм.'
                }
            }
        },
        fieldsEditability: {
            quantity: true,
            accepted: true,
            price: true,
            productID: true
        },
        formButtons: {
            showHistory:
                {
                    "type": "toolbarItem",
                    "id": "showHistory",
                    "events": {
                        "onClick": "showHistory"
                    },
                    "properties": {
                        "caption": "Показать историю",
                        "icon": "fa fa-list",
                        "more": true,
                        "needSelected": true,
                        "needOnceSelected": false
                    },
                    "rights": []
                }
        }
    },
    outlayDocument_position: {
        fkInfo: {
            productID: {
                additional: {
                    'productID.unitID': 'Ед. изм.'
                }
            }
        }
    },
    product: {
        hierachy: true
        // groupBy: ['parentID']
    },
    stages_nomControl: {
        fkInfo: {
            nomenclatureID: {
                additional: {
                    'nomenclatureID.unitID': 'Ед. изм.'
                }
            },
            positionID: {
                additional: {
                    'positionID.queryID.organization': 'Организация',
                    'positionID.queryID.urgency': 'Срочность'
                }
            }
        },
        groupBy: ['positionID*queryID*urgency', 'positionID*queryID*organization'],
        columnsOrder: ['positionID*queryID*urgency', 'positionID*queryID*organization'],
        formButtons: {
            decline: {
                "type": "toolbarItem",
                "id": "decline",
                "events": {
                    "onClick": "decline"
                },
                "properties": {
                    "caption": "Отказать",
                    "icon": "fa fa-ban",
                    "more": true,
                    "needSelected": true,
                    "needOnceSelected": false
                },
                "rights": []
            }
        }
    },
    stages_supSelection: {
        fkInfo: {
            nomenclatureID: {
                additional: {
                    'nomenclatureID.unitID': 'Ед. изм.'
                }
            },
            positionID: {
                additional: {
                    'positionID.queryID.organization': 'Организация',
                    'positionID.queryID.urgency': 'Срочность'
                }
            }
        },
        groupBy: ['positionID*queryID*urgency', 'positionID*queryID*organization'],
        columnsOrder: ['positionID*queryID*urgency', 'positionID*queryID*organization'],
        formButtons: {
            getSupplierSelectionForm: {
                "type": "toolbarItem",
                "id": "getSupplierSelectionForm",
                "events": {
                    "onClick": "getSupplierSelectionForm"
                },
                "properties": {
                    "caption": "Подобрать поставщиков",
                    "icon": "fa fa-truck",
                    "more": true,
                    "needSelected": true,
                    "needOnceSelected": false
                },
                "rights": []
            },
            getQuotationsListForm: {
                "type": "toolbarItem",
                "id": "getQuotationsListForm",
                "events": {
                    "onClick": "getQuotationsListForm"
                },
                "properties": {
                    "caption": "Котировочный лист",
                    "icon": "fa fa-list",
                    "more": true,
                    "needSelected": true,
                    "needOnceSelected": false
                },
                "rights": []
            },
            getSuppliersListForm: {
                "type": "toolbarItem",
                "id": "getSuppliersListForm",
                "events": {
                    "onClick": "getSuppliersListForm"
                },
                "properties": {
                    "caption": "Список поставщиков",
                    "icon": "fa fa-users",
                    "more": true,
                    "needSelected": false,
                    "needOnceSelected": false
                },
                "rights": []
            },
            decline: {
                "type": "toolbarItem",
                "id": "decline",
                "events": {
                    "onClick": "decline"
                },
                "properties": {
                    "caption": "Отказать",
                    "icon": "fa fa-ban",
                    "more": true,
                    "needSelected": true,
                    "needOnceSelected": false
                },
                "rights": []
            }
        }
    },
    stages_initialOffer: {
        formButtons: {
            getSupplierSelectionForm: {
                "type": "toolbarItem",
                "id": "getSupplierSelectionForm",
                "events": {
                    "onClick": "getSupplierSelectionForm"
                },
                "properties": {
                    "caption": "Подобрать поставщиков",
                    "icon": "fa fa-truck",
                    "more": true,
                    "needSelected": true,
                    "needOnceSelected": false
                },
                "rights": []
            },
            getQuotationsListForm: {
                "type": "toolbarItem",
                "id": "getQuotationsListForm",
                "events": {
                    "onClick": "getQuotationsListForm"
                },
                "properties": {
                    "caption": "Котировочный лист",
                    "icon": "fa fa-list",
                    "more": true,
                    "needSelected": true,
                    "needOnceSelected": false
                },
                "rights": []
            },
            getSuppliersListForm: {
                "type": "toolbarItem",
                "id": "getSuppliersListForm",
                "events": {
                    "onClick": "getSuppliersListForm"
                },
                "properties": {
                    "caption": "Список поставщиков",
                    "icon": "fa fa-users",
                    "more": true,
                    "needSelected": false,
                    "needOnceSelected": false
                },
                "rights": []
            },
            decline: {
                "type": "toolbarItem",
                "id": "decline",
                "events": {
                    "onClick": "decline"
                },
                "properties": {
                    "caption": "Отказать",
                    "icon": "fa fa-ban",
                    "more": true,
                    "needSelected": true,
                    "needOnceSelected": false
                },
                "rights": []
            }
        }
    },
    stages_procurementCommission: {
        fkInfo: {
            nomenclatureID: {
                additional: {
                    'nomenclatureID.unitID': 'Ед. изм.'
                }
            }
        },
        /*groupBy: ['nomenclatureID']*/
        buttons: [
            {
                "type": "toolbarItem",
                "id": "refreshGrid",
                "events": {
                    "onClick": "refreshGrid"
                },
                "properties": {
                    "caption": "Обновить",
                    "icon": "fa fa-refresh",
                    "more": false
                },
                "rights": []
            },
            {
                "type": "toolbarItem",
                "id": "insert",
                "events": {
                    "onClick": "addRecord"
                },
                "properties": {
                    "caption": "Добавить",
                    "icon": "fa fa-plus",
                    "more": false
                },
                "rights": []

            },
            {
                "type": "toolbarItem",
                "id": "update",
                "events": {
                    "onClick": "editRecord"
                },
                "properties": {
                    "caption": "Изменить",
                    "icon": "fa fa-pencil",
                    "more": false,
                    "needOnceSelected": true
                },
                "rights": []
            },
            {
                "type": "toolbarItem",
                "id": "delete",
                "events": {
                    "onClick": "delRecord"
                },
                "properties": {
                    "caption": "Удалить",
                    "icon": "fa fa-times",
                    "more": true,
                    "needSelected": true,
                    "needOnceSelected": false
                },
                "rights": []
            }
        ],
        formButtons: {
            groupWithStagesStat: {
                "type": "toolbarItem",
                "id": "groupBy",
                "events": {
                    "onClick": "groupWithStagesStat"
                },
                "properties": {
                    "caption": "Сгруппировать по заявкам",
                    "more": true,
                    "needSelected": false,
                    "needOnceSelected": false
                },
                "rights": []
            },
            ungroupStagesStat: {
                "type": "toolbarItem",
                "id": "ungroupStagesStat",
                "events": {
                    "onClick": "ungroupStagesStat"
                },
                "properties": {
                    "caption": "Сгруппировать по умолчанию",
                    "more": true,
                    "needSelected": false,
                    "needOnceSelected": false
                },
                "rights": []
            },
            showPurchasedPositions: {
                "type": "toolbarItem",
                "id": "showPurchasedPositions",
                "events": {
                    "onClick": "showPurchasedPositions"
                },
                "properties": {
                    "caption": "Показать позиции по смете",
                    "icon": "fa fa-list",
                    "more": true,
                    "needSelected": true,
                    "needOnceSelected": true
                },
                "rights": []
            },
            backToInitialOffer: {
                "type": "toolbarItem",
                "id": "backToInitialOffer",
                "events": {
                    "onClick": "backToInitialOffer"
                },
                "properties": {
                    "caption": "Откатить на предыдущую стадию",
                    "icon": "fa fa-step-backward",
                    "more": true,
                    "needSelected": true,
                    "needOnceSelected": false
                },
                "rights": []
            },
            decline: {
                "type": "toolbarItem",
                "id": "decline",
                "events": {
                    "onClick": "decline"
                },
                "properties": {
                    "caption": "Отказать",
                    "icon": "fa fa-ban",
                    "more": true,
                    "needSelected": true,
                    "needOnceSelected": false
                },
                "rights": []
            },
            configureAdditionalFields: {
                "type": "toolbarItem",
                "id": "configureAdditionalFields",
                "events": {
                    "onClick": "getFormForAdditionalFields"
                },
                "properties": {
                    "caption": "Добавить поля",
                    "icon": "fa fa-plus",
                    "more": true,
                    "needSelected": false,
                    "needOnceSelected": false
                },
                "rights": []
            }
        }
    },
    stages_procurementCommission_votes: {
        fieldsEditability: {
            chVote: false
        },
        additionalButtons: {
            chVote: {
                "type": "toolbarItem",
                "id": "chVote",
                "events": {
                    "onClick": "chVote"
                },
                "properties": {
                    "caption": "Голос председателя ЗК",
                    "more": false,
                    "needSelected": true,
                    "needOnceSelected": false
                },
                "rights": []
            }
        }
    },
    stages_billBinding: {
        fkInfo: {
            positionID: {
                additional: {
                    'positionID.queryID.organization': 'Организация',
                    'positionID.queryID.subdivision': 'Подразделение'
                }
            },
            productID: {
                additional: {
                    'productID.unitID': 'Ед. изм.'
                }
            }
        },
        buttons: [
            {
                "type": "toolbarItem",
                "id": "refreshGrid",
                "events": {
                    "onClick": "refreshGrid"
                },
                "properties": {
                    "caption": "Обновить",
                    "icon": "fa fa-refresh",
                    "more": false
                },
                "rights": []
            }
        ],
        formButtons: {
            updateBills: {
                "type": "toolbarItem",
                "id": "updateBills",
                "events": {
                    "onClick": "updateBills"
                },
                "properties": {
                    "caption": "Привязать счета",
                    "icon": "fa fa-credit-card",
                    "more": false,
                    "needSelected": true,
                    "needOnceSelected": false
                },
                "rights": []
            },
            decline: {
                "type": "toolbarItem",
                "id": "decline",
                "events": {
                    "onClick": "decline"
                },
                "properties": {
                    "caption": "Отказать",
                    "icon": "fa fa-ban",
                    "more": true,
                    "needSelected": true,
                    "needOnceSelected": false
                },
                "rights": []
            },
            configureAdditionalFields: {
                "type": "toolbarItem",
                "id": "configureAdditionalFields",
                "events": {
                    "onClick": "getFormForAdditionalFields"
                },
                "properties": {
                    "caption": "Добавить поля",
                    "icon": "fa fa-plus",
                    "more": true,
                    "needSelected": false,
                    "needOnceSelected": false
                },
                "rights": []
            }
        },
        multiselect: true,
        showSelectColumn: true,
        events: {
            beforeRender: "beforeBillBindingRender"
        },
    },
    stages_acceptance: {
        fkInfo: {
            productID: {
                additional: {
                    'productID.unitID': 'Ед. изм.'
                }
            },
            positionID: {
                additional: {
                    'positionID.queryID.organization': 'Организация'
                }
            }
        },
        groupBy: ['positionID*queryID*organization'],
        columnsOrder: ['positionID*queryID*organization'],
        formButtons: {
            decline: {
                "type": "toolbarItem",
                "id": "decline",
                "events": {
                    "onClick": "decline"
                },
                "properties": {
                    "caption": "Отказать",
                    "icon": "fa fa-ban",
                    "more": true,
                    "needSelected": true,
                    "needOnceSelected": false
                },
                "rights": []
            }
        }
    },
    billFiles: {
        multiselect: false,
        showSelectColumn: false,
        additionalButtons: {
            download: {
                "type": "toolbarItem",
                "id": "download",
                "events": {
                    "onClick": "download"
                },
                "properties": {
                    "caption": "Скачать файл",
                    "more": false,
                    "needSelected": true,
                    "needOnceSelected": false
                },
                "rights": []
            }
        },
        formButtons: {
            getPositionInfoForBills: {
                "type": "toolbarItem",
                "id": "getPositionInfoForBills",
                "events": {
                    "onClick": "getPositionInfoForBills"
                },
                "properties": {
                    "caption": "Позиции счета",
                    "icon": "fa fa-th-list",
                    "more": false,
                    "needSelected": false,
                    "needOnceSelected": false
                },
                "rights": []
            }
        },
        buttons: [
            {
                "type": "toolbarItem",
                "id": "refreshGrid",
                "events": {
                    "onClick": "refreshGrid"
                },
                "properties": {
                    "caption": "Обновить",
                    "icon": "fa fa-refresh",
                    "more": false
                },
                "rights": []
            },
            {
                "type": "toolbarItem",
                "id": "insert",
                "events": {
                    "onClick": "addRecord"
                },
                "properties": {
                    "caption": "Добавить",
                    "icon": "fa fa-plus",
                    "more": false
                },
                "rights": []

            },
            {
                "type": "toolbarItem",
                "id": "update",
                "events": {
                    "onClick": "editRecord"
                },
                "properties": {
                    "caption": "Изменить",
                    "icon": "fa fa-pencil",
                    "more": false,
                    "needOnceSelected": true
                },
                "rights": []
            },
            {
                "type": "toolbarItem",
                "id": "delete",
                "events": {
                    "onClick": "delRecord"
                },
                "properties": {
                    "caption": "Удалить",
                    "icon": "fa fa-times",
                    "more": true,
                    "needSelected": true,
                    "needOnceSelected": false
                },
                "rights": []
            }
        ],
        events: {
            onSelect: "onBillFilesSelect",
            onUnselect: "onBillFilesUnselect"
        }
    },
    filters: {
        buttons: [
            {
                "type": "toolbarItem",
                "id": "refreshGrid",
                "events": {
                    "onClick": "refreshGrid"
                },
                "properties": {
                    "caption": "Обновить",
                    "icon": "fa fa-refresh",
                    "more": false
                },
                "rights": []
            },
            {
                "type": "toolbarItem",
                "id": "insert",
                "events": {
                    "onClick": "addRecord"
                },
                "properties": {
                    "caption": "Добавить",
                    "icon": "fa fa-plus",
                    "more": false
                },
                "rights": []

            },
            {
                "type": "toolbarItem",
                "id": "copy",
                "events": {
                    "onClick": "copy"
                },
                "properties": {
                    "caption": "Копировать",
                    "icon": "fa fa-clone",
                    "more": false,
                    "needSelected": true,
                    "needOnceSelected": true
                },
                "rights": []
            },
            {
                "type": "toolbarItem",
                "id": "update",
                "events": {
                    "onClick": "editFilterRecord"
                },
                "properties": {
                    "caption": "Изменить",
                    "icon": "fa fa-pencil",
                    "more": false,
                    "needOnceSelected": true
                },
                "rights": []
            },
            {
                "type": "toolbarItem",
                "id": "delete",
                "events": {
                    "onClick": "delRecord"
                },
                "properties": {
                    "caption": "Удалить",
                    "icon": "fa fa-times",
                    "more": true,
                    "needSelected": true,
                    "needOnceSelected": false
                },
                "rights": []
            }
        ]
    },
    outlayDocument: {
        formButtons: {
            createQuery: {
                "type": "toolbarItem",
                "id": "createQuery",
                "events": {
                    "onClick": "createQuery"
                },
                "properties": {
                    "caption": "Создать заявку на основании сметы",
                    "more": true,
                    "needSelected": true,
                    "needOnceSelected": true
                },
                "rights": []
            }
        }
    },
    default: {
        editable: false,
        showSelectColumn: true,
        multiselect: true,
        events: {
            onExpand: 'expandTest'
        },
        // кнопки, которые соответствуют каким-то серверным методам (toNext для этапов, activate для заявок и т.д.)
        additionalButtons: {

        },
        formButtons: {
            configureAdditionalFields: {
                "type": "toolbarItem",
                "id": "configureAdditionalFields",
                "events": {
                    "onClick": "getFormForAdditionalFields"
                },
                "properties": {
                    "caption": "Добавить поля",
                    "icon": "fa fa-plus",
                    "more": true,
                    "needSelected": false,
                    "needOnceSelected": false
                },
                "rights": []
            }
        },
        buttons: [
            {
                "type": "toolbarItem",
                "id": "refreshGrid",
                "events": {
                    "onClick": "refreshGrid"
                },
                "properties": {
                    "caption": "Обновить",
                    "icon": "fa fa-refresh",
                    "more": false
                },
                "rights": []
            },
            {
                "type": "toolbarItem",
                "id": "insert",
                "events": {
                    "onClick": "addRecord"
                },
                "properties": {
                    "caption": "Добавить",
                    "icon": "fa fa-plus",
                    "more": false
                },
                "rights": []

            },
            {
                "type": "toolbarItem",
                "id": "copy",
                "events": {
                    "onClick": "copy"
                },
                "properties": {
                    "caption": "Копировать",
                    "icon": "fa fa-clone",
                    "more": false,
                    "needSelected": true,
                    "needOnceSelected": true
                },
                "rights": []
            },
            {
                "type": "toolbarItem",
                "id": "update",
                "events": {
                    "onClick": "editRecord"
                },
                "properties": {
                    "caption": "Изменить",
                    "icon": "fa fa-pencil",
                    "more": false,
                    "needOnceSelected": true
                },
                "rights": []
            },
            {
                "type": "toolbarItem",
                "id": "delete",
                "events": {
                    "onClick": "delRecord"
                },
                "properties": {
                    "caption": "Удалить",
                    "icon": "fa fa-times",
                    "more": true,
                    "needSelected": true,
                    "needOnceSelected": false
                },
                "rights": []
            },
            /*{
                "type": "toolbarItem",
                "id": "editForm",
                "events": {
                    "onClick": "editForm"
                },
                "properties": {
                    "caption": "Edit form",
                    "more": false,
                    "needSelected": false,
                    "needOnceSelected": false
                },
                "rights": []
            },
            {
                "type": "toolbarItem",
                "id": "fileSending",
                "events": {
                    "onClick": "fileSending"
                },
                "properties": {
                    "caption": "File sending",
                    "more": false,
                    "needSelected": false,
                    "needOnceSelected": false
                },
                "rights": []
            },*/
        ],
        dataGetter: dataGetter
    }
};

/**
 * Функция для получения параметра из конфига
 * @param object - объект
 * @param param - параметр
 * @returns {*|string}
 */
export function getConfigParam(object, param) {
    let result = '';
    if (config[object] === undefined) {
        result = config['default'][param] || '';
    } else {
        if (config[object][param] === undefined) {
            result = config['default'][param] || '';
        } else {
            result = config[object][param] || '';
        }
    }
    if (typeof result !== 'function') {
        result = _.cloneDeep(result);
    }
    return result;
}

/**
 * Стандартный получатель данных
 * @param gridOptions
 * @param clientData
 * @returns {Promise.<{PK: string, gridRecords: {}, gridColumns: {}}>}
 */
async function dataGetter(gridOptions, clientData) {
    let fkInfo = gridOptions.fkInfo || undefined;
    let needRecords = gridOptions.needRecords || false;
    let mainFK = gridOptions.mainFK || 'desciption';
    let gridColumns = {};
    let gridRecords = {};
    let additionalButtons = cloneDeep(gridOptions.additionalButtons || {});
    let additionalFields = gridOptions.additionalFields || [];
    let standartButtons = cloneDeep(gridOptions.buttons || []);
    let queryOptionalFields = [];
    let refCol = '';
    let PK = '';
    let object = utils.getObjectName(clientData.path);
    let events = gridOptions.events || {};
    let token = clientData.token;
    let objViewClient = clientData.objView;
    let commonInterface = gridOptions.commonInterface || null;
    let objInterface;
    try {
        // получаем мета-данные о справочнике
        //interfaceData = await dataRouter.getInterface(objViewClient, object, token);
        commonInterface = await dataRouter.getInterface(objViewClient, null, token);
        objInterface = utils.getObjectInterface(commonInterface, object);
        // копируем для того, чтобы не коверкать конфигурацию
        gridColumns = cloneDeep(objInterface.fields);
        // ищем внешние ключи и ссылки
        for (let col in gridColumns) {
            if (gridColumns[col].type === 'ref') {
                refCol = col;
            }
        }
        PK = utils.getPrimaryKeyField(gridColumns);
        // формируем массив дополнительных полей для запроса
        queryOptionalFields = utils.getOptionalFields(gridColumns, fkInfo, mainFK);
        // добавим дополнительные поля, которые пришли от клиента
        additionalFields.forEach((field) => {
            let value = _.find(queryOptionalFields.additionalFields, item => item === field);
            if (!value) queryOptionalFields.additionalFields.push(field);
        });

    } catch (e) {
        console.log("Ошибка при запросе мета-данных " + object + " : " + e.stack);
        throw (e);
    }

    if (!Array.isArray(queryOptionalFields) && (queryOptionalFields.objectFields.length > 0 || queryOptionalFields.additionalFields.length > 0)) {
        // дозапрашиваем поля
        try {
            let result = await utils.extendOptionalFields(
                object, gridColumns, queryOptionalFields, fkInfo,
                mainFK, token, objViewClient, commonInterface);
            gridColumns = result.gridColumns;
            queryOptionalFields = result.queryOptionalFields;
        } catch (e) {
            console.log("Ошибка utils.extendOptionalFields : " + e);
            throw (e);
        }

    }
    // нужны ли записи
    if (needRecords) {
        // при запросе expand формы, реквизит главного объекта передаем как 'FK', а тут меняем на настоящее значение
        if (refCol !== '' && clientData.data.queryParams && clientData.data.queryParams.filter && clientData.data.queryParams.filter.comparisons['FK']) {
            clientData.data.queryParams.filter.comparisons[refCol] = clientData.data.queryParams.filter.comparisons['FK'];
            clientData.data.queryParams.filter.comparisons[refCol].left.value = refCol;
            clientData.data.queryParams.filter.tree.and = [refCol];
            delete clientData.data.queryParams.filter.comparisons['FK'];
        }
        try {
            gridRecords = await utils.getRecords({
                object: object,
                method: 'get',
                queryParams : clientData.data.queryParams,
                //filter: queryFilter,
                fields: queryOptionalFields || [],
                orderBy: gridOptions.properties.orderBy,
                token: token,
                objViewClient: objViewClient
            }, mainFK, commonInterface);
        } catch (e) {
            console.log("Ошибка utils.getRecords : " + e);
            throw (e);
        }
    }

    let buttonGetter = new ButtonGetter({
        standartButtons: getConfigParam(object, 'buttons') || [],
        additionalButtons: getConfigParam(object, 'additionalButtons') || {}, // могут быть как и в defaults так и переопределены в объектах
        formButtons: getConfigParam(object, 'formButtons') || {},
        interfaceMethods: objInterface.methods
    });
    let buttons = buttonGetter.getButtons();

    // определим табличную часть которая должна разворачиваться в форме списка(пока это просто первая ТЧ в списке)
    let refToExpand;
    let refs = objInterface.refs;
    if (refs.length) refToExpand = refs[0];

    // переопределим events, чтобы события onExpand не было для справочников без ТЧ
    // TODO не очень универсально и красиво получается
    let eventsChanged = cloneDeep(events);
    if (!refToExpand) delete eventsChanged.onExpand;

    return {
        PK: PK,
        refCol: refCol,
        gridRecords: gridRecords,
        gridColumns: gridColumns,
        buttons: buttons,
        refToExpand: refToExpand,
        events: eventsChanged
    }
}

/**
 * Выполняет дополнение строк таблицы стилями
 * @param dataObject
 * @returns {*}
 */
function dataRender(dataObject) {
    // for (let recid in dataObject.gridRecords) {
    //     if (!dataObject.gridRecords[recid].fields.date)
    //         dataObject.gridRecords[recid].fields.style = 'background: rgba(255,14,80,0.5)';
    // }
    return dataObject;
}