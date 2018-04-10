import {UniConverter} from './UniConverter';
import {subscriberView} from "./subscriberView";
import * as afs from 'async-file';
import {logger} from './Logger/controller'

class UserDependentView {

    constructor(name){
        this.__subs = {};
        // создаём делегата
        this.subscriberView = new subscriberView(name);
    }

    /**
     * Инициализация объекта
     * @returns {Promise.<void>}
     */
    async init(){
        // инициализируем делегата
        await this.subscriberView.init();
        this.__subs = JSON.parse(await afs.readFile('./userDependentSubs.json'));
    }

    async query(object, method, parameters = {}, token){
        // выполняем основное действие, сохраняем результат
        logger.write(`debug`, `UserDependentView.query: выполнение запроса к subscriberView.`);
        let result = await this.subscriberView.query(object, method, parameters);
        logger.write(`debug`, `UserDependentView.query: запрос выполнен.`);
        // получаем информацию о пользователе
        if (token && this.__subs[object] && this.__subs[object][method] && this.__subs[object][method].length){

            logger.write(`debug`, `UserDependentView.query: получение информации о пользователе.`);
            let userInfo = await this.getUserInfo(token);
            logger.write(`debug`, `UserDependentView.query: информация получена.`);

            // заворачиваем аргументы - результат работы основной функции и инфу о пользователе
            logger.write(`debug`, `UserDependentView.query: компрессия записей.`);
            let wrappedArguments = {
                new: {records: UniConverter.compressRecords(result.records, 'new.records.')},
                addConst: {user: userInfo.fio, email: userInfo.email}
            };
            logger.write(`debug`, `UserDependentView.query: записи сжаты.`);

            // выполняем метод по подписке

            logger.write(`debug`, `UserDependentView.query: начало выполнения подписчиков.`);
            for (let subscriber of this.__subs[object][method]){
                logger.write(`debug`, `UserDependentView.query: конвертирование сжатых записей по отношению.`);
                let converted = UniConverter.convertByRelation(wrappedArguments, subscriber.relation);
                logger.write(`debug`, `UserDependentView.query: конвертация закончена.`);

                logger.write(`debug`, `UserDependentView.query: запуск подписчика.`);
                await this.subscriberView.query(subscriber.object, subscriber.method, converted);
                logger.write(`debug`, `UserDependentView.query: подписчик закончил работу.`);
            }

            logger.write(`debug`, `UserDependentView.query: подписчики выполнены.`);
        }
        return result;
    }

    async getInterface(){
        return await this.subscriberView.getInterface();
    }

    /**
     * Возвращает данные пользователя по его токену.
     * @param token Токен авторизации
     * @returns {Promise.<{user, fio, email}>} Информация о пользователе (логин, фио, мыло)
     */
    async getUserInfo(token){
        let tokenFilter = {
            comparisons:{
                'token':{left:{type:'field', value: 'ref.users_tokens.token'}, right:{type:'value', value: token}, sign:'equal'}
            },
            tree:{'and':['token']}
        };
        let info = Object.values((await this.subscriberView.query('role.users', 'get', {filter:tokenFilter, fields:[]})).records)[0];
        return {
            user: info.fields['user'],
            fio: info.fields['description'],
            email: info.fields['email']
        };
    }
}

export {UserDependentView as UserDependentView}