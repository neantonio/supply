import {logger} from "../../../Logger/controller";
import * as textM from "../util/TextM";
import {StarterDB} from "./starterDB";
import {UserDependentView} from "../../../UserDependentView";
import {Authentificate} from "./subservices/Authentificate";
import {RightChecker} from "./subservices/RightChecker";
import {QueryDataInformer} from "./QueryDataInformer";
import {ActionHistory} from "./subservices/ActionHistory";
import {IntrospectingUtil} from "../util/IntrospectingUtil";
import {interfaceFormer} from "./interfaceFormer"
const NodeCache = require("node-cache");


let myCache = new NodeCache({checkperiod: 0, useClones: true});

export class Secure {
    constructor(string, view) {
        this.view = this._constructView(string, view);
        this.authentificate = new Authentificate(this.view);
        this.interfaceFormer = new interfaceFormer(this.view);
    }

    _constructView(string, view) {
        if (string !== null && string !== undefined) {
            return new UserDependentView(string);
        } else {
            return view;
        }
    }

    async init() {
        await this.view.init();
        let starterDB = new StarterDB(this.view);
        await starterDB.populate();
        await IntrospectingUtil.init(this.view);
    }


    async getInterface(tokenValue, objectDescription) {
        this._checkToken(tokenValue);
        logger.write(`debug`, `Secure.getInterface: Токен поддтвержден.`);

        /*
        let cacheKey = `${tokenValue}_${objectDescription}`;
        let cachedInterface = myCache.get(cacheKey);
        if (cachedInterface) {
            return cachedInterface;
        }
        */


        logger.write(`debug`, `Secure.query. Получение общего интерфейса.`);
        let commonInterface = await this.view.getInterface();
        logger.write(`debug`, `Secure.query. Общий интерфейс получен.`);

        /*
        logger.write(`debug`, `Secure.getInterface: Формирование dataInformer.getInfo.`);
        let queryDataInformer = await new QueryDataInformer(this.view).getInfo(objectDescription, null, tokenValue);
        logger.write(`debug`, `Secure.getInterface: dataInformer.getInfo сформирован.`);
        */

        logger.write(`debug`, `Secure.getInterface: Обрезание прав.`);
        // let cuttedInterface = await new RightChecker(queryDataInformer).cutInterface(objectDescription);
        let cuttedInterface = await this.interfaceFormer.getObjectInterfaceByToken(tokenValue, commonInterface, objectDescription);
        //myCache.set(cacheKey, cuttedInterface);
        logger.write(`debug`, `Secure.getInterface: Права обрезаны.`);
        return cuttedInterface;
    }

    __getObjectParameters(object, method, objectView = this.view.subscriberView){
        let words = object.split(".");
        if(words.length > 1){
            let ov = words.shift();
            if(!objectView.__objectViews[ov]){
                throw `В описании мультиадаптера отсутствует описание мульитиадаптера '${ov}'.`;
            }
            return this.__getObjectParameters(words.join(","), method, objectView.__objectViews[ov]);
        }
        else{
            if(!objectView.__objects[object]){
                throw `В описании мультиадаптера отсутствует объект '${object}'.`;
            }
            return objectView.__objects[object].__interface.methods[method].parameters.map(parameter => parameter.name);
        }
    }

    __addTokenToParameters(parameters, token){
        if(!parameters.parameters){
            parameters.parameters = {
                token: token
            };
        }
        else{
            parameters.parameters.token = token;
        }
    }



    async query(object, method, parameters = {}, tokenValue) {
        logger.write(`log`, `Secure.query: Начало обработки запроса для метода '${method}' объекта '${object}'.`);
        //logger.write(`debug`, `Secure.query: Начало обработки запроса.`);
        if (method === "getInterface") {
            logger.write(`debug`, `Secure.query Получение интерфейса.`);
            let i = await this.getInterface(tokenValue, object);
            logger.write(`log`, `Secure.query: Интерфейс успешно получен.`);
            return i;
        }

        logger.write(`debug`, `Secure.query: Получение токена.`);
        this._checkToken(tokenValue);
        logger.write(`debug`, `Secure.query: Токен получен.`);


        logger.write(`debug`, `Secure.query: Формирование dataInformer.`);
        let queryDataInformer = await new QueryDataInformer(this.view).getInfo(object, method, tokenValue);
        logger.write(`debug`, `Secure.query: dataInformer сформирован.`);

        logger.write(`debug`, `Secure.query: Формирование истории действий.`);
        let actionHistory = new ActionHistory(this.view, queryDataInformer);
        logger.write(`debug`, `Secure.query: История действий сформирована.`);

        logger.write(`debug`, `Secure.query: Проверка прав.`);
        //let filteredParameters = new RightChecker(queryDataInformer).getFilteredParameteres(object, method, parameters);
        await this.interfaceFormer.modifyParametersForObjectMethodByToken(object, method, parameters, tokenValue);
        logger.write(`debug`, `Secure.query: Проверка прав пройдена.`);

        logger.write(`debug`, `Secure.query: Фиксация старых значений.`);
        await actionHistory.writeOldValues(object, method, parameters);
        logger.write(`debug`, `Secure.query: Старые значения зафиксированы.`);

        this.__addTokenToParameters(parameters, tokenValue);

        logger.write(`debug`, `Secure.query: Запрос к объекту.`);
        let entityFromBD = await this.view.query(object, method, parameters, tokenValue);
        logger.write(`debug`, `Secure.query: Запрос к объекту успешно выполнен.`);

        logger.write(`debug`, `Secure.query: Подтверждение изменений.`);
        if(this.__getObjectParameters(object, method).indexOf("values") >= 0) {
            await actionHistory.commit(entityFromBD);
        }
        else{
            await actionHistory.commit(null);
        }
        logger.write(`debug`, `Secure.query: Изменений подтверждены.`);
        logger.write(`log`, `Secure.query: Метод '${method}' объекта '${object}' выполнен.`);

        return entityFromBD;
    }

    async login(user, password) {
        return this.authentificate.login(user, password);
    }


    async logout(token) {
        return this.authentificate.logout(token);
    }


    _checkToken(tokenValue) {
        if (tokenValue === undefined || tokenValue === null) {
            logger.write("error", `${textM.message.notToken}, потому что не передан токен`, new Error());
            throw new Error(`${textM.message.notToken}.`);
        }
    }

}
