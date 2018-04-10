import {adapter} from './reference_pg';

class query_pg extends adapter {
    constructor(...args) {
        super(...args)
    }

    async init() {
        await super.init();
    }

    __cutValues(values) {
        return values;
        /*
        return values.map(v => {
            if (!!this.__interface.fields.workOut) {
                v.workOut = false;
            }
            return v;
        });
        */
    }

    /**
     * Метод, активирующий заявки, указанные в фильтре. Если заявка уже активирована, ничего не произойдёт.
     * @param filter Условие выбора.
     * @param objInfo Связи с объектами
     * @returns {Promise} Результат обновления.
     */
     active(filter = {comparisons: {}}, parameters, objInfo) {
        if (!!this.__interface.fields.workOut) {
            let values = [{"workOut": true}];
             /*filter.comparisons["alreadyActive"] = {
                left: {type: "field", value: "workOut"},
                right: {type: "value", value: "true"},
                sign: "unEqual"
            };
            if (filter.tree) {
                filter.tree = {and: [filter.tree, "alreadyActive"]}
            }
            else {
                filter.tree = {and: ["alreadyActive"]}
            }
            */
            return super.update(filter, values, {token: parameters.token}, objInfo);
        }
        return super.get([], filter, {}, objInfo);
    }

    async deactive(filter = {comparisons: {}}, parameters, objInfo) {
        if (!!this.__interface.fields.workOut) {
            let values = [{"workOut": false}];
            filter.comparisons["alreadyActive"] = {
                left: {type: "field", value: "workOut"},
                right: {type: "value", value: "true"},
                sign: "equal"
            };
            if (filter.tree) {
                filter.tree = {and: [filter.tree, "alreadyActive"]}
            }
            else {
                filter.tree = {and: ["alreadyActive"]}
            }
            return super.update(filter, values, objInfo);
        }
        return super.get([], filter, {}, objInfo);
    }

    async update(filter, values, parameters, objInfo) {
        return super.update(filter, this.__cutValues(values), objInfo);
    }

    async insert(values, parameters) {
        return super.insert(this.__cutValues(values));
    }
}

export {query_pg as adapter};