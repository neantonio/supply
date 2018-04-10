import {adapter} from "./reference1C_pg";

class product_pg extends adapter{
    insert(values){
        return super.insert(values.map(
            record => {
                record.date = (new Date).toISOString();
                return record;
            }
        ));
    }

    update(filter, values, parameters, objInfo){
        return super.update(filter, values.map(
            record => {
                if("date" in record){
                    delete record.date;
                }
                return record;
            }
        ), objInfo);
    }

    get(fields = [], filter, parameters, objInfo){
        if( !filter || !filter.tree || !filter.comparisons || Object.keys(filter.comparisons).length == 0 ){
            filter = {
                comparisons: {
                    parent: {
                        left: {type: "field", value: "parentID"},
                        right: {type: "value", value: ""},
                        sign: "equal"
                    }
                },
                tree: {and: ["parent"]}
            }
        }
        return super.get(fields, filter, parameters, objInfo);
    }
}

export {product_pg as adapter};