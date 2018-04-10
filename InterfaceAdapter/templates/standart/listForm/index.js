'use strict';
let builder = require('../../../builder');
let dataRouter = require('../../../routers/dataRouter');
let config = require('../../../config');
import {StandartListForm} from '../../../helper';
import {getConfigParam} from '../../configs/listForm.js';
import {utils} from '../../../utils';

let Response = builder.Response;


async function handler(clientData) {

    let path = clientData.path;
    let type = clientData.data.type;
    let token = clientData.token;
    let additionalFields = clientData.data.additionalFields || [];
    //это табличная часть
    let isRefs = (path.split('-refs-')[1] !== undefined ? true : false);
    let object = utils.getObjectName(path);
    let objViewClient = clientData.objView;
    // можем передать общий интерфейс предметной области полученный ранее(в chooseForm, elementForm и т.д.)
    let commonInterface = clientData.commonInterface || null;
    if (!commonInterface) {
        commonInterface = await dataRouter.getInterface(objViewClient, null, token);
    }
    let objectInterface = utils.getObjectInterface(commonInterface, object);

    let response = new Response();
    let panels = response.buildLayoutCarcass({
        path: path,
        header: objectInterface.description
    });


    let gridOptions = {
        type: type,
        fkInfo: getConfigParam(object, 'fkInfo'),
        additionalFields : additionalFields,
        hiddenColumns: getConfigParam(object, 'hiddenColumns') || [],
        properties: {
            pagination: getConfigParam(object, 'pagination') || false,
            hierachy: getConfigParam(object, 'hierachy') || false,
            limit: getConfigParam(object, 'limit') || 50,
            selected: clientData.data.selected || [],
            multiselect: clientData.data.multiselect || getConfigParam(object, 'multiselect') || false,
            showSelectColumn: clientData.data.showSelectColumn || getConfigParam(object, 'showSelectColumn') || false,
            orderBy: getConfigParam(object, 'orderBy') || [],
            groupBy: getConfigParam(object, 'groupBy') || [],
            showGroupCol: getConfigParam(object, 'showGroupCol'),
            editable: getConfigParam(object, 'editable'), // редактируемость всей ТЧ
            fieldsEditability: getConfigParam(object, 'fieldsEditability') // редактируемость различных полей ТЧ
        },
        columnsOrder: getConfigParam(object, 'columnsOrder'), // последовательность полей в таблице
        needRecords: ((clientData.data.queryParams && clientData.data.queryParams.filter === undefined && isRefs) || getConfigParam(object, 'pagination') ? false : true),
        mainFK: getConfigParam('common', 'mainFK'),
        dataGetter: getConfigParam(object, 'dataGetter'),
        dataRenderer: getConfigParam(object, 'dataRenderer') || '',
        buttons: getConfigParam(object, 'buttons'),
        additionalButtons: getConfigParam(object, 'additionalButtons'),
        events: getConfigParam(object, 'events'),
        dropListsToLoad: config.get('dropListsToLoad'),
        commonInterface: commonInterface
    };
    let standartForm = new StandartListForm(clientData, gridOptions, response);
    let grid = await standartForm.render();

    panels.main.appendChild(grid);
    response.extendWithCode();

    return response;

}

module.exports = {
    handler: handler
};




