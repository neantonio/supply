"use strict";

import {adapter} from './Adapters/scheme_pg';

let tSch = new adapter({
    fields: {
        "ID": {},
        "name": {},
        "v1": {},
        "testField": {}
    }
}, "gag", []);

let filter = {
    comparisons: {
        a: {
            right: {
                type: "value",
                value: "111"
            },
            left: {
                type: "field",
                value: "v1"
            },
            sign: "equal"
        },
        b: {
            right: {
                type: "value",
                value: "333"
            },
            left: {
                type: "field",
                value: "s1s"
            },
            sign: "equal"
        },
        c: {
            right: {
                type: "value",
                value: "123"
            },
            left: {
                type: "field",
                value: "name"
            },
            sign: "equal"
        }
    },
    tree: {
        or: [{and: ["a", "c"]}, {and: ["b"]}]
    }
};

let values = [{
    testField: "sss"
}];

tSch.update(filter, values)
    .catch((e) => {
        console.log(2);
    });