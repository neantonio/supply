import {sender} from "./baseClasses/sendClass";
import {util} from "./baseClasses/utilityClass";
import {service} from "./baseClasses/service";

class pluginClass extends service{
    constructor(){
        super(name);
    }

    __checkConfiguration(project, object){
        if(!this.__config[project] || !this.__config[project].objects[object]){
            throw `Для объекта '${project}.${object}' не описана конфигурация для поля 'Создатель'.`;
        }
    }

    __checkInitiatorField(project, object, objectInterface){
        let fieldName = this.__config[project].objects[object];

        if(objectInterface.fields[fieldName].type !== "link" &&
            this.__config[project].objects[object].link !== this.__config[project].initiatorTable){
            throw `Конфигурация объекта '${project}.${object}' не соответствует его интерфейсу`;
        }
    }

    __checkParameters(parameters){
        if(!parameters.parameters.project || !parameters.parameters.object){
            throw "Необходимо указать параметры 'проект' и 'объект' для определения инициатора."
        }
    }

    __formFilterForHistory(project, object, action, ids){
        return {
            comparisons:{
                action:{
                    left: {
                        type: "field",
                        value: "actionID.description"
                    },
                    right: {
                        type: "value",
                        value: action
                    },
                    sign: "equal"
                },
                object:{
                    left: {
                        type: "field",
                        value: "objectID.description"
                    },
                    right: {
                        type: "value",
                        value: `${project}.${object}`
                    },
                    sign: "equal"
                },
                IDs: {
                    left: {
                        type: "field",
                        value: "ref.history_instances.entityID"
                    },
                    right: {
                        type: "value",
                        value: ids
                    },
                    sign: "in"
                }
            },
            tree: {
                and: ["action", "object", "IDs"]
            }
        }
    }

    __formFieldsListForHistory() {
        return [
            "userID.ID",
            "userID.description",
            "ref.history_instances.historyID",
            "ref.history_instances.entityID"
        ];
    }

    __getInitiatorsForIds(history, ids){
        let initiators = {};
        for(let historyID in history){
            let historyRec = history[historyID];
            let userID = historyRec.fields.userID.ID;
            for(let historyInstanceID in historyRec.refs.history_instances){
                let instance = historyRec.refs.history_instances[historyInstanceID];
                let entityID = instance.fields.entityID;
                if(ids.indexOf(entityID) >= 0){
                    if(!initiators[userID]){
                        initiators[userID] = [];
                    }
                    initiators[userID].push(entityID);
                }
            }
        }
        return initiators;
    }

    __getHistory(project, object, ids){
        return sender.send({
            object: "role.history",
            method: "get",
            parameters: {
                filter: this.__formFilterForHistory(project, object, "insert", ids),
                fields: this.__formFieldsListForHistory()
            }
        });
    }

    __getFilterForEntityByPK(pkName, values){
        return {
            comparisons: {
                IDs: {
                    left: {
                        type: "field",
                        value: pkName
                    },
                    right: {
                        type: "value",
                        value: values
                    },
                    sign: "in"
                }
            },
            tree: {
                and: ["IDs"]
            }
        }
    }

    async __updateInitiatorForIds(project, object, initiatorID, entityIDs, objectInterface){
        let primaryKey = this.__getPrimaryKey(objectInterface);

        return sender.send({
            object: `${project}.${object}`,
            method: "update",
            parameters: {
                values: [{
                    [this.__config[project].objects[object]]: initiatorID
                }],
                filter: this.__getFilterForEntityByPK(primaryKey, entityIDs)
            }
        });
    }

    async __setInitiators(project, object, initiatorInfo, objectInterface){
        let fieldInfo = {};
        let updateField = this.__config[project].objects[object];
        let primaryKey = this.__getPrimaryKey(objectInterface);

        let updateRecords = [];
        for(let initiatorID in initiatorInfo){
            await this.__updateInitiatorForIds(project, object, initiatorID, initiatorInfo[initiatorID], objectInterface);
            updateRecords = updateRecords.concat(initiatorInfo[initiatorID].map(pk => {
                return {
                    [primaryKey]: pk,
                    [updateField]: initiatorID
                }
            }))
        }

        return updateRecords;
    }

    async run(parameters, token, deep = 0){
        console.log("Set initiator start");
        this.__checkParameters(parameters);

        let {project, object} = parameters.parameters;

        this.__checkConfiguration(project, object);


        console.log("Get interface");
        let objectInterface = await this.__getInterface(project, object);

        console.log("Check initiator field");
        this.__checkInitiatorField(project, object, objectInterface);

        console.log("Get object IDs");
        let objectIDs = await this.__getObjectIDs(project, object, parameters.filter);
        console.log("Get histiry");
        let history = await this.__getHistory(project, object, objectIDs);

        if(Object.keys(history).length === 0){
            console.log("History is not filled");
            if(deep === 0) {
                let self = this;
                setTimeout(() => {
                        self.run(parameters, token, 1);
                    }, 3000
                );
            }
            return {
                records: []
            }
        }
        else {
            let initiatorInfo = this.__getInitiatorsForIds(history, objectIDs);

            console.log("Set initiator");
            let updateRecords = await this.__setInitiators(project, object, initiatorInfo, objectInterface);

            return {
                records: updateRecords
            };
        }
    }
}

let name = "setInitiator";
let plugin = new pluginClass();

export {
    plugin as plugin,
    name as name
}
