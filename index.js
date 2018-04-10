'use strict';
let http = require('http');
let dataRouter = require('./InterfaceAdapter/routers/dataRouter');
let tmplRouter = require('./InterfaceAdapter/routers/tmplRouter');
let uuid = require('uuid');

process.setMaxListeners(0);

import {subscriberView} from './subscriberView';
import {Secure} from "./src/main/secureService/Secure";

global.objView = new subscriberView("root");
// = objView;
global.objView.init()
    .then(() => {
        return global.objView.query("supply.product", "get", {});
    })
/*.then(() => {
    //return this.query();
    return global.objView.query("supply.product", "sync", {});
})

.then(()=>{
    // подписываем insert в схему на активацию заявки
    let r = {
        fields:{
            "new.records.refs.query_position.fields.ID":"values.qid",
            "new.records.refs.query_position.fields.tz":"values.tz",
            "new.records.refs.query_position.fields.productID":"values.productID",
            "new.records.refs.query_position.fields.commentary":"values.commentary"
        },
        priority: 'first',
        behavior:{}
    };
    let rUnactive = {
        fields:{
            "old.records.fields.ID": "values.ID",
            "old.records.fields.workOut": "values.workOut"
        },
        priority: 'first',
        behavior:{}
    };
    let posUpd = {
        fields:{
            "values.stageName":"values.stage",
            "filter.all.qid": "filter.all.ID"
        },
        priority: 'first'
    };

    global.objView.__objectViews['supply'].addSubscriber('pre', 'stages', 'update', 'query_position', 'update', posUpd, 'first');
    global.objView.__objectViews['supply'].addSubscriber('rb', 'query', 'active', 'query', 'deactive', rUnactive, 'first');

    global.objView.__objectViews['supply'].addSubscriber('pre', 'stages', 'update', 'query_position', 'update', posUpd, 'first');
    global.objView.__objectViews['supply'].addSubscriber('rb', 'query', 'active', 'query', 'rbUpdate', rUnactive, 'first');
    global.objView.__objectViews['supply'].addSubscriber('post', 'query', 'active', 'stages', 'insert', r, 'first');

})
.then(()=>{
    // подписываем голосование на toNext закупочной комиссии
    // relation для всех подписок одинаковый
    let relVote = {
        fields: {"filter.all.ID":"filter.all.ref.stages_procurementCommission_votes.ID"},
        behavior:{},
        priority: 'first'
    };
    // навешивает подписку на 3 метода
    let v = ['chVote', 'fVote', 'sVote'];
    for (let voice of v){
        global.objView.__objectViews['supply'].__addSubscriber('post', 'stages_procurementCommission_votes', voice, 'stages_procurementCommission', 'toNext', relVote);
    }
})
.then(() => {
    let filter = {
        comparisons:{
            qid:{
                left: {type: "field", value: "qid"},
                right: {type: "value", value: '91518259-2381-a195-b707-015453288878'},
                sign: "equal"
            }
        },
        tree: {and:["qid"]}
    };
    return global.objView.query("supply.stages", "get", {filter: filter, fields: ["qid.queryID.description"]});
})*/
    .then((r) => {
        // запускаем сервер
        startServer();
    })
    .catch((err)=>{
        // отлавливаем ошибка
        console.log("index.js ERROR! Server hasn't been created! " + err);
    });

function startServer() {
    http.createServer(accept).listen(12345);
    console.log("Fucking perfect server has been created!");
}

function accept(req, res) {
    let url = req.url;
    let clientData = '';
    req.on('data', function (chunk) {
        clientData += chunk.toString();
    });
    req.on('end', function () {
        //входная информация
        console.log('IP:' + getIP(req) + 'data:' + clientData);
        //заголовки для кроссдоменного запроса
        setHeaders(res);

        try {
            clientData = JSON.parse(clientData);
        } catch (err) {
            console.log(err);
            sendResponse(res, 'error', "Can't parse");
            return;
        }

        // Получим handler, который должен обрабатывать текущий запрос
        try {
            let handler = tmplRouter.getHandler(clientData);
            // запускаем обработчик формирования формы, в процессе идет обращение к серверу поэтому обрабатываем в then
            let resultPromise = handler(clientData);
            resultPromise.then((result) => {
                sendResponse(res, 'success', result);
            }, (err) => {
                console.log(err);
                sendResponse(res, 'error', err);
            });
        } catch (err) {
            console.log(err);
            sendResponse(res, 'error', "Server error!");
            return;
        }
    });
}

function sendResponse(res, status, message) {

    let responseObject = {
        status: status,
        message: message
    };

    res.write(JSON.stringify(responseObject));
    setTimeout(function () {
        res.end();
    }, 200);

}

function sendError(res, code) {
    res.writeHead(code);
    setTimeout(function () {
        res.end();
    }, 1000);

}

function getIP(request) {
    return request.headers['x-forwarded-for'] ||
        request.connection.remoteAddress ||
        request.socket.remoteAddress ||
        request.connection.socket.remoteAddress;
}


function setHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');

}


// //пробный сокет-сервер
// let WebSocketServer = new require('ws');
// // WebSocket-сервер на порту 8081
// var webSocketServer = new WebSocketServer.Server({
//     port: 8081
// });
// let clients = [];
// webSocketServer.on('connection', function (ws) {
//     let id = Math.random();
//     clients[id] = ws;
//     console.log("Новое соединение " + id);
//     ws.send('Успешно подключено!!!');
//     ws.on('message', function (message) {
//         console.log('Получено сообщение ' + message);
//         for (var key in clients) {
//             clients[key].send(message);
//         }
//     });
//
//     ws.on('close', function () {
//         console.log('соединение закрыто ' + id);
//         delete clients[id];
//     });
//
// });