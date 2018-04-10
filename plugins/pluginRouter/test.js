import * as _ from "lodash";

function test(a, b){
    return  _.concat(a, b)
}

let a = {e: [1,2,3]};
let b = {e: [2,3,4]};
let c = _.mergeWith(a, b, (left, right) => left.concat(right));

console.log()