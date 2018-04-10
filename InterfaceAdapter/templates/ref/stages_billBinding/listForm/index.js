let builder = require('../../../../builder');
let dataRouter = require('../../../../routers/dataRouter');
import {utils} from '../../../../utils';
import {StandartListForm} from '../../../../helper';
import {getConfigParam} from '../../../configs/listForm';

let Response = builder.Response;
let Layout = builder.Layout;
let Panel = builder.Panel;
let Grid = builder.Grid;
let Tabs = builder.Tabs;
let Tab = builder.Tab;
let Map = builder.Map;

async function handler(clientData) {

    let path = clientData.path;
    let object = utils.getObjectName(path);
    let type = clientData.data.type;
    let token = clientData.token;
    let objViewClient = clientData.objView;

    let response = new Response({path: path});

    let panels = response.buildLayoutCarcass({
        path: path,
        panelsCount: 2
    });
    let panelMain = panels.main;
    let panelLeft = panels.left;


    await fillLeftPanel('billFiles');
    await fillMainPanel('stages_billBinding');


    async function fillLeftPanel(object) {
        const grid = await getListForm(object);
        panelLeft.appendChild(grid);
    }

    async function fillMainPanel(object) {
        const grid = await getListForm(object);
        panelMain.appendChild(grid);
    }

    async function getListForm(object) {

        let gridOptions = {
            type: type,
            fkInfo: getConfigParam(object, 'fkInfo'),
            properties: {
                buttons: getConfigParam(object, 'buttons'),
                pagination: getConfigParam(object, 'pagination') || false,
                limit: getConfigParam(object, 'limit') || 50,
                selected: clientData.data.selected || [],
                multiselect: clientData.data.multiselect || getConfigParam(object, 'multiselect') || false,
                showSelectColumn: clientData.data.showSelectColumn || getConfigParam(object, 'showSelectColumn') || false
            },
            needRecords: true,
            dataGetter: getConfigParam(object, 'dataGetter'),
            events: getConfigParam(object, 'events'),
            buttons: getConfigParam(object, 'buttons'),
            additionalButtons: getConfigParam(object, 'additionalButtons'),
            mainFK: getConfigParam('common', 'mainFK')
        };
        // TODO пока не переделали все под object переделываем path
        clientData.path = 'ref-' + object;

        let standartForm = new StandartListForm(clientData, gridOptions, response);
        let grid = await standartForm.render();

        return grid;

    }

    response.extendWithCode();
    return response;

}

module.exports = {
    handler: handler
};