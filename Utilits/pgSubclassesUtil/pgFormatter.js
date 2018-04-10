/**
 Класс, содержащий статические методы форматирования данных для работы в СУБД postgresql.
 */
import {logger} from '../../Logger/controller';

export class pgFormatter {
    constructor() {
    }

    static __formatInteger(source) {
        return new Promise((res, rej) => {
            if (source === null) {
                // ToDo: временно по умолчанию для целых чисел будет 0f
                res('0');
            } else if (Number.isSafeInteger(parseInt(source))) {
                res(source.toString());
            } else {
                logger.write(`error`, `Некорректное целое число.`, new Error());
                rej();
            }
        });
    }

    static __formatFloat(source) {
        return new Promise((res, rej) => {
            let isSafe = (source >= Number.MIN_SAFE_INTEGER && source <= Number.MAX_SAFE_INTEGER);
            if (isSafe) {
                if (source === null) {
                    // ToDo: временно по умолчанию для дробных чисел будет 0
                    res('0');
                } else {
                    res(source.toString());
                }
            } else {
                logger.write(`error`, `Некорректное вещественное число.`, new Error());
                rej();
            }
        });
    }

    static __formatString(source) {
        return new Promise((res, rej) => {
            let formattedString = 'NULL';
            if (source !== null) {
                if (source instanceof Array) {
                    formattedString = JSON.stringify(source);
                } else if (source === undefined){
                    formattedString = '';
                } else if (typeof(source) !== 'string') {
                    logger.write(`error`, `Неправильный формат строки.`, new Error());
                    rej(new Error(`Неправильный формат строки`));
                } else {
                    formattedString = source;
                }
                // если в строке есть одинарные кавычки, удваиваем их
                formattedString = formattedString.replace(/'/g, '\'\'');
                // добавляем кавычку в начале и в конце
                formattedString = '\'' + formattedString + '\'';
            }
            res(formattedString);
        });
    }

    static __formatDate(source) {
        return new Promise((res, rej) => {
            let formattedDate = 'NULL', buf;
            if (source !== null) {
                if (source instanceof Date) {
                    buf = source;
                } else if (typeof(source) === 'string') {
                    let mil = Date.parse(source);
                    if (mil) buf = new Date(mil);
                } else if (Number.isInteger(source)) {
                    buf = new Date(source);
                } else {
                    logger.write(`error`, `Некорректная дата.`, new Error());
                    rej();
                }
                let
                    d = buf.getDate(),
                    m = buf.getMonth() + 1,
                    y = buf.getFullYear();
                if (Number.isNaN(d)) {
                    logger.write(`error`, `Некорректная дата.`, new Error());
                    rej();
                }
                // yyyy-mm-dd
                formattedDate = '\'' + y + '-' + (m > 9 ? m : '0' + m) + '-' + (d > 9 ? d : '0' + d) + '\'';
            }
            res(formattedDate);
        });
    }

    static __formatTime(source) {
        return new Promise((res, rej) => {
            let formattedTime = 'NULL', buf;
            if (source !== null) {
                if (source instanceof Date) {
                    buf = source;
                } else if (typeof(source) === 'string') {
                    let mil = Date.parse(source);
                    if (mil) buf = new Date(mil);
                } else if (Number.isInteger(source)) {
                    buf = new Date(source);
                } else {
                    logger.write(`error`, `Некорректная дата.`, new Error());
                    rej();
                }
                let
                    h = buf.getHours(),
                    m = buf.getMinutes(),
                    s = buf.getSeconds(),
                    ms = buf.getMilliseconds();
                if (Number.isNaN(h)) {
                    logger.write(`error`, `Некорректная дата.`, new Error());
                    rej();
                }
                // 04:05:06.789
                formattedTime = '\'' + (h > 9 ? h : '0' + h) + ':' + (m > 9 ? m : '0' + m) + ':' + (s > 9 ? s : '0' + s) + '.' + ms + '\'';
            }
            res(formattedTime);
        });
    }

    static __formatTimestamp(source) {
        return new Promise((res, rej) => {
            let formattedTimestamp = 'NULL', buf;
            if (source !== null) {
                if (source instanceof Date) {
                    buf = source;
                } else if (typeof(source) === 'string') {
                    let mil = source ? Date.parse(source) : new Date();
                    if (mil) buf = new Date(mil);
                } else if (Number.isInteger(source)) {
                    buf = new Date(source);
                } else {
                    logger.write(`error`, `Некорректная дата.`, new Error());
                    rej();
                }
                let
                    y = buf.getFullYear(),
                    mon = buf.getMonth() + 1,
                    d = buf.getDate(),
                    h = buf.getHours(),
                    min = buf.getMinutes(),
                    s = buf.getSeconds(),
                    ms = buf.getMilliseconds();
                if (Number.isNaN(y)) {
                    logger.write(`error`, `Некорректная дата.`, new Error());
                    rej();
                }
                // 2003-04-12 04:05:06
                formattedTimestamp = '\'' + y + '-' + (mon > 9 ? mon : '0' + mon) + '-' + (d > 9 ? d : '0' + d) + ' ' + (h > 9 ? h : '0' + h) + ':' + (min > 9 ? min : '0' + min) + ':' + (s > 9 ? s : '0' + s) + '.' + ms + '\'';
            }
            res(formattedTimestamp);
        });
    }

    static async __formatBoolean(source) {
        if (typeof source === 'string') {
            source = source.toLowerCase();
            if (['t', 'true', '1'].indexOf(source) >= 0)
                return "'TRUE'";
            else
                return "'FALSE'"
        }
        if (source)
            return "'TRUE'";
        else
            return "'FALSE'";
    }


    static get __formatters() {
        return {
            integer: pgFormatter.__formatInteger,
            float: pgFormatter.__formatFloat,
            string: pgFormatter.__formatString,
            date: pgFormatter.__formatDate,
            time: pgFormatter.__formatTime,
            timestamp: pgFormatter.__formatTimestamp,
            boolean: pgFormatter.__formatBoolean
        };
    }

    static async formatValue(data) {
        try {
            let i = 0, done = false;
            // перебираем обработчики типов данных
            while (i < data.type.length && !done) {
                // если нашли
                if (pgFormatter.__formatters.hasOwnProperty(data.type[i])) {
                    done = true;
                    // вызываем обработчик, подхватываем либо отформатированное значение, либо ошибку
                    const procField = await this.__formatters[data.type[i]](data.value);
                    return procField;
                }
                i++;
            }
        } catch (e) {
            throw('Ошибка модуля преобразователя значений PG formatValue.');
        }
    }
}