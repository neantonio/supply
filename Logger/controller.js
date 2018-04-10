
/**
 * Created by Eugene Pozdnyak
 * email; e.pozdnyak@groupstp.ru */

'use stirct';

import * as fs from "fs";
import * as util from "util";
import * as format from "../service/format";

// variable @mode for console writing
// debug - all output streams, release - only warn and err streams
let mode = "debug";

// variable for path to log folder
let logPath = "./log";

/*
 * Модуль для общей схемы логирования
 *  для внещних вызовов доступен метод write.
 *
 *  Метод для записи в лог.
 *  @write
 *  @param {string} level - уровень логирования (debug, log, warning, error)
 *  @param {string} message - текст, записываемый в лог
 *  @param {object} error  - объект с описанием ошибки, рекомендуемое значение `new Error()`
 *
 */
class Logger{

    constructor(){
        //console.log("Logger initialization.");
        if (!fs.existsSync(logPath)) {
            fs.mkdirSync(logPath);
        }
        let writeMode = 'a+';
        this.__message = fs.openSync(`${logPath}/log`, writeMode);
        this.__warning = fs.openSync(`${logPath}/warn`, writeMode);
        this.__error = fs.openSync(`${logPath}/err`, writeMode);
        if(mode == "debug") {
            this.__debug = fs.openSync(`${logPath}/debug`, writeMode);
        }

        this.write("debug", "Logger loaded")
    }

    test(){
        console.log("Test function for logger.");
    }


    /**
     * Функция возвращения параметров сэмулированныой ошибки
     * Возвращает:
     *  ассоциативный массив вида
     *  {
	 *  	method: имя метода, в котором сэмулирована ошибка,
	 *  	string: номер соответвующей строки в вызвавшем модуле
	 *  }
     * */
    __getErrorParameters(errString){
        if(!!errString) {
            let errParseStrs = errString.match(/at (.*?) \(.+\:(\d+)\:\d+\)/);
            return {
                method: errParseStrs[1],
                string: errParseStrs[2]
            }
        }
        else{
            return {
                method: "???",
                string: "???"
            }
        }
    }

    /**
     * Функция записи объекта @mes в файл с заголовком @handler
     * */
    __writeToHandler(handler, mes){
        fs.writeSync(handler, new Buffer(format.Formatter.getTimeStr() + " " + util.format(JSON.stringify(mes)) + "\n"));
    }

    /**
     * Метод добавления сообщения @message в лог ошибок
     * 	если параметр @error определен, в лог предварительно записывается
     * 	метод, в котором возникла ошибка, и номер строки в файле, из которого
     * 	произведен вызов функции записи в лог
     *
     * 	Пример вызова из внешнего модуля
     * 		logger.errorWrite("Error string", new Error())
     * */
    __errorWrite(message, error){
        if(error) {
            let errRes = this.__getErrorParameters(error.stack);
            let resStr = "Error in '" + errRes.method + "' at " + errRes.string + " string.";
            console.error(message);
            console.trace(error);
            this.__writeToHandler(this.__error, resStr);
        }

        this.__writeToHandler(this.__error, message);

        this.__logWrite(message);
    }

    /**
     * Метод для записи сообщения @message в основной лог
     * */
    __logWrite(message){
        this.__writeToHandler(this.__message, message);
        this.__debugWrite(message);
    }

    /**
     * Метод для записи сообщения @message в отладочный лог
     * */
    __debugWrite(message){
        if(mode === "debug") {
            this.__writeToHandler(this.__debug, message);
        }
    }

    /**
     * Метод добавления сообщения @message в лог предупреждений
     * 	если параметр @error определен, в лог предварительно записывается
     * 	метод, в котором возникла ошибка, и номер строки в файле, из которого
     * 	произведен вызов функции записи в лог
     *
     * 	Пример вызова из внешнего модуля
     * 		logger.warningWrite("Warning string", new Error())
     * */
    __warningWrite(message, error){
        if (error) {
            let errRes = this.__getErrorParameters(error.stack);
            let resStr = "Error in '" + errRes.method + "' at " + errRes.string + " string.";
            console.warn(message);
            console.trace(error);
            this.__writeToHandler(this.__warning, resStr);
        }
        this.__writeToHandler(this.__warning, message);
        this.__logWrite(message);
    }

    /**
     * Метод для доступа к классу из вне
     * */
    write(level, message, error) {
        level = level.toLowerCase();
        let self = this;
        if (self[`__${level}Write`]) {
            self[`__${level}Write`](message, error);
        }
        else {
            self.__warningWrite(
                `Система не поддерживает уровень логирования "${level}"
                    Сообщение: ${message}`,
                new Error());
        }
    }
}

/**
 * Инициализация ОДНОГО экземпляра класса
 * */
let logger = new Logger();

/**
 * Экспорт созданного экземпляра
 * */
export {logger};