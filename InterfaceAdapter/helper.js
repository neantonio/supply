let builder = require('./builder');

let Page = builder.Response;
let Layout = builder.Layout;
let Panel = builder.Panel;
let Grid = builder.Grid;
let Popup = builder.Popup;
let Tabs = builder.Tabs;
let Tab = builder.Tab;
let Form = builder.Form;
let Field = builder.Field;
let Button = builder.Button;

let dataRouter = require('./routers/dataRouter');
let tmplRouter = require('./routers/tmplRouter');
let assign = require('lodash.assign'); // метод для дополнения объекта новыми свойствами
import {utils} from './utils';
/**
 * Класс для построения таблицы справочника, включает в себя получение данных
 */
export class StandartListForm {
    constructor(clientData, gridOptions, page) {
        /**
         * Данные, с данными для запроса
         * @member
         * @type {object}
         */
        this.clientData = clientData;
        /**
         * Страница, в которую строится таблица
         * @member
         * @type {Page}
         */
        this.page = page;
        /**
         * Путь
         * @member
         * @type {string}
         */
        this.path = clientData.path;
        /**
         * Массив дополнительных кнопок
         * @member
         * @type {array}
         */
        this.buttons = gridOptions.buttons || [];
        /**
         * События к таблице
         * @member
         * @type {object}
         */
        this.events = gridOptions.events || {};
        this.events.onDblClick = 'editRecord';
        this.gridOptions = gridOptions;
    }

    /**
     * Функция переопределяет стандартные кнопки и добавляет новые (сравнение идет по id)
     * @param {array} buttons - массив новых и или переопределенных стандартных кнопок
     * @returns {array} - массив кнопок для тулбара таблицы
     */
    extendStandartButtons(buttons) {

        // стандартные кнопки, которые по идее есть у всех таблиц
        let standartButtons = [];
        // пройдемся по всем кнопкам переопределяя стандартные и добавляя новые
        buttons.forEach((btn) => {

            let itsNewButton = true;
            // переопределим стандартные кнопки
            for (let i = 0; i < standartButtons.length; i++) {
                let standartBtn = standartButtons[i];
                if (standartBtn.id === btn.id) {
                    assign(standartBtn, btn);
                    itsNewButton = false;
                    break;
                }
            }
            // если это новая кнопка - добавим её
            if (itsNewButton) {
                standartButtons.push(btn);
            }

        });

        return standartButtons;
    }

    async render() {
        try {
            //юзаем запрашиватель данных
            let dataObject = await this.gridOptions.dataGetter(this.gridOptions, this.clientData);
            // todo убираем хрень которую возвращает сервер для иерархических справников
            delete dataObject.gridRecords[null];
            if (this.gridOptions.dataRenderer) {
                dataObject = this.gridOptions.dataRenderer(dataObject);
            }
            let headID = '';
            if (this.clientData.data.queryParams && this.clientData.data.queryParams.filter && this.clientData.data.queryParams.filter.comparisons['FK'] !== undefined) {
                headID = this.clientData.data.queryParams.filter.comparisons['FK'].right.value
            }
            if (this.clientData.data.queryParams && this.clientData.data.queryParams.filter && this.clientData.data.queryParams.filter.comparisons[dataObject.refCol] !== undefined) {
                headID = this.clientData.data.queryParams.filter.comparisons[dataObject.refCol].right.value
            }
            //дополняем свойства
            let properties = this.gridOptions.properties || {};
            properties.PK = dataObject.PK;
            properties.refCol = dataObject.refCol;
            properties.headID = headID;
            properties.refToExpand = dataObject.refToExpand;
            let grid = new Grid({
                path: this.path,
                id: this.gridOptions.id || this.gridOptions.type,
                properties: properties,
                recordsData: dataObject.gridRecords,
                columnsData: dataObject.gridColumns,
                page: this.page,
                buttons: dataObject.buttons,
                events: dataObject.events,
                dropListsToLoad : this.gridOptions.dropListsToLoad || [],
                columnsOrder : this.gridOptions.columnsOrder,
                hiddenColumns: this.gridOptions.hiddenColumns
            });
            return grid;
        } catch (e) {
            console.log('Ошибка в dataGetter: ' + e);
        }
    }


}

/**
 * Класс для построения формы справочника, включает в себя получение данных
 */
export class StandartElementForm {

    constructor(clientData, formOptions, page) {

        this.path = clientData.path;
        this.object = utils.getObjectName(this.path);
        this.action = clientData.action;
        //this.filter = clientData.data.filter;
        this.queryParams = clientData.data.queryParams || {};
        // id главного объекта (нужно для редактирования ТЧ)
        this.headID = clientData.data.headID || '';
        // id главного объекта (нужно для редактирования кросс таблицы фильров по действиям)
        this.headIDForFiltersAction = clientData.data.headIDForFiltersAction || '';

        // // id таблицы для которой запрашиваем форму элемента
        this.parentTableID = clientData.data.parentTableID || '';

        this.type = clientData.data.type;

        this.token = clientData.token;
        this.objView = clientData.objView;

        /**
         * Ссылка на главный объект страницы для которого формируется форма
         */
        this.page = page;

        /**
         * Дополнительные поля для запроса (description, реквизиты ссылочных типов и т.д.)
         * @type {Array}
         */
        this.queryOptionsFields = [];

        /**
         * Данные формы (запись)
         * @type {Array}
         */
        this.formData = [];
        /**
         * Поля формы
         * @type {{}}
         */
        this.formFields = {};

        /**
         * Кнопки popup
         * @type {Array}
         */
        this.popupBtns = formOptions.popupBtns || [];
        /**
         * Поля которым нужно поставить параметр static и не подгружать их полностью с сервера по инициативе клиента
         * @type {Array}
         */
        this.dropListsToLoad = formOptions.dropListsToLoad || [];

        /**
         * Табличные части
         * @type {Array}
         */
        this.refs = [];

        /**
         * Название поля являющееся первичным ключом
         * @type {string}
         */
        this.PK = '';
        /**
         * Имя поля в котором хранится id главного элемента (если это поле заполнено, то это форма редактирования ТЧ)
         * @type {string}
         */
        this.refID = '';
        this.commonInterface = null;

        this.refsLoadAfter = formOptions.refsLoadAfter || [];
        this.filterFields = formOptions.filterFields || {};

    }

    /**
     * Метод возвращает popup с формой и табличными частями
     * @returns {Promise.<*>}
     */
    async render() {
        await this._getObjectInterface();
        await this._getObjectData();

        try {
            let content = await this._createContent();
            return content;
        } catch (err) {
            console.log("Ошибка при формировании popup'a для объекта " + this.object + ": " + err.stack);
            throw("Ошибка при формировании popup'a для объекта " + this.object);
        }
    }

    async _getObjectInterface() {
        try {
            // получаем мета-данные о справочнике
            this.commonInterface = await dataRouter.getInterface(this.objView, null, this.token);
            let interfaceData = utils.getObjectInterface(this.commonInterface, this.object);

            // ищем внешние ключи и ссылки
            for (let col in interfaceData.fields) {
                if (interfaceData.fields[col].type === 'link') {
                    this.queryOptionsFields.push(col + '.description')
                }
                if (interfaceData.fields[col].type === 'ref') {
                    this.refID = col;
                }
                if (interfaceData.fields[col].isPrimary) {
                    this.PK = col;
                }
            }

            this.refs = interfaceData.refs;
            this.formFields = interfaceData.fields;
        } catch (err) {
            throw('Ошибка при получении интерфейса объекта ' + this.object + ' : ' + err);
        }
    }

    async _getObjectData() {
        // делаем запрос на получение данных только если указан фильтр
        if (this.queryParams && this.queryParams.filter) {
            // формируем параметры запроса на сервер
            let queryOptions = {
                object: this.object,
                method: this.action,
                fields: this.queryOptionsFields,
                queryParams: this.queryParams,
                token: this.token,
                objViewClient : this.objView
            };
            try {
                let serverData = await dataRouter.getServerData(queryOptions);
                this.formData.push(serverData.records[this.queryParams.filter.comparisons[this.PK].right.value]);
            } catch (err) {
                // пускаем ошибку дальше, продолжить не можем
                throw 'Ошибка при получении данных объекта ' + this.object + ' : ' + err;
            }
        }
    }

    async _createContent() {
        let content;
        //если нет табличных частей - то просто делаем форму
        if (this.refs.length === 0) {
            content = this._buildForm();
        } else {
            content = await this._buildFormWithTables();
        }
        // Пробуем возвращать только content (form или tabs) которые уже будем встраивать в panel
        return content;
    }

    /**
     * Функция возвращает элемент Tabs (вкладки с вложенными Form и несколькими Grid)
     * @returns {Promise.<Tabs>}
     * @private
     */
    async _buildFormWithTables() {

        let tabs = new Tabs({
            path: this.path,
            page: this.page
        });

        let tabTitle = "Основное";

        let tab = new Tab({
            path: this.path,
            page: this.page,
            properties: {
                "header": tabTitle
            }
        });
        tabs.appendChild(tab);
        let layout = new Layout({
            path: this.path,
            page: this.page
        });
        tab.appendChild(layout);

        let panel2 = new Panel({
            path: this.path,
            page: this.page
        });
        layout.appendChild(panel2);

        let options = {
            path: this.path,
            page: this.page,
            fields: this.formFields,
            record: this.formData,
            dropListsToLoad: this.dropListsToLoad,
            filterFields: this.filterFields,
            properties: {}
        };
        if (this.refID) {
            options.properties.refID = this.refID;
        }
        if (this.headID) {
            options.properties.headID = this.headID;
        }
        if (this.parentTableID) {
            options.properties.parentTableID = this.parentTableID;
        }
        let form = new Form(options);
        panel2.appendChild(form);

        for (let i in this.refs) {
            // получаем интерфейс объекта из уже полученного общего интерфейса предметной области
            //let refData = await dataRouter.getInterface(this.objView, this.refs[i], this.token);
            let refData = utils.getObjectInterface(this.commonInterface, this.refs[i]);
            let tabTitle = refData.description;
            let refCol = utils.getRefCol(refData.fields);
            let tabEvents = {
                beforeShow: 'beforeShow'
            };
            if (this.refsLoadAfter.indexOf(this.refs[i]) >= 0) {
                tabEvents.afterShow = 'afterShow';
            }
            let tab = new Tab({
                path: this.path + '-refs-' + this.refs[i],
                page: this.page,
                type: this.type,
                properties: {
                    "header": tabTitle
                },
                events: tabEvents
            });
            tabs.appendChild(tab);
            if (this.refsLoadAfter.indexOf(this.refs[i]) >= 0) break;
            //фильтр для запроса табличных частей
            let filterRef = {};
            if (this.queryParams && this.queryParams.filter && this.queryParams.filter.comparisons[this.PK]) {
                //filterRef[refCol] = this.queryParams.filter.comparisons[this.PK].right.value;
                this.queryParams.filter.comparisons[refCol] = {
                    left: {
                        type :'field',
                        value: refCol
                    },
                    right: {
                        type :'value',
                        value: this.queryParams.filter.comparisons[this.PK].right.value
                    },
                    sign: 'equal'
                };
                this.queryParams.filter.tree = {
                    and : [refCol]
                };
                delete this.queryParams.filter.comparisons[this.PK];

                /*filterRef = {
                    comparisons: {
                        [refCol] : {
                            left: {
                                type :'field',
                                value: refCol
                            },
                            right: {
                                type :'value',
                                value: this.queryParams.filter.comparisons[this.PK].right.value
                            },
                            sign: 'equal'
                        }
                    },
                    tree: {
                        and : [refCol]
                    }
                }*/
            }
            /*let queryParamsNewFilter = {
                filter: filterRef,
                parameters: this.queryParams.parameters || {}
            };*/
            if (Object.keys(filterRef).length === 0) filterRef = undefined;
            let handler = tmplRouter.getHandler({
                action: 'get',
                path: this.path + '-refs-' + this.refs[i],
                data: {
                    type: 'listForm',
                    //filter: filterRef,
                    queryParams: this.queryParams

                }
            });
            // запускаем обработчик формирования формы, в процессе идет обращение к серверу
            let handlerOptions = {
                action: 'get',
                path: this.path + '-refs-' + this.refs[i],
                token: this.token,
                objView : this.objView,
                data: {
                    type: 'listForm',
                    //filter: filterRef,
                    queryParams: this.queryParams
                },
                commonInterface : this.commonInterface
            };
            // при создании/удалении записей в виде кросс таблицы, передадим в нее id главного объекта
            if (this.headIDForFiltersAction) {
                handlerOptions.data.headIDForFiltersAction = this.headIDForFiltersAction;
            }
            let result = await handler(handlerOptions);
            //выковыриваем записи
            if (result.content.length) {
                this.page.content.push(result.content[0]);
            }
            //выковыриваем элементы
            tab.elements.push(result.elements[0]);
        }

        return tabs;

    }

    /**
     * Функция возвращает элемент Form
     * @returns {Form}
     * @private
     */
    _buildForm() {

        let options = {
            path: this.path,
            page: this.page,
            fields: this.formFields,
            record: this.formData,
            dropListsToLoad: this.dropListsToLoad,
            filterFields: this.filterFields,
            properties: {}
        };
        if (this.refID) {
            options.properties.refID = this.refID;
        }
        if (this.headID) {
            options.properties.headID = this.headID;
        }
        if (this.parentTableID) {
            options.properties.parentTableID = this.parentTableID;
        }

        return new Form(options);

    }

}
