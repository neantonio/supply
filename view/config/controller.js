const fs = require('fs');
const path = require('path');

// класс для работы с конфигурационными файлами
class ConfigController {
    constructor() {
        this._configInfo = {};
    }

    // установить конфигурационную информацию (предполагается что основное применение будет для тестирования других методов)
    setConfigInfo(data) {
        this._configInfo = data;
    }

    // получить конфигурационную информацию
    getConfigInfo() {
        return this._configInfo;
    }

    // aссинхронный вариант
    // readConfigFile() {
    //     return new Promise((resolve, reject) => {
    //         fs.readFileSync(path.join(__dirname, '/forms.json'), 'utf8', (err, data) => {
    //             if (err) reject("Ошибка при чтении конфигурационного файла: " + err);
    //
    //             let config;
    //             try {
    //                 config = JSON.parse(data);
    //             } catch (err) {
    //                 reject("Ошибка при парсинге конфигурационного файла: " + err);
    //             }
    //
    //             this._configInfo = config;
    //             resolve(config);
    //         });
    //     });
    // }

    // синхронный вариант
    readConfigFile() {
        try {
            let data = fs.readFileSync(path.join(__dirname, '/forms.json'), {encoding: 'utf8'});
            let config;
            try {
                config = JSON.parse(data);
                this.setConfigInfo(config);
            } catch (err) {
                throw("Ошибка при парсинге конфигурационного файла: " + err);
            }
        } catch (err) {
            throw("Ошибка при чтении конфигурационного файла: " + err);
        }
    }

// получить конфиг
    get(path) {
        let result = null;

        // при вызове без параметров - получить весь конфиг
        if (!arguments.length) {
            result = this._configInfo;
        } else { // указываем путь к параметру через "."
            if (typeof path === 'string') {
                // разобьем строку на массив параметров
                let params = path.split('.');
                if (params.length) {
                    // значение соответствующее текущему положению в дереве значения конфига
                    let currentConfigInfo = this._configInfo;
                    for (let i = 0; i < params.length; i++) {
                        // на случай если вообще смотрим не в объекте
                        try {
                            result = currentConfigInfo[params[i]];
                        } catch (err) {
                            console.log('Файл конфигурации не содержит значения ' + params[i]);
                            result = null;
                            break;
                        }
                        // если такого свойства в объекте нет бросаем исключение
                        if (result === undefined) {
                            console.log('Файл конфигурации не содержит значения ' + params[i]);
                            result = null;
                            break;
                        }
                        currentConfigInfo = result;
                    }
                }
            } else {
                console.log('Переданный параметр не строкового типа');
            }
        }

        return result;
    }

}


//let configController;
// (async function () {
//     configController = new ConfigController();
//     await configController._readConfigFile();
// })();

let configController = new ConfigController();
configController.readConfigFile();

module.exports = configController;