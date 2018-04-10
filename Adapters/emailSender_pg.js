import {adapter} from './reference_pg';
import {email} from '../Utilits/email';
import {logger} from '../Logger/controller';

class emailSender extends adapter{
    constructor(...args){
        super(...args)
    }

    async insert(values, parameters){
        let letters = [];
        for(let v of values){
            if(!v.to){
                logger.write(`warning`, `Для одного из писем не указан получатель`, new Error());
                throw `Для одного из писем не указан получатель`;
            }
            v.description = v.description || "Без темы";
            v.from = v.from || '"HelpDesk" supply@groupstp.ru';
            v.body = v.body || "";
            letters.push({
                subject: v.description || "Без темы",
                to: v.to,
                replyTo: v.from || "supply@groupstp.ru",
                body: v.body || ""
            });
            v.date = new Date();
        }
        let result;
        try {
            await email.sendEmails(letters);
            result = await super.insert(values.map(v => {
                v.sended = true;
                return v;
            }));
        }
        catch(e){
            logger.write(`warning`, `Ошибка при отправке эл.почты.`, new Error());
            result = await super.insert(values.forEach(v => {
                v.sended = false;
                return v;
            }));
            throw `Ошибка при отправке эл.почты.`;
        }
        return result;
    }
}

export {emailSender as adapter};