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
    let token = clientData.token;
    let object = utils.getObjectName(path);
    let objViewClient = clientData.objView;

    let response = new Response({path: path});

    let panels = response.buildLayoutCarcass({
        path: path
    });
    let panel = panels.main;

    let tabs = new Tabs({
        path: path,
        page: response,
        properties: {
            showFirstTab: false
        }
    });

    panel.appendChild(tabs);

    let tabEvents = {
        beforeShow: 'stageBeforeShow'
    };

    // получаем интерфейс схемы
    let commonInterface = await dataRouter.getInterface(objViewClient, null, token);
    let schemeInterface = utils.getObjectInterface(commonInterface,object);

    let stages = schemeInterface.stages;

    // цикл по этапам схемы
    for (let stageName in stages) {
        // получаем интерфейс этапа
        let stageInterface = utils.getObjectInterface(commonInterface,stageName);
        let stageDescr = stageInterface.description;

        // создаем объект вкладки
        let tab = new Tab({
            id: 'st',
            path: 'ref-' + stageName,
            page: response,
            properties: {
                "header": stageDescr
            },
            events: tabEvents
        });
        tabs.appendChild(tab);
    }

    response.extendWithCode();
    return response;

}

module.exports = {
    handler: handler
};