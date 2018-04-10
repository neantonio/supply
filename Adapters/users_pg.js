import {adapter} from './reference_pg';
import * as crypto from "crypto";

class users_pg extends adapter {
    constructor(...args) {
        super(...args);
    }

    insert(values) {
        const modifValues = [];
        for (let f in values) {
            const salt = this._generateSymbols(6);
            const pswd = this._encryptPassword(values[f].password, salt);
            let formingValues = {
                description: values[f].description,
                password: pswd,
                salt: salt,
                user: values[f].user
            };
            if (typeof(values[f].email) !== 'undefined') {
                formingValues.email = values[f].email;
            }
            modifValues.push(formingValues);
        }

        return Object.getPrototypeOf(Object.getPrototypeOf(this)).insert.call(this, modifValues);
    }

    update(filter, values, parameters, objInfo) {
        if(values.length === 0 || Object.keys(values[0]).length === 0){
            throw "Метод update у справочника users. Нельзя в качестве нового значения указывать пустую запись."
        }
        let updRecord = values[0];
        if(updRecord.password){
            updRecord.salt = this._generateSymbols(6);
            updRecord.password = this._encryptPassword(updRecord.password, updRecord.salt);
        }

        return Object.getPrototypeOf(Object.getPrototypeOf(this)).update.call(this, filter, [updRecord], parameters, objInfo);
    }

    _encryptPassword(password, salt) {
        return crypto.createHmac('sha1', salt).update(password).digest('hex');
    }

    _generateSymbols(lengthWord) {
        const chars = ['a', 'b', 'c', 'd', 'e', 'f', '(', ')', '[', ']', '!', '?', 'g', 'h', 'i', 'j', 'k', 'l', '&', '^', '%', '@', '*', '$', 'm', 'n', 'o', 'p', 'r', 's', '<', '>', '/', '|', '+', '-', 't', 'u', 'v', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'V', 'X', 'Y', 'Z', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '.', ',', '{', '}', '`', '~'];
        let password = '';
        for (let i = 0; i < lengthWord; i++) {
            const index = getRandomInt(0, chars.length);
            password += chars[index];
        }
        return password;

        function getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min)) + min;
        }
    }
}

export {users_pg as adapter};