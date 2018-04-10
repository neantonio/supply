import * as textM from "./TextM";
import * as  PropertyPath from "property-path";

export class EntityBuilder {

    static buildEntityFromInterface(objectDescription, interfaceInstance) {
        let pathArray = objectDescription.split(".");
        let interfacePath = pathArray[0];
        for (let i = 1; i < pathArray.length; i++) {
            let path = `objects.${pathArray[i]}`;
            interfacePath = `${interfacePath}.${path}`;
        }
        let result = PropertyPath.get(interfaceInstance.objectViews, interfacePath);
        return result;
    }

    static buildObject(description) {
        return {[textM.fields.description]: description};
    }

    static buildObjectAction(method, objectID) {
        return {[textM.fields.description]: method, [textM.fields.objectId]: objectID};
    }

    static buildObjectField(field, objectID) {
        return {[textM.fields.description]: field, [textM.fields.objectId]: objectID}
    }

    static buildFilter(description) {
        return {[textM.fields.description]: description};
    }

    static buildFilterAction(objectAction, filter) {
        return {
            [textM.fields.description]: `${objectAction.fields.description} ${filter.fields.description}`,
            [textM.fields.actionId]: objectAction.fields.ID, [textM.fields.filterId]: filter.fields.ID
        };
    }

    static buildUser(description, email, password, user) {
        return {
            [textM.fields.description]: description,
            [textM.fields.email]: email,
            [textM.fields.password]: password,
            [textM.fields.user]: user
        }
    }

    static buildUserFilters(user, filter, filtersGroup) {
        if (!filtersGroup) {
            return {
                [textM.fields.description]: `${user.fields.description} - ${filter.fields.description}`,
                [textM.fields.filterId]: filter.fields.ID,
                [textM.fields.filtersGroup]: 1,
                [textM.fields.userId]: user.fields.ID,
            };
        }

        return {
            [textM.fields.description]: `${user.fields.description} - ${filter.fields.description}`,
            [textM.fields.filterId]: filter.fields.ID,
            [textM.fields.filtersGroup]: filtersGroup,
            [textM.fields.userId]: user.fields.ID,
        }
    }

    static buildProduct(description, parent) {
        if (parent) {
            return {description: description, parentID: parent[0].fields.ID, photo: "фото"};
        } else {
            return {description: description, photo: "фото"};
        }
    }

    static buildPosition(description, nomID, productID, queryID) {
        return {
            [textM.fields.description]: description,
            [textM.fields.nomGroup]: nomID,
            [textM.fields.productID]: productID,
            [textM.fields.queryID]: queryID
        };
    }

    static buildFilterFields(object, objectField, filter, sign, value, linkValue) {
        if (linkValue === undefined) {
            linkValue = null;
        }
        return {
            [textM.fields.description]: `${filter.fields.description} - ${object.fields.description}.${objectField.fields.description} ${sign.fields.description}  ${value}`,
            [textM.fields.fieldId]: `${objectField.fields.ID}`,
            [textM.fields.filterId]: `${filter.fields.ID}`,
            [textM.fields.signId]: `${sign.fields.ID}`,
            [textM.fields.values]: value,
            [textM.fields.linkValue]: linkValue
        };


    }

    static buildComparisons(fieldDescription, sign, value) {
        return {
            left: {type: "field", value: fieldDescription},
            right: {type: "value", value: value},
            sign: sign
        }
    }
    static buildCondition(condition){
        if (condition.type === "fieldComparisons") {
            return {
                left: {type: "field", value: condition.left.value},
                right: {type: "field", value: condition.right.value},
                sign: condition.sign
            }
        }
        console.log();
        return {
            left: {type: "field", value: condition.left.value},
            right: {type: "value", value: condition.right.value},
            sign: condition.sign
        }
    }






    static buildQuery(description, organizationID) {
        return {[textM.fields.description]: description, [textM.fields.organization]: organizationID};
    }

    static buildOrganization(description) {
        return {[textM.fields.description]: description};
    }

    static buildLinkCondition(linkName, linkValue) {
        return `{"linkName": "${linkName}", "linkValue": "${linkValue}"}`;
    }


    static buildHistory(date, actionId, entityClassId, userId) {
        return {
            [textM.fields.date]: date,
            [textM.fields.actionId]: actionId,
            [textM.fields.objectId]: entityClassId,
            [textM.fields.userId]: userId

        };
    }

    static buildHistoryInstance(entity, history) {
        return {[textM.fields.entityId]: entity.fields.ID, [textM.fields.historyId]: history.fields.ID};
    }

    static buildHistoryInstanceField(historyInstance, entityField, oldValue, newValue,) {
        return {
            [textM.fields.fieldId]: entityField.fields.ID,
            [textM.fields.valueOld]: JSON.stringify(oldValue),
            [textM.fields.valueNew]: JSON.stringify(newValue),
            [textM.fields.historyInstanceId]: historyInstance.fields.ID
        };
    }
}