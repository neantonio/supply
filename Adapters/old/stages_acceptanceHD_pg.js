import {adapter} from '../stage_pg';
import {httpRequest} from "../../service/requestPromise";

class query_pg extends adapter {
    constructor(...args) {
        super(...args)
    }

    async init() {
        await super.init();
    }
/*
    async sendMessageToMentor(filter, values, parameters){
        let json = {
            method: "sendMessageToMentor_helpDesk",
            parameters: {
                filter: filter,
                values: values,
                parameters: {
                    object: this.__interface.name
                }
            },
            token: parameters.token
        };

        let result = await httpRequest("localhost", 8000, json);
    }

    async sendMessageToInitiator(filter, values, parameters){
        let json = {
            method: "sendMessageToInitiator",
            parameters: {
                filter: filter,
                values: values,
                parameters: {
                    project: this.parent.__interface.name,
                    object: this.__interface.name
                }
            },
            token: parameters.token
        };

        let result = await httpRequest("localhost", 8000, json);
    }
    */
}

export {query_pg as adapter};