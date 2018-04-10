import {adapter} from './stage_pg';

class stages_supSelection_pg extends adapter {

    constructor(...args) {
        super(...args)
    }

    async init() {
        await super.init();
    }

    // затычка для отправки писем через подписку
    async send(filter = {comparisons: {}}, objInfo){
        return await super.get([], filter, {}, objInfo);
    }
}

export {stages_supSelection_pg as adapter};