'use strict';
let config = require('../config');
let Filter = require('./filter');

/**
 * Класс отвечающий за работу с сервером приложения
 */
class DataRouter {

    /**
     * Функция получает файл в завизимости от параметров переданных в data
     * @param options - параметры запроса
     * @param options.object - объект системы к которому делается запрос (например "query")
     * @param options.method - используемый метод (по умолчанию get)
     * @param options.filter - фильтр в формате клиента
     * @returns {Promise}
     */
    static async getServerData(options) {
        //console.log(JSON.stringify(options));

        //let {object, objViewClient, method = 'get', filter: filterParams, fields, relation = {}, pagination = {}, orderBy = [], token} = options;
        let {object, objViewClient, method = 'get', queryParams = {}, fields, token} = options;

        if (token) queryParams.token = token;
        // форматируем параметры с клиента в параметры запроса к серверу
        //let queryParams = this._makeParamsForQuery(filterParams, relation, pagination, orderBy);
        if (fields) {
            queryParams.fields = fields;
        }
        let serverData = await objView.query(objViewClient + "." + object, method, queryParams, token);
        // todo there should not be null
        if (serverData.records){
            delete serverData.records[null];
        }
        return Promise.resolve(serverData);
    }

    static async deleteServerData(options) {

        let {object, objViewClient, method = 'delete', queryParams = {}, token} = options;

        if (token) queryParams.token = token;
        // форматируем параметры с клиента в параметры запроса к серверу
        //let queryParams = this._makeParamsForQuery(filterParams);
        // query
        return objView.query(objViewClient + "." + object, method, queryParams, token);

    }

    static async insertServerData(options) {

        let {object, objViewClient, method = 'insert', values, token} = options;

        let queryParams = {};
        if (token) queryParams.token = token;
        queryParams.values = values;
        return objView.query(objViewClient + "." + object, method, queryParams, token);

    }

    static async updateServerData(options) {

        let {object, objViewClient, method = 'update', queryParams = {}, values, token} = options;

        if (token) queryParams.token = token;
        // форматируем параметры с клиента в параметры запроса к серверу
        //let queryParams = this._makeParamsForQuery(filterParams);
        queryParams.values = values;
        return objView.query(objViewClient + "." + object, method, queryParams, token);

    }

    static async copyServerData(options) {

        let {object, objViewClient, method = 'copy', queryParams = {}, token} = options;

        if (token) queryParams.token = token;
        // форматируем параметры с клиента в параметры запроса к серверу
        //let queryParams = this._makeParamsForQuery(filterParams);
        return objView.query(objViewClient + "." + object, method, queryParams, token);

    }

    static async getInterface(objectView, object, token) {
        // TODO заплатка для получения интерфеса для самой предметной области а не для какого-то ее объекта
        let path = '';
        //if (token) queryParams.token = token;
        if (!object) {
            path = objectView;
        } else {
            path = objectView + "." + object;
        }
        return await objView.query(path, 'getInterface',{}, token);
    }


    static async performCustomAction(options) {

        let {object, objViewClient, method, queryParams = {}, token, values} = options;

        // форматируем параметры с клиента в параметры запроса к серверу
        //let queryParams = this._makeParamsForQuery(filterParams);
        if (values) queryParams.values = values;
        if (token) queryParams.token = token;

        return objView.query(objViewClient + "." + object, method, queryParams, token);

    }

    static async execDirectAction(object, method, parameters, token) {
        if (token) parameters.token = token;
        return objView.query(object, method, parameters, token);
    }

    /**
     * Функция по параметрам фильтра переданным с клиента создает объект фильтра понятный серверу
     * @param filterParams
     * @returns {{filter}|*}
     */
    static _makeParamsForQuery(filterParams, relation, pagination, orderBy) {
        if (filterParams !== undefined || pagination !== undefined || orderBy !== undefined) {
            let filter = new Filter();
            return filter.prepareParams(filterParams, relation, pagination, orderBy);
        } else {
            return {};
        }

    }

}

module.exports = DataRouter;