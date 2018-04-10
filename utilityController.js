/**
 * Created by User on 06.06.2017.
 */

import {interfaceController} from "./commonInterfaces/controller"
//import {System} from 'es6-module-loader'
import {logger} from './Logger/controller'
import * as fs from "fs";
//import * as rr from 'fs-readdir-promise';


function promiseReadDir(path){
    return new Promise((res, rej) => {
        fs.readdir(path, (err, items) => {
            if(err)
                rej(items);
            let list = items.map(filename => path+"/"+filename);
            res(list);
        });
    })
};

class Utilits{
    constructor(){
        logger.write("debug", "Создание экземпляра класса контроллера утилит.");
        this.__configs = {};
        this.__exUtilits = {};
        this.__logger = logger;
    }

    /**
     * Чтение конфигурации для утилиты из файла
     * @param {string} filename - имя файла
     * */
    configRegistrationFromFile(filename){
        logger.write("debug", `Загрузка конфигурации утилиты из файла: ${filename}`);
        let self = this;
        let data;
        try {
            data = JSON.parse(fs.readFileSync(filename));
        }
        catch(e){
            logger.write(`warning`, `Ошибка при загрузке конфигурации из файла ${filename}`, e);
            return Promise.reject();
        }
        logger.write("debug", `Успешно.`);
        self.__configs[data.name] = data;
        return Promise.resolve(self.__configs[data.name]);
    }

    /**
     * Метод для инициализации первичного состояния контроллера утилит
     * */
    init(configDirectory = './Utilits/configs'){
        let self = this;
        logger.write("debug", `Инициализация контроллера утилит.`);

         return interfaceController.interfaceRegistrationFromDir("./Utilits/interfaces")
             .then(() =>  promiseReadDir(configDirectory))
             .then(filelist => {
                 return Promise.all(filelist
                     .filter(file => file.match(/(.+?)\.json$/))
                     .map(file => self.configRegistrationFromFile(file))
                 );
             })
    }

    /**
     * Метод для загрузки конфигурации утилиты из хранилища по имени
     * */
    __loadConfig(cName){
        let self = this;
        return self.configRegistrationFromFile(`./Utilits/configs/${cName}.json`)
    }

    async __getRes(uName, rName){
        let self = this;
        let uInt = await interfaceController.getInterfaceByName(uName)
        self.__logger.write("debug", `Инициализация утилиты ${uName} с конфигурацией ${rName}.`);
        if(!self.__exUtilits[uName].utilits[rName]){
            self.__exUtilits[uName].utilits[rName] = new self.__exUtilits[uName].class(uInt, self.__configs[rName].config);
            self.__exUtilits[uName].utilits[rName].getInterface = () =>
                Promise.resolve(uName).then(name => interfaceController.getInterfaceByName(name));
            await self.__exUtilits[uName].utilits[rName].init();
        }
        return self.__exUtilits[uName].utilits[rName];
    }

    /**
     * Метод для получения реализации утилиты (утилита с конкретной конфигурацией)
     * @param {string} uName - имя утилиты (например, pg)
     * @param {string} rName - имя конфигурации (например, gag)
     * */
    async __getRelease(uName,rName){
        if(this.__exUtilits[uName].utilits[rName]) {
            logger.write("debug", `Утилита ${uName} c конфигурацией ${rName} существует.`);
            return this.__exUtilits[uName].utilits[rName];
        }
        else{

            if(!this.__configs[rName]){
                logger.write("debug", `Загрузка конфигурации ${rName}.`);
                await this.__loadConfig(rName);
            }
            return await this.__getRes(uName, rName);
        }
    }

    /**
     * Метод для получения утилиты (внешний)
     *  @param {string} uName - имя утилиты
     *  @param {string} configName - имя конфигурации
     * */
    async getUtil(configName){
        let self = this;
        let cInt;
        if(self.__configs[configName])
            cInt = self.__configs[configName];
        else
            cInt = await self.__loadConfig(configName);

        logger.write("debug", `Получение утилиты ${cInt.type} c конфигурацией ${configName}.`);
        if (!self.__exUtilits[cInt.type]) {
            logger.write("debug", `Инициализация утилиты ${cInt.type}.`);
            self.__exUtilits[cInt.type] = {
                class: require(`./Utilits/${cInt.type}.js`)[cInt.type],
                utilits: {}
            };
        }
        return await self.__getRelease(cInt.type, configName);
    }
}

let utilits = new Utilits();

export {utilits};