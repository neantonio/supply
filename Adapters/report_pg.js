import {adapter} from './reference_pg';
import _ from 'lodash';

class report_pg extends adapter {
    constructor(...args) {
        super(...args);
    }

    async init() {
    }

    async insert(values, parameters) {
        throw `Невозможно добавить данные в отчёт.`;
    }

    async delete(filter, parameters, objInfo = {fields: {}}) {
        throw `Невозможно удалить данные из отчёта.`;
    }

    async update(filter, values, parameters, objInfo) {
        throw `Невозможно обновить данные отчёта.`;
    }

}

export {report_pg as adapter};