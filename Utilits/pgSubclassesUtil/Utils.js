
/**
 * Класс утилит для работы со строками
 */
export class Utils {
    constructor() {
    }

    addQuotes(str) {
        return "'" + this._shilding(str) + "'"
    };

    dQuotes(str) {
        return "\"" + this._shilding(str) + "\""
    };

    delSlash(str) {
        str = this._shilding(str);
        if (str === null || typeof str === 'undefined') {
            return '';
        }
        return (str.replace(/\\/g, ""));
    };

    compareNumber(p1, p2) {
        return p1.number - p2.number;
    };

    addBrackets(str) {
        return '(' + this._shilding(str) + ')'
    };

    _shilding(str) {
        // if (str.length > 0) {
        //     return str.replace(/'/g, "''");
        // } else {
        return str;
        // }
    };

    unique(arr, field) {
        let obj = {};

        for (let i = 0; i < arr.length; i++) {
            let str = arr[i][field];
            obj[str] = true;
        }

        return Object.keys(obj);
    };

    uniq(arr) {
        let obj = {};

        for (let i = 0; i < arr.length; i++) {
            let str = arr[i];
            obj[str] = true;
        }

        return Object.keys(obj);
    };
}