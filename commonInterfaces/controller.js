'use strict';

import {logger} from '../Logger/controller';
import {typeController} from '../typeController';
import * as fs from "fs";
import {promiseReadDir} from "../service/fsPromise";

class controller {

    constructor() {
        this.__interfaces = {};
    }

    /**
     * Метод для начальной инициализации набора базовых интерфейсов.
     * @param {string} dirname - директория, хранящая конфигурацию. По умолчанию папка, где расположен модуль.
     * */
    init(dirname = __dirname) {
        this.__workdir = dirname;
        logger.write("debug", "Начало инициализации контроллера интерфейсов.");
        return promiseReadDir(dirname)
            .then(files => files.filter(file => file.match(/(.+?)\.json$/)))
            .then(filterFiles => Promise.all(filterFiles.map(file => this.interfaceRegistrationFromFile(dirname + "/" + file))));
    }

    /**
     * Запомнить интерфейс для объекта
     * */
    interfaceRegistration(name, data) {
        this.__interfaces[name] = data;
        if(this.__interfaces[name].plugins) {
            for (let pluginName in this.__interfaces[name].plugins) {
                let pluginInfo = this.__interfaces[name].plugins[pluginName];
                interfaceController.addMethod(
                    name,
                    pluginName,
                    pluginInfo.description,
                    pluginInfo.type,
                    pluginInfo.parameters
                );
            }
        }
        this.__interfaces[name].links = {};
        this.__interfaces[name].refs = {};
        return this.__typesToChunk(this.__interfaces[name])
            .then(i => {this.__interfaces[name] = i});
    }

    /**
     * Метод для проверки правильности описания объектов предметной области.
     * Проверяется наличие всех объектов, указанных в качестве родителя
     * */
    async check() {
        for (let obj in this.__interfaces) {
            if (this.__interfaces[obj].common && !this.__interfaces[this.__interfaces[obj].common]) {
                logger.write(`error`, `Не зарегистрирован интерфейс объекта ${this.__interfaces[obj].common}, указанный в качестве родителя.`, new Error());
                throw `Не зарегистрирован интерфейс объекта ${this.__interfaces[obj].common}, указанный в качестве родителя.`;
            }

            for (let f in this.__interfaces[obj].fields) {
                let type = this.__interfaces[obj].fields[f].type;
                if (type == "ref" || type == "link") {
                    let fObj = this.__interfaces[obj].fields[f][type];
                    try {
                        this.__interfaces[fObj][type + "s"][obj] = f;
                    }
                    catch(e){
                        console.log();
                    }
                }
            }
        }
    }

    /**
     * Регистрация описания интерфейса из файла
     * */
    async interfaceRegistrationFromFile(filename){
        logger.write("debug", `Загрузка описaния интерфейса из файла ${filename}`);
        let data;
        try {
            data = JSON.parse(fs.readFileSync(filename));
            await this.interfaceRegistration(data.name, data);
        }
        catch(e){
            logger.write("warning", `Загрузка описания интерфейса из файла ${filename} выполнена с ошибкой.`);
            //return Promise.reject();
            throw "Yobanaya hujnya";
        }
        return data.name;
    }

    /**
     * Чтение описаний интерфейсов из директории (только файлы json)
     * */
    interfaceRegistrationFromDir(dirname){
        let self = this;
        logger.write("debug", `Загрузка интерфейсов из папки ${dirname}`);
        return new Promise((res, rej) => {
            // читаем список файлов в директории
            fs.readdir(dirname, (err, files) => {
                let pArr = [];
                Promise.all(files
                    .filter(file => file.match(/(.+?)\.json$/))
                    .map(filterFile => self.interfaceRegistrationFromFile(dirname + "/" + filterFile)))
                    .then(res)
                    .catch(rej);
            })
        })
    }

    __typesToChunk(int){
        return int.fields ? Promise.all(Object.keys(int.fields).map(
                f => ["link", "ref"].indexOf(int.fields[f].type) < 0
                        ? typeController.getChunk(int.fields[f].type)
                        : Promise.resolve(int.fields[f].type)))
            .then(types => {
                let typeHash = {};
                types.forEach(t => t instanceof Array ? typeHash[t[0]] = t : typeHash[t] = t);
                Object.keys(int.fields).forEach(f =>
                    int.fields[f].type = typeHash[int.fields[f].type]);
                return int;
            })
            : Promise.resolve(int);
    }

    /**
     * Возвращает описание интерфейса для объекта с именем @name
     * */
    async getInterfaceByName(name){
        logger.write(`debug`, `Получение интерфейса для ${name}.`);
        let self = this;
        if(!self.__interfaces[name]) {
            logger.write(`warning`, `Интерфейс ${name} не загружен.`, new Error());
            throw `Интерфейс ${name} не загружен.`;
        }
        let int = {};
        let curName = name;
        let common = true;
        // сбор интерфейса объекта с учетом наследования
        while(common) {
            for (let k in self.__interfaces[curName]) {
                // Если свойство не определено, добавляем его из объекта ${curname}
                if(!int[k])
                    int[k] = self.__interfaces[curName][k];
                // если определенное свойство является объектом
                else if(typeof int[k] === "object")
                    // и для какого-то свойства второго уровня не определено значение, переопределить
                    for(let f in self.__interfaces[curName][k]) {
                        if(!int[k][f]) {
                            int[k][f] = self.__interfaces[curName][k][f];
                        }
                    }
            }
            // Если объект имеет предка
            if(self.__interfaces[curName].common) {
                // переопределяем текущий объект и заходим в цикл заново
                logger.write(`debug`, `Получение интерфейса для предка ${curName}: ${self.__interfaces[curName].common}.`);
                curName = self.__interfaces[curName].common;
            }
            else
                // иначе заканчиваем цикл
                common = false;
        }
        // в качестве результата вернуть собранное описание интерфейса
        return int;
    }

    getPrimaryKey(obj){
        let pk = null;
        for(let f in this.__interfaces[obj].fields)
            if(this.__interfaces[obj].fields[f].isPrimary)
                pk = f;

        let fields = Object.keys(this.__interfaces[obj].fields)
        for(let i = 0; !pk || i<fields.length; ++i) {
            if (fields[i] && ["link", "ref"].indexOf(this.__interfaces[obj].fields[fields[i]].type) < 0) {
                pk = fields[i];
            }
        }

        return !!pk ? Promise.resolve({obj: obj, pk: pk}) : Promise.reject();
    }

    /**
     * Метод для добавления метода к уже существующему объекту
     * */
    addMethod(object, name, description, type, parameters){
        if(!this.__interfaces[object].methods){
            this.__interfaces[object].methods = {};
        }
        this.__interfaces[object].methods[name] = {
            description: description,
            type: type,
            parameters: parameters
        }
    }
}

let interfaceController = new controller();

export {interfaceController};