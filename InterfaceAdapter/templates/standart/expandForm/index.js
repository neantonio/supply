'use strict'
let builder = require('../../../builder');
import {StandartListForm} from '../../../helper';
import {getConfigParam} from '../../configs/listForm.js';
import {utils} from '../../../utils';

let Response = builder.Response;
let Layout = builder.Layout;
let Panel = builder.Panel;
let Grid = builder.Grid;


async function handler(clientData) {

    let path = clientData.path;
    let action = clientData.action;
    let type = clientData.data.type;
    let response = new Response({path: path});

    let layoutGrid = new Layout({
        path: path
    });
    response.appendChild(layoutGrid);

    let panel = new Panel({
        properties: {
            position: 'main',
            width: '50%'
        }
    });
    layoutGrid.appendChild(panel);
    let object = utils.getObjectName(path);
    let gridOptions = {
        id: clientData.data.queryParams.filter.comparisons['FK'].right.value,
        type: type,
        fkInfo: getConfigParam(object, 'fkInfo'),
        needRecords: true,
        properties: {
            orderBy: getConfigParam(object, 'orderBy') || [],
            editable: getConfigParam(object, 'editable'), // редактируемость всей ТЧ
            fieldsEditability: getConfigParam(object, 'fieldsEditability'), // редактируемость различных полей ТЧ
        },
        dataGetter: getConfigParam(object, 'dataGetter'),
        buttons: getConfigParam(object, 'buttons'),
        additionalButtons: getConfigParam(object, 'additionalButtons'),
        dataRenderer: getConfigParam(object, 'dataRenderer') || '',
        mainFK: getConfigParam('common', 'mainFK')
    }
    let standartForm = new StandartListForm(clientData, gridOptions, response);
    let grid = await standartForm.render();

    panel.appendChild(grid);
    response.extendWithCode();

    return response;

}

module.exports = {
    handler: handler
};




