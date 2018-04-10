let builder = require('../../../builder');
let dataRouter = require('../../../routers/dataRouter');
let tmplRouter = require('../../../routers/tmplRouter');
import {utils} from '../../../utils';

let Response = builder.Response;

async function handler(clientData) {
    let response = new Response();
    let object = utils.getObjectName(clientData.path);
    let token = clientData.token;
    let objViewClient = clientData.objView;
    //let filter = clientData.data.filter;
    let queryParams = clientData.data.queryParams;
    // получаем мета-данные о справочнике
    let commonInterface = await dataRouter.getInterface(objViewClient, null, token);
    let objInterface = utils.getObjectInterface(commonInterface, object);
    let header = objInterface.description;
    let options = {};
    options.id = clientData.data.type;
    options.path = clientData.path;
    options.header = header;
    options.panelsCount = 1;
    options.popupBtns = [
        {
            "type": "button",
            "id": "chooseRecord",
            "events": {
                "click": "chooseRecord"
            },
            "properties": {
                "caption": "Выбрать",
                "param": {
                    form: clientData.data.form,
                    field: clientData.data.field
                }
            }
        }
    ];
    options.width = 800;
    options.height = 600;
    let panels = response.buildPopupCarcass(options);

    let handler = tmplRouter.getHandler({
        action: 'get',
        path: clientData.path,
        data: {
            type: 'listForm'
        }
    });
    // запускаем обработчик формирования формы, в процессе идет обращение к серверу
    let result = await handler({
        action: 'get',
        token: token,
        objView : objViewClient,
        path: clientData.path,
        data: {
            type: 'chooseForm',
            selected: clientData.data.selected || [],
            multiselect: false,
            showSelectColumn: true,
            queryParams: queryParams
            //filter: filter
        },
        commonInterface : commonInterface
    });
    //TODO WTF?!
    //выковыриваем элементы, доходим аж до таблицы
    panels.main.elements.push(result.elements[0].elements[0].elements[0]);
    //выковыриваем записи
    response.content.push(result.content[0]);
    response.extendWithCode();
    return response;

}

module.exports = {
    handler: handler
};