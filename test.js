//let _ = require('lodash');
import {_} from 'lodash';

export function clone(value){
    return _.cloneDeep(value);
}

//module.exports = clone;