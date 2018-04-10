import {adapter} from './reference_pg';

class stages_procurementCommission_votes_pg extends adapter{
    constructor(...args){
        super(...args)
    }

    async init(){
        await super.init();
    }

    __checkValues(values){
        return values.map(v => {
            let res = {};
            let voteFields = ["fVote", "sVote", "chVote"];
            for(let f in v)
                if(voteFields.indexOf(f) < 0)
                    res[f] = v[f];
            return res;
        })
    }

    async insert(values, parameters){
        return super.insert(this.__checkValues(values), parameters);
    }

    async update(filter, values, parameters, objInfo){
        return super.update(filter, this.__checkValues(values), parameters, objInfo);
    }

    async __vote(filter, objInfo, vote){
        let records = (await this.get([], filter, {}, objInfo)).records[this.__interface.name];
        if(records.length === 0)
            return {
                records: []
            };

        let qid = {};
        let refKey = this.__getRefKey(this.__interface);
        let pk = this.__getPK();
        let IDs = [];
        records.forEach(r => {
            if(qid[r[refKey]])
                throw `Нельзя голосовать сразу за несколько поставщиков для одной позиции.`;
            qid[r[refKey]] = r.supplier;
            IDs.push(r[pk]);
        });
        let fFilter = {
            comparisons:{
                PK:{
                    left:{
                        type: "field",
                        value: refKey
                    },
                    right: {
                        type: "value",
                        value: Object.keys(qid)
                    },
                    sign: "in"
                }
            },
            tree: {and: ["PK"]}
        };
        await super.update(fFilter, [{[vote]: 'false'}], {}, {});
        let tFilter = {
            comparisons:{
                PK:{
                    left:{
                        type: "field",
                        value: refKey
                    },
                    right: {
                        type: "value",
                        value: IDs
                    },
                    sign: "in"
                }
            },
            tree: {and: ["PK"]}
        };
        return super.update(filter, [{[vote]: 'true'}], objInfo);
    }

    async chVote(filter, parameters, objInfo){
        return this.__vote(filter, objInfo, "chVote");
    }

    async sVote(filter, parameters, objInfo){
        return this.__vote(filter, objInfo, "sVote");
    }

    async fVote(filter, parameters, objInfo){
        return this.__vote(filter, objInfo, "fVote");
    }
}

export {stages_procurementCommission_votes_pg as adapter};