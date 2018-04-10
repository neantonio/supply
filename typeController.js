import {logger} from './Logger/controller'
import {promiseReadFile, promiseReadDir, promiseFileExists, promiseCreateAndWriteToFile} from './service/fsPromise'
// import * as uuid from 'uuid';


class controller{
    constructor(){
        this.__types = {
            boolean: {
                common: "object",
                check: value => {
                    return ["true", "false", true, false, 0, 1].indexOf(value) >= 0
                },
                generate: () => {
                    return true;
                }
            },
            string: {
                common: "object",
                check: value => {
                    return true;
                },
                generate: (n) => {
                    let text = "";
                    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

                    for (let i = 0; i < n; i++)
                        text += possible.charAt(Math.floor(Math.random() * possible.length));

                    return text;
                }
            },
            integer: {
                common: "object",
                check: value => {
                    return value === null || parseInt(value).toString() === value.toString()
                },
                generate: (n) => Math.round(Math.random()*n)
            },
            float: {
                common: "object",
                check: value => {
                    return value === null || parseFloat(value).toString() === value.toString()
                },
                generate: (n) => {
                    return Math.random()*n;
                }
            },
            date: {
                common: "object",
                check: value => {
                    return new Date(value).toString() !== "Invalid Date";
                },
                generate: () => {
                    let year = 2000 + Math.round(Math.random() * 17);
                    let month = Math.round(Math.random() * 11) + 1;
                    let day = Math.round(Math.random() * 30) + 1;
                    return new Date(`${year}-${month}-${day}`);
                }
            },
            time: {
                common: "object",
                check: value => {
                    return value instanceof Date || !!value.match(/^\d{1,2}:\d{1,2}:\d{1,2}$/);
                },
                generate: () => {
                    let hour = Math.round(Math.random() * 23);
                    let minute = 2000 + Math.round(Math.random() * 59);
                    let second = 2000 + Math.round(Math.random() * 59);
                    return `${hour}:${minute}:${second}`;
                }
            },
            timestamp: {
                common: "object",
                check: value => {
                    if(!value){
                        value = (new Date()).toISOString();
                    }
                    return new Date(value).toString() !== "Invalid Date"
                },
                generate: () => {
                    let year = 2000 + Math.round(Math.random() * 17);
                    let month = Math.round(Math.random() * 11) + 1;
                    let day = Math.round(Math.random() * 30) + 1;
                    let hour = Math.round(Math.random() * 24);
                    let minute = 2000 + Math.round(Math.random() * 60);
                    let second = 2000 + Math.round(Math.random() * 60);
                    return new Date(`${year}-${month}-${day} ${hour}:${minute}:${second}`);
                }
            },
            array: {
                common: "object",
                check: value => {
                    return value instanceof Array;
                },
                generate: () => {
                    return [];
                }
            },
            object: {
                check: value => true
            },
            file: {
                common: "string",
                check: value => true,
                generate: () => "Genereated file"
            }
        };
    }

    async init(){
        await this.registerTypesFromDir();
        await this.check();
    }

    /**
     * Регистрация обработчика типа, как регулярного выражения
     * */
    __regexpRegister(type, check, common){
        this.__types[type] = {
            check: new Function("x",
                `let re = new RegExp('${check.exp}', '${check.flags}');
                    return x ? !!x.toString().match(re) : false;`)
        };
        if(common)
            this.__types[type].common = common;
        return Promise.resolve();
    }

    /**
     * Регистрация обработчика типа, как функции
     * */
    __functionRegister(type, check, common){
        this.__types[type] = {
            check: new Function(check.args.join(","), check.code)
        };
        if(common)
            this.__types[type].common = common;

        return Promise.resolve();
    }

    async __createFile(type, check, generate, common){
        return await promiseCreateAndWriteToFile(`./types/${type}.json`, {type: type, check: check, generate:generate, common: common})
    }

    check(){
        for(let type in this.__types)
            if(this.__types[type].common && !this.__types[this.__types[type].common]) {
                logger.write(`warning`, `Неверно указан родитель для типа ${type}. Не объявлен тип ${this.__types[type].common}`, new Error())
                return Promise.reject();
            }
        return Promise.resolve()
    }

    /**
     * Метод для регистрации нового типа в системе
     *  type - имя типа
     *  check - описание типа в формате
     *   { // если проверка задана как регулярное выражение
            "type": "regexp",
            "check": {
                "exp": "string",
                "flags": "flags"
            }
        }
        { // если проверка задана как функция
            "type": "function",
            "check": {
                "args": ["v1", "v2"],
                "code": "JScode"
            }
        }
     * */
    async registerType(type, check, generate, common){
        logger.write(`log`, `Регистрация типа ${type}`);
        if(!check || !check.type || !check.check || !type) {
            logger.write(`warning`, `Неверный формат описания обработчика для типа`, new Error());
            throw `Неверный формат описания обработчика для типа`;
        }

        if(!this[`__${check.type}Register`]){
            logger.write(`warning`, `Попытка регистрации типа ${type}. Отсутствует обработчик ${check.type}. `, new Error());
            throw `Попытка регистрации типа ${type}. Отсутствует обработчик ${check.type}. `;
        }

        if(!common){
            logger.write(`warning`, `Необходимо указать родительский тип для типа ${type}`, new Error());
            throw `Необходимо указать родительский тип для типа ${type}`;
        }
        if(!this.__types[common])
            logger.write(`warning`, `На текущий момент не существует типа '${common}', указанного в качестве родителя`, new Error());

        await this[`__${check.type}Register`](type, check.check, common)

        if(generate)
            this.__types[type].generate = new Function((generate.args||[]).join(","), generate.function);
        return this.__createFile(type, check, generate, common);
    }

    /**
     * Метод для загрузки типа из файла
     * Формат:
     *  {
     *      "type": "typeName", // описываемый тип
     *      "common": "ancName", // имя типа-предка
     *      "check": {} // описание обработчика
     *
     * */
    async registerTypeFromFile(filename){
        logger.write(`log`, `Загрузка обработчика из файла ${filename}.`);
        let content = await promiseReadFile(filename);
            let json;
            try{
                json = JSON.parse(content);
            }
            catch(e){
                logger.write(`warning`, `Ошибка загрузки описания из файла ${filename}.`, new Error());
                throw `Ошибка загрузки описания из файла ${filename}.`;
            }
            if(!json.common){
                logger.write(`warning`, `Ошибка загрузки описания из файла ${filename}. Не объявлен предок, от которого наследуется тип.`, new Error());
                throw `Ошибка загрузки описания из файла ${filename}. Не объявлен предок, от которого наследуется тип.`;
            }
            return await this.registerType(json.type, json.check, json.generate || null, json.common)

    }

    /**
     * Метод для регистрации типов из описаний в папке @dirname
     * */
    async registerTypesFromDir(dirname = "./types/"){

        //return Promise.resolve();
        let self = this;
        logger.write("debug", `Загрузка обработчиков типов данных из папки ${dirname}`);
        let files = (await promiseReadDir(dirname)).filter(file => file.match(/(.+?)\.json$/));
        for(let file of files){
            await this.registerTypeFromFile(dirname + "/" + file);
        }
    }

    /**
     * Проверка значения @value на соответствие типу @type
     * */
    async checkValue(type, value){
        if(this.__types[type] && this.__types[type].check(value)) {
            return true;
        }
        logger.write("log", `Значение '${value}' не соответствует типу '${type}'`);
        return Promise.reject(`Значение '${value}' не соответствует типу '${type}'`);

    }

    async generateValue(type, pars){
        if(this.__types[type].generate)
            return this.__types[type].generate(...(pars ? pars : []));
        else
            if(this.__types.common)
                return this.generateValue(this.__types.common, pars);

        logger(`warning`, `Нет генератора для укуазанного типа`, new Error());
        return Promise.reject(`Нет генератора для укуазанного типа`);
    }

    __getChunk(type){
        if(this.__types[type].common)
            return [type].concat(this.__getChunk(this.__types[type].common));
        else
            return [type];
    }

    /**
     * Получение цепочки наследования типа @type
     * */
    async getChunk(type){
        try{
            return this.__getChunk(type);
        }
        catch(e){
            logger.write(`warning`, `Ошибка при возвращении цепочки наследования для ${type}.`, new Error());
            throw `Ошибка при возвращении цепочки наследования для ${type}.`;
        }
    }
}

let typeController = new controller();

export {typeController};