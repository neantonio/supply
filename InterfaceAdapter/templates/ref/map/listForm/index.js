let builder = require('../../../../builder');
import {utils} from '../../../../utils';
import {StandartListForm} from '../../../../helper';
import {getConfigParam} from '../../../configs/listForm';

let Response = builder.Response;
let Layout = builder.Layout;
let Panel = builder.Panel;
let Grid = builder.Grid;
let Map = builder.Map;

async function handler(clientData) {

    let path = clientData.path;
    let action = clientData.action;
    let type = clientData.data.type;
    let isRefs = (path.split('-refs-')[1] !== undefined ? true : false);

    let response = new Response({path: path});

    let layout = new Layout({
        path: path,
        page: response
    });
    response.appendChild(layout);

    let panelForMap = new Panel({
        path: path,
        page: response,
        properties: {
            position: 'left',
            width: '50%'
        }
    });
    layout.appendChild(panelForMap);

    fillPanelForMap(panelForMap);

    let panelForTable = new Panel({
        path: path,
        page: response,
        properties: {
            position: 'main',
            width: '50%'
        }
    });
    layout.appendChild(panelForTable);

    await fillPanelForTable(panelForTable);

    response.extendWithCode();
    return response;


    function fillPanelForMap(panel) {

        let map = new Map({
            path: path,
            page: response,
            events: {
                mapSelected : 'mapSelected',
                mapCursorMoved : 'mapCursorMoved'
            }
        });
        panel.appendChild(map);

    }

    async function fillPanelForTable(panel) {

        // TODO Приходится делать такую замену чтобы обратиться к нужному объекту (так как изначально в handler path приходит как "ref-map")
        let object = 'query';
        clientData.path = 'ref-query';

        let gridOptions = {
            type: type,
            fkInfo: getConfigParam(object, 'fkInfo'),
            needRecords: ((clientData.data.filter === undefined && isRefs) || getConfigParam(object, 'pagination') ? false : true),
            dataGetter: getConfigParam(object, 'dataGetter'),
            mainFK: getConfigParam('common', 'mainFK'),
            buttons: getConfigParam(object, 'buttons'),
            pagination: getConfigParam(object, 'pagination') || false,
            limit: getConfigParam(object, 'limit') || 50,
            selected: clientData.data.selected || [],
            multiselect: clientData.data.multiselect || false
        };
        let standartForm = new StandartListForm(clientData, gridOptions, response);
        let grid = await standartForm.render();

        panel.appendChild(grid);

    }

}

module.exports = {
    handler: handler
};