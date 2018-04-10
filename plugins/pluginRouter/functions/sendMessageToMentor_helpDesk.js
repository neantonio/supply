import {sender} from "./baseClasses/sendClass";
import {util} from "./baseClasses/utilityClass";
import {service} from "./baseClasses/service";
import * as _ from "lodash";

/**
 * Модуль выполняет отправку писем ответственным за выполнение!
 * */
class pluginClass extends service{
    constructor(){
        super(name);
        this.name = name;
    }

    __checkParameters(parameters){
        if(!parameters.parameters.object){
            this.__throw("Необходимо указать параметры 'объект' для определения куратора.");
        }
    }

    __getAdditionalFields(object){
        if(!this.__config.groupInfo[object]){
            this.__throw(`В конфигурации отсутствует описание для объекта '${object}'`);
        }
        let {name: mName, email: mEmail} = this.__config.groupInfo[object].mentor;
        let {name: iName, email: iEmail} = this.__config.groupInfo[object].initiator;
        return [mName, mEmail, iName, iEmail, this.__config.groupInfo[object].taskName]
    }

    __formFilterForObjectByID(objectInterface, ids){
        return {
            comparisons: {
                ids:{
                    left:{
                        type: "field",
                        value: this.__getPrimaryKey(objectInterface)
                    },
                    right:{
                        type: "value",
                        value: ids
                    },
                    sign: "in"
                }
            },
            tree: {
                and: ['ids']
            }
        }
    }

    __getRecordsFromObjectByFilter(object, filter = {}){
        return sender.send({
            object: `helpDesk.${object}`,
            method: "get",
            parameters: {
                filter: filter,
                fields: this.__getAdditionalFields(object)
            }
        });
    }

    __sendEmails(emails){
        return sender.send({
            object: `helpDesk.emailSender`,
            method: "insert",
            parameters: {
                values: emails
            }
        });
    }

    __formEmailFromObject(object, email, tasks){
        return {
            to: email,
            description: "Новые заявки",
            body: util.HTMLTableFromArrays([[
                "Задача",
                this.__config.groupInfo[object].initiator.title,
                "Email",
                "Ссылка на справочник"
            ]].concat(tasks))
        }
    }

    __processObjectRecords(records, object){
        let tasks = {};
        let withoutInitiator = [],
            withoutMentor = [];
        for(let rID in records){
            // ToDo: здесь нужно переписать, если информация будет доставаться из ТЧ, где может быть несколько ответственных и(или) у ответственного может быть несколько адресов эл.почты 
            let initiatorName = util.getInnerFieldFromStructure(records[rID], this.__config.groupInfo[object].initiator.name)
                .filter(name => name !== null)[0];
            let initiatorEmail = util.getInnerFieldFromStructure(records[rID], this.__config.groupInfo[object].initiator.email)
                .filter(email => email !== null)[0];
            let mentorName = util.getInnerFieldFromStructure(records[rID], this.__config.groupInfo[object].mentor.name)
                .filter(name => name !== null)[0];
            let mentorEmail = util.getInnerFieldFromStructure(records[rID], this.__config.groupInfo[object].mentor.email)
                .filter(email => email !== null)[0];

            if(!initiatorEmail || !initiatorName){
                withoutInitiator.push(rID);
            }
            else if(mentorEmail){
                if (!tasks[mentorEmail]) {
                    tasks[mentorEmail] = [];
                }
                let task = [
                    util.getInnerFieldFromStructure(records[rID], this.__config.groupInfo[object].taskName),
                    initiatorName || "Не указано",
                    initiatorEmail || "Не указано",
                    `<a href="${this.__config.url}#objView=helpDesk&object=${object}">Тык сюда</a>`
                ];

                tasks[mentorEmail].push(task);
            }
            else{
                withoutMentor.push(rID);
            }
        }

        return {
            tasks: tasks,
            withoutMentor: withoutMentor,
            withoutInitiator: withoutInitiator
        }
    }

    async run(parameters, token, deep = 0){
        this.__checkParameters(parameters);

        let {object} = parameters.parameters;
        let objectInterface = await this.__getInterface("helpDesk", object);
        let objectFilter = this.__formFilterByParameters(objectInterface, parameters);
        let records = await this.__getRecordsFromObjectByFilter(object, objectFilter);
        let {tasks, withoutInitiator} = this.__processObjectRecords(records, object);

        if(withoutInitiator.length > 0) {
            let filter = this.__formFilterForObjectByID(objectInterface, withoutInitiator);
            await sender.send({
                object: `helpDesk.${object}`,
                method: "setInitiator",
                parameters: {
                    filter: filter
                }
            });

            let updatedRecords = await this.__getRecordsFromObjectByFilter(object, this.__formFilterForObjectByID(objectInterface, withoutInitiator));
            let {tasks: newTasks} = this.__processObjectRecords(updatedRecords, object);
            _.mergeWith(tasks, newTasks, (left, right) => left.concat(right))
        }

        let emails = [];
        for(let email in tasks){
            emails.push(this.__formEmailFromObject(object, email, tasks[email]));
        }
        await this.__sendEmails(emails);
    }
}

let name = "sendMessageToMentor_helpDesk";
let plugin = new pluginClass();

export {
    plugin as plugin,
    name as name
}