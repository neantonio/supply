
import {interfaceController} from './commonInterfaces/controller';
import {utilits} from './utilityController';
import * as fs from 'fs';
import {System} from 'es6-module-loader'
import {logger} from './Logger/controller'
//import {adapter as reference_pg} from './Adapters/reference_pg'

class controller{

    constructor(){
        this.__adapters = {
            //reference_pg: reference_pg
        }
    }

    /**
     * Рекурсивный метод для получения адаптера для ближайшего по иерархии объекта.
     * На вход принимает описание интерфейса объекта @oInt и описание интерфейса утилиты @uInt.
     * В случае удачного выполнения возвращает класс для адаптера.
     * */
    __recGetAdapter(oInt, uInt){
        // Директория, где хранятся описания адаптеров
        let workdir = "./Adapters/";

        // Если адаптер уже существует, просто возвращаем его
        if(this.__adapters[`${oInt.name}_${uInt.name}`]) {
            logger.write(`debug`, `Существует адаптер для объекта ${oInt.name} с типом ${uInt.name}`);
            return this.__adapters[`${oInt.name}_${uInt.name}`];
        }

        // Если существует модуль адаптера для текущегго объекта
        if(fs.existsSync(`${workdir}${oInt.name}_${uInt.name}.js`)) {
            logger.write(`debug`, `Загрузка адаптера для объекта ${oInt.name} с типом ${uInt.name}`);
            // Загрузить модуль для адаптера
            let module = require(`${workdir}${oInt.name}_${uInt.name}.js`);
            // Если модуль экспортирует описание адаптера
            if(module.adapter) {
                // Запомнить и вернуть
                this.__adapters[`${oInt.name}_${uInt.name}`] = module.adapter;
                logger.write(`debug`, `Адаптер для объекта ${oInt.name} с типом ${uInt.name} успешно загружен`);
                return Promise.resolve(module.adapter);
            }
            else {
                // Вернуть сообщение об ошибке
                logger.write(`warning`, `Найденный модуль не содержит описания для адаптера`, new Error());
                return Promise.reject(`Найденный модуль не содержит описания для адаптера`);
            }
        }

        // Если нет адаптера для объекта и объект не имеет родителя, вернуть ошибку
        if(!oInt.common) {
            logger.write(`warning`, `Адаптер не найден.`, new Error());
            return Promise.reject(`Адаптер не найден.`);
        }

        // В противном случае вернуть адаптер для родительского объекта
        logger.write(`debug`, `Попытка поиска адаптера для родителя. Объект ${oInt.common}`);
        return interfaceController.getInterfaceByName(oInt.common)
            .then(parentInt => this.__recGetAdapter(parentInt, uInt));
    }

    /**
     * Метод для получения адаптера объекта
     * */
    async getAdapter(oInt, uName){
        logger.write(`debug`, `Получение адаптера для объекта ${oInt.name}`);
        let util = await utilits.getUtil(uName);
        let uInt = await util.getInterface();
        return await this.__recGetAdapter(oInt, uInt);
    }


}

let adapterController  = new controller();

export {adapterController};