let builder = require('../../../builder');
let dataRouter = require('../../../routers/dataRouter');
let tmplRouter = require('../../../routers/tmplRouter');
import {StandartElementForm} from '../../../helper';
import {getConfigParam} from '../../configs/elementForm.js';
import {utils} from '../../../utils';
let cloneDeep = require('lodash.clonedeep');

let Response = builder.Response;

async function handler(clientData) {

    let response = new Response();

    let object = utils.getObjectName(clientData.path);
    let formOptions = cloneDeep(getParams(object, ['popupBtns', 'dropListsToLoad', 'refsLoadAfter', 'customizator', 'filterFields']));

    let standartForm = new StandartElementForm(clientData, formOptions, response);

    let options = {};
    options.id = clientData.data.type;
    options.path = clientData.path;
    options.header = clientData.data.filter !== undefined ? 'Изменение записи' : 'Добавление записи';
    options.panelsCount = 1;
    options.popupBtns = formOptions.popupBtns;
    let panels = response.buildPopupCarcass(options);

    let panelContent = await standartForm.render();
    panels.main.appendChild(panelContent);
    if (formOptions.customizator !== '') {
        response = formOptions.customizator(response);
    }
    response.extendWithCode();
    return response;

}

function getParams(object, params) {

    let result = {};

    params.forEach((paramName) => {
        result[paramName] = getConfigParam(object, paramName);
    });

    return result;

}


module.exports = {
    handler: handler
};