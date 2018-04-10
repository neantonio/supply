import {sender} from "./baseClasses/sendClass";
import {util} from "./baseClasses/utilityClass";
import {service} from "./baseClasses/service";

class pluginClass extends service{
    constructor(){
        super(name);
        this.name = name;
    }

    __checkParameters(parameters){
        if(!parameters.parameters.object || !parameters.parameters.project){
            this.__throw("Необходимо указать параметры 'проект' и 'объект' для определения куратора.");
        }
    }

    __getAdditionalFields(project, object){
        if(!this.__config.groupInfo[project] || !this.__config.groupInfo[project][object]){
            this.__throw(`В конфигурации отсутствует описание для объекта '${object}' в проекте '${project}'`);
        }


        let additionalFields = [];
        for(let initiatorInfo of this.__config.groupInfo[project][object]){
            let {email} = initiatorInfo || null;
            additionalFields.push(email);

            // дополняем массив дополнительных полей
            additionalFields = additionalFields.concat(
                // перебираем все ячейки в описании
                initiatorInfo.fields
                    // достаем только ячейки с типом field
                    .filter(cell => cell.type === 'field')
                    // вытаскиваем значения доп.полей
                    .map(cell => cell.value)
            );
        }
        return additionalFields;
    }

    __formFilterForObjectByPrimaryKeyValues(objectInterface, primaryKeyValues){
        return {
            comparisons: {
                pks:{
                    left:{
                        type: "field",
                        value: this.__getPrimaryKey(objectInterface)
                    },
                    right:{
                        type: "value",
                        value: primaryKeyValues
                    },
                    sign: "in"
                }
            },
            tree: {
                and: ['pks']
            }
        }
    }

    __getRecordsFromObjectByFilter(project, object, filter = {}){
        return sender.send({
            object: `${project}.${object}`,
            method: "get",
            parameters: {
                filter: filter,
                fields: this.__getAdditionalFields(project, object)
            }
        });
    }

    __sendEmails(project, emails){
        return sender.send({
            object: `${project}.${this.__config.emailSenders[project]}`,
            method: "insert",
            parameters: {
                values: emails
            }
        });
    }

    __formEmailFromObject(email, title, tasks){
        return {
            to: email,
            description: title,
            body: util.HTMLTableFromArrays(tasks)
        }
    }

    __processObjectRecords(project, object, records){
        let tasks = {};
        let withoutInitiator = [],
            withoutMentor = [];

        for(let rID in records){
            let rowEmails = [];
            for(let oneInitiatorInfo of this.__config.groupInfo[project][object]){
                // Достаем почту инициатора
                let initiatorEmail = util.getInnerFieldFromStructure(records[rID], oneInitiatorInfo.email)
                    .filter(name => name !== null)[0];
                // если данная позиция еще не была добавлена в письмо инициатору
                if(initiatorEmail && rowEmails.indexOf(initiatorEmail) < 0){
                    // если на данный адрес еще не было прикреплено ни одной позиции
                    if(!tasks[initiatorEmail]) {
                        tasks[initiatorEmail] = {
                            title: oneInitiatorInfo.title,
                            fields: oneInitiatorInfo.fields,
                            rows: [ oneInitiatorInfo.fields.map(field => field.title) ]
                        };
                    }
                    let toEmailRow = [];
                    for(let fieldInfo of tasks[initiatorEmail].fields){
                        let fieldValue;
                        if(fieldInfo.type === "field") {
                            fieldValue = util.getInnerFieldFromStructure(records[rID], fieldInfo.value)
                                .filter(name => name !== null)[0];
                        }
                        else if(fieldInfo.type === "value"){
                            fieldValue = fieldInfo.value;
                        }
                        toEmailRow.push(fieldValue);
                    }
                    tasks[initiatorEmail].rows.push(toEmailRow);
                    rowEmails.push(initiatorEmail);
                }
            }
        }

        return {
            tasks: tasks
        }
    }

    async run(parameters, token, deep = 0){
        this.__checkParameters(parameters);
        console.log("get parameters");
        let {project, object} = parameters.parameters;

        console.log("get interface");
        let objectInterface = await this.__getInterface(project, object);

        console.log("form filter");
        let objectFilter = this.__formFilterByParameters(objectInterface, parameters);

        console.log("get records");
        let records = await this.__getRecordsFromObjectByFilter(project, object, objectFilter);

        console.log("get parameters");
        let {tasks} = this.__processObjectRecords(project, object, records);

        let emails = [];
        for(let email in tasks){
            emails.push(this.__formEmailFromObject(email, tasks[email].title, tasks[email].rows));
        }
        await this.__sendEmails(project, emails);
    }
}

let name = "sendMessageToInitiator";
let plugin = new pluginClass();

export {
    plugin as plugin,
    name as name
}