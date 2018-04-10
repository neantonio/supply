import * as http from "http";
import {router} from "./router";

class server{
    constructor(){
        let self = this;
        this.__server = new http.Server(function(req, res) {
            // API сервера будет принимать только POST-запросы и только JSON, так что записываем
            // всю нашу полученную информацию в переменную jsonString
            let jsonString = '';
            res.setHeader('Content-Type', 'application/json');
            req.on('data', (data) => { // Пришла информация - записали.
                jsonString += data;
            });

            req.on('end', async () => {// Информации больше нет - передаём её дальше.
                try {
                    let jsonParse = JSON.parse(jsonString);
                    if(!jsonParse.method){
                        res.write(JSON.stringify(self.__errorMessage("Не указано имя плагина.")));
                    }
                    else if(!jsonParse.token){
                        res.write(JSON.stringify(self.__errorMessage("При обращению к плагину необходимо передать токен доступа.")));
                    }
                    else {
                        let result = {
                            records: await router.query(jsonParse.method, jsonParse.parameters, jsonParse.token)
                        };
                        res.write(JSON.stringify(self.__successMessage(result)));
                    }
                }
                catch(e){
                    res.write(JSON.stringify(self.__errorMessage(e.toString())));
                }
                res.end();// Функцию define мы ещё не создали.
            });
        });
    }

    __errorMessage(message){
        return {
            status: "error",
            message: message
        }
    }

    __successMessage(message){
        return {
            status: "success",
            message: message
        }
    }
    
    async start() {
        await router.init();
        this.__server.listen(8000, 'localhost');
    }


}

let app = new server();
app.start();
