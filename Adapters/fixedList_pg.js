import {adapter} from './reference_pg';
import _ from 'lodash';

class fixedList_pg extends adapter {
    constructor(...args) {
        super(...args);
    }

    async init() {
        await super.init();
        await this.checkCreateValues();
    }

    // создаёт список значений задынных в конфигурации
    // обновляет значения с изменёнными наименованиями
    // удаляет неактуальные значения
    async checkCreateValues() {
        let iface = await this.getInterface();
        let shemaValues = {};
        iface.values.forEach(e => {
            shemaValues[e.ID] = e.description || e.ID
        });
        let existedValues = await this.get();
        existedValues = existedValues.records[Object.keys(existedValues.records)[0]];
        existedValues = this.toHash(existedValues);


        await this.__updateValues(existedValues, shemaValues);
        await this.__insertValues(existedValues, shemaValues);
    }

    toHash(values) {
        let res = {};
        values.map(e => res[e.ID] = e.description);
        return res;
    }

    async __updateValues(existedValues, shemaValues) {
        Object.keys(existedValues).forEach(k => {
            if (shemaValues[k] && shemaValues[k] != existedValues[k])
                this.update({
                    comparisons: {
                        "ID": {
                            "left": {type: "field", value: "ID"},
                            "right": {type: "value", value: k},
                            sign: "equal"
                        }
                    },
                    "tree": {or: ["ID"]}
                }, [{"description": shemaValues[k]}]);
        })
    }

    async __insertValues(existedValues, shemaValues) {
        let valuesToInsert = [];
        Object.keys(shemaValues).forEach(k => {
            if (!existedValues[k])
                valuesToInsert.push({"ID": k, "description": shemaValues[k]})
        });
        return await super.insert(valuesToInsert);
    }

    async __deleteValues(existedValuesm, shemaValues) {
        //TODO delete values
    }

    async insert(values, parameters) {
        throw `Невозможно добавить данные в фиксированный список.`;
    }

}

export {fixedList_pg as adapter};