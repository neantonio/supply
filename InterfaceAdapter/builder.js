let uuid = require('uuid');
let dataRouter = require('./routers/dataRouter');
let assign = require('lodash.assign'); // метод для дополнения объекта новыми свойствами
import {_} from 'lodash';
import {utils} from './utils';
import {getConfigParam} from './templates/configs/elementForm';

class Response {
    constructor() {
        this.elements = [];
        this.content = [];
        this.code = {};
    }

    appendChild(el) {
        this.elements.push(el.prepareForAppending());
    }

    makeContent(metaData, recordsData) {
        let records = [];
        let fk = {};
        for (let i  in recordsData) {
            let record = {};
            for (let col in recordsData[i].fields) {
                if (metaData[col] !== undefined) {
                    if (metaData[col].type === 'link') { // это ссылка (внешний ключ)
                        if (fk[col] === undefined) {
                            fk[col] = {};
                        }
                        record[col] = [];
                        for (let fKeysIndex in recordsData[i]['fields'][col]) {
                            // todo another fix with null index
                            if (fKeysIndex === 'null') continue;
                            // TODO костыль для иерархии
                            //if (col === 'parentID') {
                            //    record[col].push(recordsData[i]['fields'][col][fKeysIndex].ID);
                            //} else {
                            record[col].push(recordsData[i]['fields'][col][fKeysIndex]['fields'].ID);
                            fk[col][recordsData[i]['fields'][col][fKeysIndex]['fields'].ID] = recordsData[i]['fields'][col][fKeysIndex]['fields'].description;
                            //}
                        }
                    } else if (metaData[col].type === 'ref' && typeof metaData[col] === 'object') {
                        record[col + '*description'] = recordsData[i]['fields'][col].description;
                    } else {
                        record[col] = recordsData[i]['fields'][col];

                    }
                } else {
                    if (col === 'style') {
                        record[col] = recordsData[i]['fields'][col];
                    }
                }
            }
            records.push(record);
        }
        return {
            records: records,
            fk: fk
        };
    }

    /**
     *  Добавляет в elements структуру Popup --> Layout --> Panel
     *  options.path - путь с клиента
     *  options.width - ширина popup'а
     *  options.height - длина popup'a
     *  options.header - заголовок popup'a
     *  options.panelsCount - 1 или 2 (по умолчанию 1)
     * @returns объект с панелями
     */
    buildPopupCarcass(options) {

        let width = options.width || 800;
        let height = options.height || 640;
        let header = options.header || '';
        let panelsCount = options.panelsCount || 1;

        let popup = new Popup({
            id: options.id,
            path: options.path,
            page: this,
            properties: {
                "width": width,
                "height": height,
                "header": header
            },
            buttons: options.popupBtns
        });
        this.appendChild(popup);

        let layout = new Layout({
            path: options.path,
            page: this
        });

        popup.appendChild(layout);

        // объект с панелями для возврата
        let panels = {};

        if (panelsCount === 1) {

            let panel = new Panel({
                path: options.path,
                page: this,
                properties: {
                    position: 'main'
                }
            });
            layout.appendChild(panel);
            panels.main = panel;

        } else if (panelsCount === 2) {

            let panelLeft = new Panel({
                path: options.path,
                page: this,
                properties: {
                    position: 'left',
                    width: '50%'
                }
            });
            layout.appendChild(panelLeft);
            panels.left = panelLeft;

            let panelRight = new Panel({
                path: options.path,
                page: this,
                properties: {
                    position: 'main',
                    width: '50%'
                }
            });
            layout.appendChild(panelRight);
            panels.main = panelRight;

        }

        return panels;

    }

    /**
     *  Добавляет в elements структуру Layout --> Panel
     *  options.path - путь с клиента
     *  options.header - имя объекта, которое отображается в панели управления
     *  options.panelsCount - 1 или 2 (по умолчанию 1)
     * @returns {object} объект с панелями
     */
    buildLayoutCarcass(options) {

        let panelsCount = options.panelsCount || 1;

        let layout = new Layout({
            path: options.path,
            page: this,
            properties: {
                header: options.header || ''
            }
        });

        this.appendChild(layout);

        // объект с панелями для возврата
        let panels = {};

        if (panelsCount === 1) {
            let panel = new Panel({
                path: options.path,
                page: this,
                properties: {
                    position: 'main'
                }
            });
            layout.appendChild(panel);
            panels.main = panel;
        } else if (panelsCount === 2) {

            let panelLeft = new Panel({
                path: options.path,
                page: this,
                properties: {
                    position: 'left',
                    width: '50%'
                }
            });
            layout.appendChild(panelLeft);
            panels.left = panelLeft;

            let panelRight = new Panel({
                path: options.path,
                page: this,
                properties: {
                    position: 'main',
                    width: '50%'
                }
            });
            layout.appendChild(panelRight);
            panels.main = panelRight;

        }

        return panels;

    }

    /**
     * Функция дополняет шаблон кодом
     * @param {object} template - объект шаблона который изменяется
     */
    extendWithCode() {

        let code = require('../code/code.js'); // все обработчики всего проекта
        let handlers = [];
        let resultCode = {}; // здесь будут только те обработчики, которые нужны текущему шаблону

        let route = this.elements;

        // запускаем функцию рекурсивного обхода
        searchForEvents(route);
        // выбираем нужные функции
        addNeededFunctions();

        this.code = resultCode;

        /**
         * Функция рекурсивно проходится по всем elements и выделяет название обработчиков событий в массив handlers
         * @param {array} elements
         */
        function searchForEvents(elements) {
            elements.forEach((el) => {
                // если у элемента есть обработчики события, выделим уникальные из них в массив handlers
                if (el.events) {
                    for (let event in el.events) {
                        let handler = el.events[event];
                        handler = handler.trim(); // избавляемся от пробелов, мало ли что

                        if (handlers.indexOf(handler) === -1) {
                            handlers.push(handler);
                        }
                    }
                }

                // если у элементы есть вложенные элементы - пройдемся по ним
                if (el.elements && Array.isArray(el.elements)) {
                    searchForEvents(el.elements);
                }
            });
        }

        /**
         * Функция выделяет и глобального хранилища кода только функции, которые нужны текущему шаблону
         */
        function addNeededFunctions() {
            if (handlers.length) {
                handlers.forEach((handler) => {
                    let func = code[handler];
                    if (func) {
                        resultCode[handler] = func.toString();
                    }
                });
            }
        }
    }

    addContent(path, fields, records) {
        let content = this.makeContent(fields, records);
        this.content.push({
            forId: [path],
            records: content.records,
            fk: content.fk
        });
    }

    addFk(path, records) {
        let object = utils.getObjectName(path);

        let fk = {};
        fk[object] = {};

        for (let index in records) {
            let description = records[index].fields.description;
            fk[object][index] = description;
        }

        this.content.push({
            fk: fk
        });
    }

}

class Component {

    constructor(options) {
        this.path = options.path;
        this.type = options.type || '';
        this.id = options.id || '';
        this.elements = [];
        this.properties = options.properties;
        this.events = options.events || {};
        this.page = options.page || null;
    }

    appendChild(el) {
        this.elements.push(el.prepareForAppending());
    }

    prepareForAppending() {
        return {
            id: this.id,
            path: this.path,
            type: this.type,
            properties: this.properties,
            elements: this.elements,
            events: this.events
        }
    }

    makeContent(metaData, recordsData) {
        return this.page.makeContent(metaData, recordsData);
    }
}

class Grid extends Component {

    constructor(options) {
        super(options);
        this.type = 'grid';
        this.recordsData = options.recordsData;
        this.columnsData = options.columnsData;
        this.summaryData = options.summaryData || [];
        this.buttons = options.buttons;
        this.editable = options.properties.editable || false;
        this.fieldsEditability = options.properties.fieldsEditability || {};
        this.columnsOrder = options.columnsOrder || [];
        this.hiddenColumns = options.hiddenColumns || [];
        this.properties = {
            PK: options.properties.PK,
            pagination: options.properties.pagination,
            limit: options.properties.limit,
            selectedRecords: options.properties.selected,
            multiselect: options.properties.multiselect,
            showSelectColumn: options.properties.showSelectColumn,
            headID: options.properties.headID,
            refCol: options.properties.refCol,
            sortBy: options.properties.orderBy,
            groupBy: options.properties.groupBy,
            showGroupCol: options.properties.showGroupCol,
            // имя табличной части которую нужно разворачивать в форме списка
            refToExpand: options.properties.refToExpand,
            hierachy: options.properties.hierachy,
            data: options.properties.data || {}  // произвольные данные, которые хотим передать на клиент
        };
        this.dropListsToLoad = options.dropListsToLoad || [];
        this.render();
    }

    render() {
        let columns = this.makeColumns();
        this.elements = this.elements.concat(columns);
        let content = this.makeContent(this.columnsData, this.recordsData);
        this.page.content.push({
            forId: [this.path + '-' + this.type + '-' + this.id],
            records: content.records,
            summary: this.summaryData,
            fk: content.fk
        });
        this.elements.push({
            type: 'toolbar',
            elements: this.buttons
        });
    }

    makeColumns() {
        let result = [];
        // скопируем колонки, чтобы можно было их менять
        let columns = _.cloneDeep(this.columnsData);
        // сначала пройдемся по колонкам для которых задан порядок
        this.columnsOrder.forEach((colName) => {
            if (columns[colName]) {
                let resultCol = this._makeCol(colName);
                result.push(resultCol);
                delete columns[colName];
            }
        });
        // пройдемся по оставшимся колонкам
        for (let col in columns) {
            let resultCol = this._makeCol(col);
            if (resultCol) {
                result.push(resultCol);
            }
        }
        return result;
    }

    _makeCol(col) {
        let typeForClient = '';
        if (this.columnsData[col].type === 'ref') return null;
        if (this.columnsData[col].type === 'link') {
            typeForClient = 'reference';
        } else {
            typeForClient = this.columnsData[col].type[0];
        }
        // TODO пока клиент не умеет обрабатывать ссылки на файлы заменяем обычным текстом
        if (typeForClient === 'file') {
            typeForClient = 'text';
        }

        let editable = (this.fieldsEditability[col] !== undefined) ? this.fieldsEditability[col] : this.editable;
        let hidden = (this.hiddenColumns.indexOf(col) !== -1) ? true : false;
        let properties = {
            field: col,
            caption: this.columnsData[col].title,
            hidden: hidden,
            sortable: true,
            type: typeForClient,
            required: this.columnsData[col].required || false,
            editable: editable
        };
        // передадим название объекта на клиент, чтобы его использовать например для открытия форм редактирования элемента для ссылок в таблице
        if (this.columnsData[col].type === 'link') {
            properties.link = this.columnsData[col].link;
            if (this.dropListsToLoad.indexOf(this.columnsData[col].link) !== -1) {
                properties.static = true;
            }
        }
        return {
            type: 'column',
            properties: properties
        };
    }

}

class CrossGridSupSelection extends Component {

    constructor(options) {
        super(options);
        this.type = 'crossGridSupSelection';
        this.recordsData = options.recordsData;
        this.columnsData = options.columnsData;
        this.buttons = options.buttons;
        this.properties = {
            PK: options.properties.PK,
            groupColName: options.properties.groupColName,
            colsInGroup: options.properties.colsInGroup
        };
        this.render();
    }

    render() {
        let columns = this.makeColumns();
        this.elements = this.elements.concat(columns);
        let content = this.makeContent(this.columnsData, this.recordsData);
        this.page.content.push({
            forId: [this.path + '-' + this.type + '-' + this.id],
            records: content.records,
            summary: this.summaryData,
            fk: content.fk
        });
        this.elements.push({
            type: 'toolbar',
            elements: this.buttons
        });
    }

    makeColumns() {
        let result = [];
        // скопируем колонки, чтобы можно было их менять
        let columns = _.cloneDeep(this.columnsData);
        // пройдемся по оставшимся колонкам
        for (let col in columns) {
            let resultCol = this._makeCol(col);
            if (resultCol) {
                result.push(resultCol);
            }
        }
        return result;
    }

    _makeCol(col) {
        let typeForClient = '';
        if (this.columnsData[col].type === 'ref') return null;
        if (this.columnsData[col].type === 'link') {
            typeForClient = 'reference';
        } else {
            typeForClient = this.columnsData[col].type[0];
        }
        // TODO пока клиент не умеет обрабатывать ссылки на файлы заменяем обычным текстом
        if (typeForClient === 'file') {
            typeForClient = 'text';
        }

        let properties = {
            field: col,
            caption: this.columnsData[col].title,
            hidden: false,
            sortable: true,
            type: typeForClient,
            required: this.columnsData[col].required || false,
            editable: true
        };
        // передадим название объекта на клиент, чтобы его использовать например для открытия форм редактирования элемента для ссылок в таблице
        /*if (this.columnsData[col].type === 'link') {
            properties.link = this.columnsData[col].link;
            if (this.dropListsToLoad.indexOf(this.columnsData[col].link) !== -1) {
                properties.static = true;
            }
        }*/
        return {
            type: 'column',
            properties: properties
        };
    }

}

class CrossGridQuotationList extends Component {

    constructor(options) {
        super(options);
        this.type = 'crossGridQuotationList';
        this.recordsData = options.recordsData;
        this.columnsData = options.columnsData;
        this.colGroupsNames = options.colGroupsNames || {};
        this.buttons = options.buttons;
        this.properties = {
            PK: options.properties.PK,
            groupColName: options.properties.groupColName,
            colsInGroup: options.properties.colsInGroup,
            editableFields: options.properties.editableFields || []
        };
        this.render();
    }

    render() {
        let columns = this.makeColumns();
        this.elements = this.elements.concat(columns);
        let content = this.makeContent(this.columnsData, this.recordsData);
        content.fk[this.properties.groupColName] = this.colGroupsNames;
        this.page.content.push({
            forId: [this.path + '-' + this.type + '-' + this.id],
            records: content.records,
            summary: this.summaryData,
            fk: content.fk
        });
        this.elements.push({
            type: 'toolbar',
            elements: this.buttons
        });
    }

    makeColumns() {
        let result = [];
        // скопируем колонки, чтобы можно было их менять
        let columns = _.cloneDeep(this.columnsData);
        // пройдемся по оставшимся колонкам
        for (let col in columns) {
            let resultCol = this._makeCol(col);
            if (resultCol) {
                result.push(resultCol);
            }
        }
        return result;
    }

    _makeCol(col) {
        let typeForClient = '';
        if (this.columnsData[col].type === 'ref') return null;
        if (this.columnsData[col].type === 'link') {
            typeForClient = 'reference';
        } else {
            typeForClient = this.columnsData[col].type[0];
        }
        // TODO пока клиент не умеет обрабатывать ссылки на файлы заменяем обычным текстом
        if (typeForClient === 'file') {
            typeForClient = 'text';
        }

        let properties = {
            field: col,
            caption: this.columnsData[col].title,
            hidden: false,
            sortable: true,
            type: typeForClient,
            required: this.columnsData[col].required || false,
            editable: true
        };
        // передадим название объекта на клиент, чтобы его использовать например для открытия форм редактирования элемента для ссылок в таблице
        /*if (this.columnsData[col].type === 'link') {
            properties.link = this.columnsData[col].link;
            if (this.dropListsToLoad.indexOf(this.columnsData[col].link) !== -1) {
                properties.static = true;
            }
        }*/
        return {
            type: 'column',
            properties: properties
        };
    }

}

class Form extends Component {
    constructor(options) {
        super(options);
        this.object = utils.getObjectName(this.path);
        this.type = 'form';
        this.fields = options.fields || [];
        this.buttons = options.buttons || [];
        this.record = options.record || {};
        this.filterFields = options.filterFields || {},
        this.dropListsToLoad = options.dropListsToLoad || [];
        this.events = {
            rendered: 'onFormRender'
        };

        this.extendWithField();
        this.extendWithContent(this.fields, this.record);
    }

    extendWithField() {
        let typesMap = {
            "integer": "int",
            "link": "reference",
            "uuid": "text",
            "ref": "text",
            "boolean": "checkbox",
            "data": "date",
            "time": "time",
            "timestamp": "datetime",
            "file": "file"
        };

        for (let fieldName in this.fields) {

            let field = this.fields[fieldName];

            // тип данных филда
            let serverDataType;

            if (Array.isArray(field.type)) {
                serverDataType = field.type[0];
            } else {
                serverDataType = field.type;
            }

            let clientDataType = typesMap[serverDataType];

            if (!clientDataType) {
                clientDataType = serverDataType;
            }
            // вид филда - обычный field или раскрывающийся список - droplist
            let fieldType = "field";

            if (clientDataType === "reference") {
                fieldType = "dropList";
            }

            // по умолчанию прячем поле первичного ключа и parentID (type = "ref")
            let hidden = false;
            if (field.isPrimary || (field.type === "ref") /*|| fieldName === 'extension'*/) {
                hidden = true;
            }

            let options = {
                type: fieldType,
                path: this.path + '-' + fieldName,
                properties: {
                    type: clientDataType,
                    label: field.title || fieldName,
                    name: fieldName,
                    required: field.required,
                    hidden: hidden,
                }
            };

            // зависит ли поле от других полей формы
            let filterFields = this.filterFields[fieldName];
            if (Array.isArray(filterFields) && filterFields.length) { // это должен быть массив
                options.properties.filterFields = filterFields;
            }

            if (field.type === "link") {
                options.properties.link = field.link;
                if (this.dropListsToLoad.indexOf(field.link) !== -1) {
                    //Признак того что значения в дроплист будут грузится сразу
                    options.properties.static = true;
                }
            }

            // получим параметры филда характерные для данной формы
            let fieldParams = this._getParamsForField(fieldName);
            // дополним имеющиеся опции
            assign(options, fieldParams);

            let clientField = new Field(options);

            this.appendChild(clientField);

        }
    }

    /**
     * Получает параметры параметры филда для текущей формы
     * @param fieldName - имя филда
     * @returns {{}} - объект с параметрами
     * @private
     */
    _getParamsForField(fieldName) {
        let params = {};
        // получим обработчики событий для полей формы текущего объекта
        let fieldsParams = getConfigParam(this.object, 'fields') || {};
        // получаем параметры конкретного поля
        let fieldParams = fieldsParams[fieldName];

        if (fieldParams) {
            params = fieldParams;
        }
        return params;
    }

    extendWithContent(fields, record) {
        let content = this.makeContent(fields, record);

        this.page.content.push({
            forId: [this.path + '-' + this.type],
            records: content.records,
            fk: content.fk
        })
    }

}

class Layout extends Component {
    constructor(options) {
        super(options);
        this.type = 'layout';
        this.id = uuid.v4();
    }
}

class Panel extends Component {
    constructor(options) {
        super(options);
        this.type = 'panel';
        if (this.properties === undefined) {
            this.properties = {position: 'main'}
        }
        //console.log(JSON.stringify(this));
    }
}

class Tabs extends Component {
    constructor(options) {
        super(options);
        this.type = 'tabs';
    }
}

class Tab extends Component {
    constructor(options) {
        super(options);
        this.type = 'tab' + ((options.type) ? "-" + options.type : "");
    }
}

class Popup extends Component {
    constructor(options) {
        super(options);
        this.type = 'popup';
        this.buttons = options.buttons || [];
        this.elements.push({
            type: "header",
            elements: [],
            properties: {
                caption: options.properties.header || ''
            }
        });
        this.header = this.elements[this.elements.length - 1].properties.caption;
        this.elements.push({
            type: "body",
            elements: []
        });
        this.body = this.elements[this.elements.length - 1].elements;
        this.elements.push({
            type: "footer",
            elements: []
        });
        this.footer = this.elements[this.elements.length - 1].elements;
        this.render();
    }

    render() {
        this._prepareButtons();
        for (let i in this.buttons) {
            this.footer.push(this.buttons[i]);
        }
    }

    _prepareButtons() {
        for (let i in this.buttons) {
            let btnId = this.id + '-' + this.buttons[i].id;
            this.buttons[i].id = btnId;
            this.buttons[i].path = this.path;
        }
    }

    appendChild(el) {
        this.body.push(el.prepareForAppending());
    }
}


class Field extends Component {
    constructor(options) {
        super(options);
        this.buttons = options.buttons || [
            {
                type: "button",
                properties: {
                    icon: "fa fa-pencil fa-lg",
                    style: "btn btn-success"
                },
            },
            {
                type: "button",
                properties: {
                    icon: "fa fa-ellipsis-h fa-lg",
                    style: "btn btn-success"
                },
                id: 'more',
                events: {
                    click: "showLink"
                }
            },
            {
                type: "button",
                properties: {
                    icon: "fa fa-refresh fa-lg",
                    style: "btn btn-success"
                }
            }
        ];
        this.type = options.type || 'field';

        this.extendWithButtons();

    }

    extendWithButtons() {

        // кнопки по умолчанию делаем только для droplist'a
        if (this.type === "field") return;

        this.buttons.forEach((btn) => {
            let btnForField = new Button({
                id: btn.id,
                type: btn.type,
                properties: btn.properties,
                events: btn.events
            });

            this.appendChild(btnForField);
        });

    }
}

class Button extends Component {
    constructor(options) {
        super(options);
        this.type = options.type || 'button';
    }
}

class Map extends Component {
    constructor(options) {
        super(options);
        this.type = 'map';
    }
}

class ToolbarButton {
    constructor(options) {
        this.type = 'toolbarItem';
        this.id = options.id;
        this.events = {
            onClick: options.onClick
        };
        this.properties = {
            "caption": options.caption || '',
            "icon": options.icon || '',
            "more": options.more || false,
            "needSelected": options.needSelected || false,
            "needOnceSelected": options.needOnceSelected || false
        }
    }

    static getFilterButton(options) {
        return new ToolbarButton({
            id: options.id,
            onClick: options.onClick || "apiFilterFunction",
            caption: options.caption,
            icon: options.icon || '',
            needSelected: true,
            more: options.more || true
        });
    }

    static getNoFilterButton(options) {
        return new ToolbarButton({
            id: options.id,
            onClick: options.onClick || "apiNoFilterFunction",
            caption: options.caption,
            icon: options.icon || '',
            more: options.more || true
        });
    }
}

module.exports = {
    Response: Response,
    Layout: Layout,
    Panel: Panel,
    Popup: Popup,
    Tabs: Tabs,
    Tab: Tab,
    Grid: Grid,
    Form: Form,
    Field: Field,
    Button: Button,
    Map: Map,
    ToolbarButton: ToolbarButton,
    CrossGridSupSelection: CrossGridSupSelection,
    CrossGridQuotationList: CrossGridQuotationList
};
