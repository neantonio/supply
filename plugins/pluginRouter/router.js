import * as fs from "fs";
import {sender} from "./functions/baseClasses/sendClass";
let logger = console.log;

class routerClass{
    // remote - удаленный плагин сервис
    // extended - плгин-роутер работает внутри основного проекта
    constructor(mode = "remote"){
        if(mode === "extended"){
            let extendedLogger =  require("../../Logger/controller").logger;
            logger = extendedLogger.write;
        }
        this.__methods = {};
    }

    async init() {
        let functionsDir = `${__dirname}/functions`;
        let files = fs.readdirSync(functionsDir).filter(s => s.match(/\.js$/));
        for(let file of files){
            if(fs.statSync(`${functionsDir}/${file}`).isFile()){
                let pluginInfo = require(`${functionsDir}/${file}`);
                this.__methods[pluginInfo.name] = pluginInfo.plugin;
            }
        }
        await sender.init();
    }

    async query(method, parameters = {}, token){
        if(!this.hasPlugin(method)){
            throw `Роутер плагинов. Не существует плагина '${method}'`;
        }

        try {
            logger('debug', `Запуск плагина ${method}`);
            return await this.__methods[method].run(parameters, token);
        }
        catch(e) {
            logger('warn', `PluginRouter. Ошибка: ${e.message ? e.message : e}`);
            throw `PluginRouter. Ошибка: ${e.message ? e.message : e}`
        }
    }
    
    hasPlugin(name){
        return !!this.__methods[name];
    }
}

let router = new routerClass();
export {router as router, routerClass as routerConstructor};