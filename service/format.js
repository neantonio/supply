/**
 * Created by User on 05.06.2017.
 */

'use stirct';

export class Formatter{
    constructor(){
        console.log("Logger initialization.");
    }
    /**
     * Функция получения строки вида [YYYY:MM:DD hh:mm:ss] для текущего времени
     * */
    static getTimeStr(date = new Date()){
        function numberToLength(number, len){
            if (number.toString.length < len) {
                return (Array(len).join('0') + number).slice(-len);
            }
        }

        function twoSymbols(number) {
            return (number < 10 ? "0" : "") + number;
        }

        let dateStr = "[";
        dateStr += date.getFullYear() + "-" + twoSymbols(date.getMonth() + 1) + "-" + twoSymbols(date.getDate()) + " ";
        dateStr += twoSymbols(date.getHours()) + ":" + twoSymbols(date.getMinutes()) + ":" + twoSymbols(date.getSeconds()) + "." + numberToLength(date.getMilliseconds(), 3);
        dateStr += "]";
        return dateStr;
    }


    /**
     * Метод для создания объекта с описанием ошибки, отправляемой клиенту.
     * 	@message - отправляемый объект, содержащий описание возникшей ошибки
     * */
    static errorMessage(message) {
        return {
            status: "error",
            message: message
        };
    }

    /**
     * Метод для создания объекта с отправляемым клиенту объектом @message.
     * */
    static successMessage(message) {
        let result = {
            status: "success"
        };
        if (message !== 'undefined') {
            result.message = message;
        }
        return result;
    }
}

//export {Formatter};