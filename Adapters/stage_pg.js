import {adapter} from './reference_pg';
import _ from 'lodash';

class stage_pg extends adapter {
    constructor(...args) {
        super(...args);
    }

    async init(){
        await super.init();
    }

    async toNext(filter, objInfo = {}){
        //logger.write(`debug`, `Get вместо toNext`);
        return await super.get([], filter, {}, objInfo);
    }

    async insert(values, parameters){
        let cDate = (new Date()).toJSON();
        let newValues = values.map(v => {
            let nVal = _.cloneDeep(v);
            nVal.date = cDate;
            return nVal;
        });
        return await super.insert(newValues, parameters);
    }

    __updateRecordsToNowDate(values, parameters){
        let PK = this.__getPK();
        let PKs = values.map(r => r[PK]);
        let filter = {
            comparisons:{
                PK: {
                    left: {
                        type: "field",
                        value: PK
                    },
                    right: {
                        type: "value",
                        value: PKs
                    },
                    sign: "in"
                }
            },
            tree: {and: ["PK"]}
        };
        return super.update(filter, [{date: new Date()}], parameters, {});
    }

    async copy(fields, filter, parameters, objInfo){
        let copyResult = await super.copy(fields, filter, parameters, objInfo);
        return await this.__updateRecordsToNowDate(copyResult.records[this.__interface.name]);
    }
}

export {stage_pg as adapter};