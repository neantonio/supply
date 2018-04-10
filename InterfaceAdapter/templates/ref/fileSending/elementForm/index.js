/* Form for add custom field to form's fields */

let builder = require('../../../../builder');
let Form = builder.Form;
let Field = builder.Field;
import {getConfigParam} from '../../../configs/elementForm.js';
import {utils} from '../../../../utils';
let cloneDeep = require('lodash.clonedeep');

let Response = builder.Response;

async function handler(clientData) {

    let parentTableID = clientData.data.parentTableID;

    let response = new Response();

    let panels = response.buildPopupCarcass({
        path : 'ref-fileSending',
        header : 'Sending file',
        popupBtns : [
            {
                "type": "button",
                "id": "sendFile",
                "events": {
                    "click": "onSendFileClick"
                },
                "properties": {
                    "caption": "Отправить",
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
    });

    let form = new Form({
        path : 'ref-fileSending',
        page : response,
        properties : {
            parentTableID : parentTableID
        }
    });

    let field = new Field({
        buttons : [],
        properties : {
            type : 'file',
            label : 'Файл',
            name : 'fileToSend'
        }
    });

    form.appendChild(field);

    panels.main.appendChild(form);

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