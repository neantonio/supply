import * as _ from "lodash";

export class ArraysUtil {

    static flatMap(array) {
        let reduce = _.reduce(array, (result, array) => _.union(result, array), []);
        array.filter(v => !Array.isArray(v)).forEach(v => reduce.push(v));
        return reduce;
    }
}