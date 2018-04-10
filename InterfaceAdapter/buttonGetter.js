let ToolbarButton = require('./builder').ToolbarButton;

// класс для определения по интерфейсу и конфигу, какие кнопки должны быть отрисованы в тулбаре таблицы
export class ButtonGetter {

    constructor(options) {
        // кнопки которые хранятся в конфиге в секции additionalButtons (соответствуют каким-то серверным методам)
        this._additionalButtons = options.additionalButtons || {};
        // кнопки которые хранятся в конфиге в секции formButtons (реализуются для формы, не описываются в предметной области)
        this._formButtons = options.formButtons || {};
        // кнопки которые хранятся в конфиге в секции buttons объекта default (на текущий момент нет смысла их переопределять)
        this._standartButtons = options.standartButtons || [];
        // секция methods интерфейса j,]trnf
        this._interfaceMethods = options.interfaceMethods || {};
        // если метод не совпадает ни с одним из этих методов, то считаем что это серверный метод специально для этого объекта
        this._notApiButton = ['get', 'getInterface', 'insert', 'update', 'delete', 'rbInsert', 'rbUpdate', 'rbDelete', 'copy'];
    }

    // получить массив с кнопками для тулбара таблицы
    getButtons() {
        let result = [];
        //let standartButtons = getConfigParam('default', 'buttons') || []; // insert, update, delete, copy?

        // сразу добавим кнопку refresh (так как раз можно смотреть справочник, то get точно разрешен)
        let refreshButton = this.getButtonById(this._standartButtons, 'refreshGrid');
        if (refreshButton) {
            result.push(refreshButton);
        }

        // цикл по всем методам
        for (let methodName in this._interfaceMethods) {
            let method = this._interfaceMethods[methodName];
            // определяем какие стандартные кнопки отображать (удалить, изменить, добавить, копировать)
            let stdButton = this.getButtonById(this._standartButtons, methodName);
            if (stdButton) {
                result.push(stdButton);
            // определим является метод какой-то дополнительной серверной функцией
            } else if (this.isApiMethod(methodName)) {
                let redefinedButton = this._additionalButtons[methodName];
                let onClickHandler = redefinedButton && redefinedButton.events ? redefinedButton.events.onClick : null;
                // если функция принимает на вход фильтр
                if (this.isFilterParam(method)) {
                    result.push(ToolbarButton.getFilterButton({
                        id : methodName,
                        caption: redefinedButton ? redefinedButton.properties.caption : method.description,
                        icon: redefinedButton ? redefinedButton.icon : '',
                        more: redefinedButton ? redefinedButton.properties.more : true,
                        onClick : onClickHandler
                    }));
                } else {
                    result.push(ToolbarButton.getNoFilterButton({
                        id : methodName,
                        caption: redefinedButton ? redefinedButton.properties.caption : method.description,
                        icon: redefinedButton ? redefinedButton.icon : '',
                        more: redefinedButton ? redefinedButton.properties.more : true,
                        onClick : onClickHandler
                    }));
                }
            }
        }

        // добавим клиентские кнопки(которые определяем для формы, а не для объекта)
        let formButtons = this.getFormButtons();
        result = result.concat(formButtons);

        return result;
    }

    // отпределяем является ли метод серверной функцией
    isApiMethod(methodName) {
        // стандартные методы, кнопки для них рисуются по определенным правилам, либо вообще не рисуются
        //let notApiButton = ['get', 'getInterface', 'insert', 'update', 'delete', 'rbInsert', 'rbUpdate', 'rbDelete'];
        let result = false;
        if (this._notApiButton.indexOf(methodName) === -1) {
            result = true;
        }
        return result;
    }

    // принимает ли метод на вход фильтр
    isFilterParam(method){
        let result = false;
        if (method.parameters && method.parameters.length) {
            for (let i = 0; i < method.parameters.length; i++) {
                let parameter = method.parameters[i];
                if (parameter.name === 'filter') {
                    result = true;
                    break;
                }
            }
        }
        return result;
    }

    getFormButtons(){
        let buttons = [];
        for (let btnName in this._formButtons) {
            let formBtn = this._formButtons[btnName];
                buttons.push(formBtn);
        }
        return buttons;
    }

    // получить кнопку из массива кнопок по параметру id
    getButtonById(buttons, id) {
        let result = null;
        for (let i = 0; i < buttons.length; i++) {
            let button = buttons[i];
            if (button.id === id) {
                result = button;
                break;
            }
        }
        return result;
    }

}