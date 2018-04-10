#!/usr/bin/env node
import {Secure} from "./src/main/secureService/Secure";
//import * as emitter from "events";

//emitter.setMaxListeners(0);
/**
 * Module dependencies.
 */

let app = require('./app');
let debug = require('debug')('express-4:server');
let http = require('http');

/**
 * Get port from environment and store in Express.
 */

let port = normalizePort(process.env.PORT || '12345');
app.set('port', port);

/**
 * Initialize object view and start HTTP server.
 */
let server;
initObjView().then(() => {
    server = startServer();
}).catch((err) => {
    console.log("serverStart.js ERROR! Server hasn't been created! " + err.stack);
});


/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
    let port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    let bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
    let addr = server.address();
    let bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    debug('Listening on ' + bind);
}


function startServer() {

    let server = http.createServer(app);

    /**
     * Listen on provided port, on all network interfaces.
     */

    server.listen(port);
    server.on('error', onError);
    server.on('listening', onListening);

    console.log('Fucking perfect server has been created!');

    return server;

}

async function initObjView() {
    let objView;
    try {
        objView   = new Secure("root");
    }
    catch(e){
        console.log(e)
    }

    try {
        global.objView = objView;
    }
    catch(e){
        console.log(e);
    }

    try {
        return objView.init()
    }
    catch(e){
        console.log(e);
    }
        /*.then(()=>{
            // подписываем insert в схему на активацию заявки
            let r = {
                fields:{
                    "new.records.refs.query_position.fields.ID":"values.qid",
                    "new.records.refs.query_position.fields.tz":"values.tz",
                    "new.records.refs.query_position.fields.productID":"values.productID",
                    "new.records.refs.query_position.fields.commentary":"values.commentary"
                },
                behavior:{}
            };
            let rUnactive = {
                fields:{
                    "filter.all.ID": "filter.all.ID"
                },
                behavior:{}
            };
            let posUpd = {
                fields:{
                    "values.stageName":"values.stage",
                    "filter.all.qid": "filter.all.ID"
                }
            };
            // global.objView.subscriberView.__objectViews['supply'].__addSubscriber('pre', 'stages', 'update', 'query_position', 'update', posUpd, 'first');
            // global.objView.subscriberView.__objectViews['supply'].__addSubscriber('rb', 'query', 'active', 'query', 'deactive', rUnactive, 'first');
            // global.objView.subscriberView.__objectViews['supply'].__addSubscriber('post', 'query', 'active', 'stages', 'insert', r, 'first');
        })*/
       /* .then(()=>{
            // подписываем голосование на toNext закупочной комиссии
            // relation для всех подписок одинаковый
            let relVote = {
                fields: {"filter.all.ID":"filter.all.ref.stages_procurementCommission_votes.ID"},
                behavior:{}
            };
            // навешивает подписку на 3 метода
            let v = ['chVote', 'fVote', 'sVote'];
            for (let voice of v){
                //global.objView.subscriberView.__objectViews['supply'].__addSubscriber('post', 'stages_procurementCommission_votes', voice, 'stages_procurementCommission', 'toNext', relVote, 'first');
            }
        })*/


}