let builder = require('../../../../builder');
let Form = builder.Form;
let Field = builder.Field;

let Response = builder.Response;

async function handler(clientData) {

    let queryID = clientData.data.queryID;
    let path = 'addSupplierForm';

    let response = new Response();

    let panels = response.buildPopupCarcass({
        path : path,
        header : 'Добавление поставщика',
        height : 320,
        popupBtns : [
            {
                "type": "button",
                "id": "addSupplier",
                "events": {
                    "click": "addSupplier"
                },
                "properties": {
                    "caption": "Добавить",
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
        page : response
    });

    let field = new Field({
        path: path,
        id: 'supplier',
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
            link : 'supplier',
            label : 'Поставщик',
            name : 'supplier',
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