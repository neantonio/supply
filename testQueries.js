'use strict'

import {objectView} from './objectView';


let ov = new objectView("supplyWithRoles");

async function addToScheme(){
    let r = {
        fields:{
            "old.records.refs.query_position.fields.ID":"values.qid",
            "old.records.refs.query_position.fields.tz":"values.tz",
            "old.records.refs.query_position.fields.productID":"values.productID",
            "old.records.refs.query_position.fields.commentary":"values.commentary"
        },
        behavior:{},
        priority: 'first'
    };
    ov.__objectViews['supply'].__addSubscriber('post', 'query', 'active', 'stages', 'insert', r);
}

ov.init()
    .then(() => {
        return addToScheme();
        /*
        return ov.query("supply.query", "active", {
                "filter":
                    {"comparisons":
                        {"ID":
                            {
                                "left":{"type":"field","value":"ID"},
                                "right":{"type":"value","value":["02b9829a-d251-4d89-8925-954c82fc0a91"]},
                                "sign":"in"
                            }
                        },
                        "tree":
                        {
                            "and":["ID"]
                        }
                    }
            });
            */
    })
    .then(() => {
    /*
    let tFilter = {
        "comparisons":
            {"ID":
                {
                    "left":{"type":"field","value":"ID"},
                    "right":{"type":"value","value":"88537979-9051-3b49-796a-a750b5a5a73b"},
                    "sign":"equal"
                }
            },
            "tree":
            {
                "and":["ID"]
            }
        };
        return ov.query("supply.stages_procurementCommission", "toNext", {filter: tFilter});
        */
        return ov.query("supply.query", "get", {
           /* fields:["ref.users_filters.filterID.ref.filters_actions.actionID.objectID.description"],
            filter: {
                comparisons: {
                    name: {
                        left: {type: "field", value: "ref.users_tokens.token"},
                        right: {type: "value", value: "1234v234141"},
                        sign: "equal"
                    }
                },
                tree: {and: ["name"]}
            },*/
            parameters: {
                orderBy: [{field:"description", sort: "desc"}]
            }
        });
    })
    .then((r) => {
        //console.log();
    })
    .catch(e =>{
        console.log(e);
    })