'use strict'

function getHandler(clientData) {
    let path, action, type;
    path = clientData.path ;
    action = clientData.action;
    type = (clientData.data !== undefined) ? clientData.data.type : null;
    let handlerLib = '';
    switch (action) {
        case 'get': {
            let fileName = path.split('-').join('/') + '/' + type + '/' + 'index.js';
            // ищем в формах объекта и в общих формах
            try {
                handlerLib = require('../templates/' + fileName);
            } catch (e) {
                // ищем в стандартных формах
                try {
                    handlerLib = require('../templates/standart/' + type + '/index.js');
                } catch (e) {
                    let error = new Error('Not found! ' + e);
                    throw error;
                }
            }
            break;
        }
        case 'getContent':
        case 'update':
        case 'copy' :
        case 'add': {
            try {
                handlerLib = require('../templates/justContent/index.js');
            } catch (e) {
                let error = new Error('Not found! ' + e);
                throw error;
            }
            break;
        }
        case 'customAction':
            try {
                handlerLib = require('../templates/customActions/index.js');
            } catch (e) {
                let error = new Error('Not found! ' + e);
                throw error;
            }
            break;
        case 'getMenu':
            try {
                handlerLib = require('../templates/menu/index.js');
            } catch (e) {
                let error = new Error('Not found! ' + e);
                throw error;
            }
            break;
        case 'delete': {
            handlerLib = require('../templates/withoutTmpl/index.js');
            break;
        }
        default:
            let error = new Error('Not found! ' + e);
            throw error;
    }
    return handlerLib.handler;

}
module.exports = {
    getHandler: getHandler
}