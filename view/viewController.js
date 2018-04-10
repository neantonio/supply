let globalConfig = require('../InterfaceAdapter/config');
let viewConfig = require('./config/controller');

// контроллер модуля view
export class ViewController {
    constructor(objView) {
        // ссылка на объект для взаимодействия с конфигом
        this.config = viewConfig;
        // ссылка на объект для взаимодействия с предметной обоастью
        this.objView = objView;
    }

    // инициализирует модуль view
    async init() {

    }


    /**
     * Метод для передачи запроса на обработку
     * @param queryName - имя запроса
     * @param queryParams - остальные параметры
     */
    async query(queryName = '', queryParams = {}) {

        // получаем объект обработчик запроса
        let queryHandler = this._getHandlerForQuery(queryName, queryParams);
        // если обработчика нет
        if (!queryHandler) return null;
        // обработчик запроса отдает свое представление
        let view = await queryHandler.getView();

        return view;

    }


    /**
     * Метод получает имя запроса и отдает соответствующий обработчик. Если имя запроса неизвестно, возвращает null.
     * @param queryName - имя запроса
     * @private
     */
    _getHandlerForQuery(queryName = '', queryParams = {}) {

        let queryHandler = null;

        if (queryName === 'getForm') {
            queryHandler = new Form(queryParams, this.config, this.objView);
        } else if (queryName === 'getMenu') {
            queryHandler = new Menu(queryParams, this.config, this.objView);
        }

        return queryHandler;

    }

}

// абстрактный класс обработчиков запросов (вместо интерфейса)
class ViewQueryHandler {

    // внутренний метод для проверки параметров обработчика, должен вызываться в начале метода getView
    _checkParams() {

    }

    // все обработчики запросов в модуле view возващают некоторое представление
    async getView() {

    }

}

class Form extends ViewQueryHandler {
    constructor(queryParams, configController, objView) {
        super();
        // имя объекта предметной области
        this.object = queryParams.object || null;
        // тип формы
        this.formType = queryParams.formType || null;
        // объект для доступа к конфигу модуля view (нужен для определения класса для построения формы)
        this.viewConfig = configController;
        // объект для обращения к предметной области
        this.objView = objView;
        // объект реализующий построение конкретной формы
        //this.concreteForm = options.concreteForm || null;
    }

    _checkParams() {
        let result = true;
        if (!this.object || !this.formType) result = false;
        return result;
    }

    async getView() {
        let view = null;
        if (this._checkParams()) {
            let concreteForm = this._getConcreteForm();

            if (concreteForm) {
                view = concreteForm.render();
            }
        }
        return view;
    }

    /**
     * Функция возвращает конкретный класс обработчик построения конкретного вида формы(например ReferenceListForm, ReferenceElementForm, QueryListForm и т.д.)
     * @private
     */
    async _getConcreteForm() {

        let concreteForm = null;

        // тут должен быть код определения класса построения формы по this.object и this.formType
        //let controlClasses = view.getControlClasses();

        // получим интерфейс объекта
        let objectInterface;
        try {
            // TODO избавиться от supply
            objectInterface = await this.objView.query('supply.' + this.object, 'getInterface');
        } catch (err) {
            console.log('Ошибка при получении интерфейса для объекта ' + this.object);
            return concreteForm;
        }

        let objectType = objectInterface.tableDesc.object.common;

        let formRendererClass = this._getFormRendererClass(objectType);

        return concreteForm;

    }

    _getFormRendererClass(objectType) {

        let сontrolClass = null;
        // класс для построения формы конкретного экземпляра объекта
        сontrolClass = this.viewConfig.get('objects.' + objectType + '.objects.' + this.object + '.forms.' + this.formType + '.controlClass');
        // класс для построения формы для типы объекта
        if (!сontrolClass){
            сontrolClass = this.viewConfig.get('objects.' + objectType +'.forms.' + this.formType + '.controlClass');
        }


        if (сontrolClass) {

        }

        return сontrolClass;


        // let constructorFunc;
        // if (customControlClass) {
        //     constructorFunc = controlClasses[customControlClass];
        //     if (constructorFunc) return new constructorFunc(); // возвращаем экземпляр класса формы
        // } else if (standartControlClass) {
        //     constructorFunc = controlClasses[standartControlClass];
        //     if (constructorFunc) return new constructorFunc(); // возвращаем экземпляр класса формы
        // } else {
        //     throw('Нет формы!');
        // }

    }

}

class Menu extends ViewQueryHandler {
    constructor() {
        super();
    }

    _checkParams() {

    }

    getView() {

    }
}


