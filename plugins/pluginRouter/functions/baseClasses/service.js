import * as fs from "fs";
import {sender} from "./sendClass";

class service{
    constructor(name){
        this.__name = name;
        this.__config = {};
        this.__loadConfig();
    }

    async reload(){
        this.__loadConfig();
    }

    __getInterface(project, object){
        return sender.send({
            object: `${project}.${object}`,
            method: "getInterface",
            parameters: {}
        });
    }

    async __getObjectIDs(project, object, filter){
        let records = await sender.send({
            object: `${project}.${object}`,
            method: "get",
            parameters: {
                filter: filter
            }
        });

        return Object.keys(records);
    }

    __getPrimaryKey(objectInterface){
        for(let field in objectInterface.fields){
            if(objectInterface.fields[field].isPrimary){
                return field;
            }
        }
        this.__throw(`В интерфейсе объекта '${objectInterface.name}' отсутствует описание первичного ключа.`);
    }

    //создат фильтр по ID
    static __getFilterById(ID, field = "ID") {
        return {
            comparisons: {
                ID: {
                    left: {
                        type: "field",
                        value: field
                    },
                    right: {
                        type: "value",
                        value: ID
                    },
                    sign: "equal"
                }
            },
            tree: {and: ["ID"]}
        }
    }

    //создат фильтр по массиву ID
    static __getFilterByIds(IDs, field = "ID") {
        return {
            comparisons: {
                ID: {
                    left: {
                        type: "field",
                        value: field
                    },
                    right: {
                        type: "value",
                        value: IDs
                    },
                    sign: "in"
                }
            },
            tree: {and: ["ID"]}
        }
    }


    __formFilterByParameters(objectInterface, parameters){
        let filter;
        if(!parameters.filter || Object.keys(parameters.filter).length === 0){
            filter = {comparisons: {}, tree: {}}
        }
        else{
            filter = parameters.filter;
        }
        if(parameters.values && parameters.values.length > 0) {
            let pk = this.__getPrimaryKey(objectInterface);
            let fValues = parameters.values.map(v => v[pk]);
            filter.comparisons["123pkvalues321"] = {
                left: {
                    type: "field",
                    value: pk
                },
                right: {
                    type: "value",
                    value: fValues
                },
                sign: "in"
            };
            filter.tree = {
                or: ["123pkvalues321", filter.tree]
            };
        }
        return filter;
    }

    __loadConfig(dir = __dirname){
        try {
            this.__config = JSON.parse(fs.readFileSync(`${dir}/../configs/${this.__name}.json`, 'utf8'));
        }
        catch(e){
            this.__config = {};
        }
    }

    __throw(message){
        throw `Плагин ${this.__name}. ${message}`
    }

    async run(parameters, token){
        throw `Класс '${this.constructor.name}' не имеет определения метода запуска плагина.`;
    }
}

export {service as service}