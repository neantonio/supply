import * as _ from "lodash";
import * as validator from "validator";


export class EntityParserUtil {

    static parse(entityFromBD) {
        if(entityFromBD === undefined || entityFromBD === null) {
            return entityFromBD;
        }

        let entityList = _.cloneDeep(entityFromBD.records);
        let normalEntityList = _.values(entityList);
        for (let normalEntity of normalEntityList) {
            this._getNormalEntity(normalEntity);
        }
        return normalEntityList;
    }


    static _getNormalEntity(entityList) {
        for (let uuidKeyNameField in  entityList) {
            if (uuidKeyNameField === "fields") {
                this._checkFields(entityList.fields);
            }
            if (uuidKeyNameField === "refs") {
                this._checkRefs(entityList.refs);
            }
        }
        return entityList;
    }


    static _checkFields(fields) {
        for (let field in fields) {
            if (fields[field] !== null
                && fields[field] !== undefined
                && typeof (fields[field]) === 'object'
                && typeof Object.keys(fields[field])[0] === "string"
                && validator.isUUID(Object.keys(fields[field])[0])) {
                fields[field] = fields[field][Object.keys(fields[field])[0]];
                this._getNormalEntity(fields[field]);
            }
        }
    }


    static _checkRefs(refs) {
        for (let tableName in refs) {
            let values = _.values(refs[tableName]);
            refs[tableName] = values;
            for (let entity of values) {
                this._getNormalEntity(entity);
            }
        }
    }
}
