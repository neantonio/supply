let builder = require('../../../../builder');
let Form = builder.Form;
let Field = builder.Field;

let Response = builder.Response;

async function handler(clientData) {

    let queryID = clientData.data.queryID;
    let path = 'copyToOutlay';

    let response = new Response();

    let panels = response.buildPopupCarcass({
        path : path,
        header : 'Копирование позиций заявок в смету',
        height : 320,
        popupBtns : [
            {
                "type": "button",
                "id": "copyToOutlay",
                "events": {
                    "click": "copyToOutlay"
                },
                "properties": {
                    "caption": "Копировать",
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
        path : path,
        page : response,
        properties : {
            headID : queryID
        }
    });

    let field = new Field({
        path: path,
        buttons : [{
            type: "button",
            properties: {
                icon: "fa fa-ellipsis-h fa-lg",
                style: "btn btn-success"
            },
            id: 'more',
            events: {
                click: "showLink"
            }
        }],
        properties : {
            type : 'reference',
            link : 'outlayDocument',
            label : 'Смета',
            name : 'outlayID',
            required : true
        },
        type : "dropList"
    });

    form.appendChild(field);

    panels.main.appendChild(form);

    response.extendWithCode();
    return response;

}

module.exports = {
    handler: handler
};