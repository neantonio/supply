import {adapter} from './reference_pg';
import {logger} from '../Logger/controller';
import * as fs from "fs";

class fileStorage extends adapter{

    __checkFolder(){
        if(!fs.existsSync(this.__folder)){
            fs.mkdirSync(this.__folder);
        }

        if(!fs.statSync(this.__folder).isDirectory()){
            throw `Невозможно создать объект '${this.__interface.name}' типа 'fileStorage'.`;
        }

        this.__folder += `\\${this.__interface.name}`;

        if(!fs.existsSync(this.__folder)){
            fs.mkdirSync(this.__folder);
        }
    }

    constructor(...args){
        super(...args);
        this.__folder = __dirname + "\\..\\Storage";
    }

    async init(){
        await super.init();
        //await gdriveUpload.init();
        await this.__checkFolder();
    }

    async __saveToFile(name, content){
        fs.writeFileSync(name, content);
    }

    async __insertRecordToObject(record){
        let content = record.file;
        delete record.file;
        let newRecord = await super.insert([record]);
        //record.content = content;
        await this.__saveToFile(`${this.__folder}/${record.ID}`, content);
        return record;
    }

    async insert(values, parameters){
        let inserts = values.map(record => this.__insertRecordToObject(record));
        let newRecords = await Promise.all(inserts);
        return {
            records: {
                [this.__interface.name]: newRecords
            }
        };
    }

    __download(ID){
        // read binary data
        let bitmap = fs.readFileSync(`${this.__folder}/${ID}`);
        // convert binary data to base64 encoded string
        return new Buffer(bitmap).toString('base64');
    }

    async update(filter, values, parameters, objInfo){
        if(values[0].file){
            let records = (await super.get([], filter, {}, objInfo)).records;
            if(Object.keys(records)[0]) {
                let record = records[Object.keys(records)[0]];
                await this.__saveToFile(`${this.__folder}/${record.ID}`, values[0]);
                delete record.file;
                return {
                    records: {
                        [this.__interface.name]: [record]
                    }
                }
            }
            else{
                return {
                    records: {
                        [this.__interface.name]: []
                    }
                };
            }
        }
        else {
            return super.update(filter, values, objInfo);
        }
    }

    async download(filter, parameters, objInfo){
        let result = await super.get([], filter, {}, objInfo);
        for(let row of result.records[this.__interface.name]){
            row.file = this.__download(row.ID);
        }
        return result;
    }

    async delete(filter, parameters, objInfo){
        //let records = await super.get([], filter, {}, objInfo);
        return await super.delete(filter, objInfo);
        /*for(let row in records[this.__interface.name]){
            try {
                await gdriveUpload.delete(row.file);
            }
            catch
        }*/
        //return result;
    }
}

export {fileStorage as adapter};