import {adapter} from './reference_pg';
import {gdriveUpload} from '../Utilits/gdriveUpload';
import {logger} from '../Logger/controller';

class fileStorage extends adapter{
    constructor(...args){
        super(...args);
    }

    async init(){
        await super.init();
        await gdriveUpload.init();
    }

    async __reload(filename = "newFile", fileID){
        let content;
        try{
            content = await gdriveUpload.download(fileID);
        }
        catch(e){
            logger.write(`warning`, `Ошибка при загрузке файла. ${e}`, new Error());
            throw `Ошибка при загрузке файла.`;
        }

        return await gdriveUpload.upload((new Date()).toISOString() + "__" +  filename, (new Buffer(content).toString('base64')));
    }

    async insert(values, parameters){
        for(let i = 0; i<values.length; ++i){
            let v = values[i];
            if(!v.file && !v.fileID ){
                logger.write(`warning`, `Не указаны параметры и содержимое загружаемого файла`, new Error());
                values.splice(i--, 1);
                continue;
                // throw `Не указаны параметры и содержимое загружаемого файла`;
            }
            let newName = (new Date()).toISOString() + "__" + v.description + "." + v.extension;
            v.fileID = v.file
                ? await gdriveUpload.upload(newName, v.file)
                : await this.__reload(newName, v.fileID);
            v.file = null;
            values[i] = v;
        }
        return super.insert(values);
    }

    async update(filter, values, parameters, objInfo){
        if(values[0].fileID) {
            let fileIDfilter = {
                comparisons: {
                    fID: {
                        right: {type: "field", value: "fileID"},
                        left: {type: "value", value: values[0].fileID},
                        sign: "equal"
                    }
                },
                tree: {"and": ["fID"]}
            };
            let records = (await super.get([], fileIDfilter, {}, objInfo)).records;
            if(records[this.__interface.name].length === 0){
                values[0].fileID = await this.__reload("tmpFile", values[0].fileID);
            }
        }

        for(let v of values){
            if(v.file){
                delete v.file;
            }
        }
       return super.update(filter, values, objInfo);
    }

    async download(filter, parameters, objInfo){
        let result = await super.get([], filter, {}, objInfo);
        for(let row of result.records[this.__interface.name]){
            row.file = await gdriveUpload.download(row.fileID);
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