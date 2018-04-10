import * as textM from "./TextM";
export class CryptAliasesMapUtil {
    constructor() {
        this.mass = {};
        this.keyNumber = 0;
    }

     cryptValue(aliasedValue, prefix) {
        if(prefix === undefined) {
            prefix = "";
        }

        let keyNumber = `${prefix}${this.keyNumber++}`;
        this.mass[keyNumber] = aliasedValue;
        return keyNumber;
    }

     getValue(keyNumber) {
        return this.mass[keyNumber];
    }

     getDecryptedMass(encryptedMass) {
        for (let title of encryptedMass) {
            for (let crypt in title) {
                let property = this.getValue(crypt);
                if (property === null || typeof property === "undefined") {
                    continue;
                }
                title[property] = title[crypt];
                delete title[crypt];
            }
        }
    }

     getKeyByValue(value) {
        for (let property in this.mass) {
            if (this.mass[property] === value) {
                return property;
            }
        }
        return textM.message.notDefinedValueAliasMap;
    }
}
