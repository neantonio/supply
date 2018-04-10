import req from 'request';
import * as http from "http";
import * as querystring from 'querystring';
import {logger} from "../Logger/controller";

function request(options){
    return new Promise((res, rej) => {
        req(options, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                res(body);
            } else{
                logger.write(`error`, `Ошибка получения данных. ${error}.`, new Error());
                rej(`Модуль requestPromise. Ошибка получения данных.`);
            }
        });
    })
}

function httpRequest(address, port, data){
    return new Promise((response, reject) => {
        let postData = JSON.stringify(data);

        let options = {
            hostname: address,
            port: port,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': postData.length
            }
        };

        let responseData = "";
        let req = http.request(options, function (res) {
            console.log('STATUS:', res.statusCode);
            console.log('HEADERS:', JSON.stringify(res.headers));

            res.setEncoding('utf8');

            res.on('data', function (chunk) {
                //console.log('BODY:', chunk);
                responseData += chunk;
            });

            res.on('end', function () {
                response(responseData);
            });
        });

        req.on('error', function (e) {
            reject(e);
        });

        req.write(postData);
        req.end();
    });
}



export {
    request as request,
    httpRequest as httpRequest
}