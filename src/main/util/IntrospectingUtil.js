import {EntityParserUtil} from "../util/entityParserUtil";
import * as _ from "lodash";
import * as textM from "../util/TextM";

export class IntrospectingUtil {

    static async init(initedView) {
        let entityClassFieldsActions = EntityParserUtil.parse(await initedView.query(textM.role.objects, textM.dbMethod.get, {
            fields: ["ref.objects_fields.ID", "ref.objects_fields.description",
                "ref.objects_actions.ID", "ref.objects_actions.description"]
        }));
        IntrospectingUtil.prototype.entityClassesFieldsActions = entityClassFieldsActions;
    }

    static getEntityClass(objectDescription) {
        let entityClassesFieldsActions = _.cloneDeep(IntrospectingUtil.prototype.entityClassesFieldsActions);
        return entityClassesFieldsActions.filter(entityClass => entityClass.fields.description === objectDescription)[0];
    }

    static getEntityClassFields(objectDescription) {
        let entityClass = IntrospectingUtil.getEntityClass(objectDescription);
        let objectsFields = entityClass.refs.objects_fields;
        return objectsFields;
    }


}