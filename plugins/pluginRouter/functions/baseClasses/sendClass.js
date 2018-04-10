import http from "http";
import * as config from "../../config.json";
import {util} from "./utilityClass";

class sendClass{
    constructor(){
        console.log(config);
        this.config = config.sendConfig;
        this.token;
    }

    async init(){
        await this.__login();
    }


    async send(data, token = this.token){
        data.token = this.token;
        let json = JSON.stringify(data);
        let result;
        try{
            result = await this.__sendMessage(this.__formOptions(json), json);
        }
        catch(e){
            if(e === "nullToken"){
                await this.__login();
                return await this.send(data);
            }
            else{
                throw e;
            }
        }
        return result.records || result;
    }

    __sendMessage(options, jsonData){
        let self = this;
        return new Promise( (res, rej) => {
            const req = http.request(options, (response) => {
                //console.log(`STATUS: ${response.statusCode}`);
                //console.log(`HEADERS: ${JSON.stringify(response.headers)}`);
                let data = "";
                response.setEncoding('utf8');
                response.on('data', (chunk) => {
                    data += chunk;
                });
                response.on('end', async () => {
                    //console.log('Data transfer complete.');
                    let parseData = JSON.parse(data);
                    if(parseData.status === "success") {
                        res(parseData.message);
                    }
                    else{
                        if(parseData.message === 'Токен не передан.'){
                            rej("nullToken")
                        }
                        else {
                            rej(parseData.message);
                        }
                    }
                });
            });

            req.on('error', (e) => {
                //console.error(`problem with request: ${e.message}`);
                rej(e);
            });

            // write data to request body
            req.write(jsonData);
            req.end();
        });
    }

    __formOptions(data, path = "/cli"){
        return {
            hostname: this.config.host,
            port: this.config.port,
            path: '/cli',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };
    }

    /**
     * Метод авторизации
     * */
    async __login(n = 0){
        if(n > 10){
            throw 'Невозможно подключиться к удаленному серверу.'
        }

        const jsonData = JSON.stringify({
            user: this.config.user,
            pswd: this.config.password
        });

        const options = {
            hostname: this.config.host,
            port: this.config.port,
            path: '/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(jsonData)
            }
        };

        let loginData;
        try{
            loginData = await this.__sendMessage(options, jsonData);
            this.token = loginData.token;
        }
        catch(e){
            await util.secTimer(3);
            await this.__login(n + 1);
        }
    }
}

let req = new sendClass();

export {req as sender};