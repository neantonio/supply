import * as textM from "../../main/util/TextM";
import {EntityParserUtil} from "../../main/util/entityParserUtil";
import {EntityBuilder} from "../../main/util/EntityBuilder";

export class PopulateHistoryTest {

    constructor(subscriberView) {
        this.objView = subscriberView;
        this.interfaceInstance = null;
    }

    async populate() {

        this.interfaceInstance = await this.objView.getInterface();
        let objects = await this._addObject();
        let objectsActions = await this._addObjectActions(objects);
        let objectsFields = await this._addObjectsFields(objects);
        let signs = await this._addSigns();
        let filters = await this._addFilter();
        let filtersActions = await this._addFiltersActions(filters, objectsActions);
        let users = await this._addUsers();
        let usersFilters = await this._addUsersFilters(users, filters);
    }

    async _addObject() {
        let objectsList = EntityParserUtil.parse(await this.objView.query(textM.role.objects, textM.dbMethod.get, {}));
        if (objectsList.length > 0) {
            return objectsList;
        }
        let entityClasses = [];
        this._recurcyAddObjects(this.interfaceInstance.objectViews, entityClasses);
        let insertedObjects = await this.objView.query(textM.role.objects, textM.dbMethod.insert, {
            values: entityClasses
        });
        return EntityParserUtil.parse(insertedObjects);
    }

    _recurcyAddObjects(objectAssociateArray, resultObjectDescriptionList, superEntityDescription) {
        for (let property in objectAssociateArray) {
            let objectDescription;
            if (superEntityDescription !== undefined && superEntityDescription !== "" && superEntityDescription !== null) {
                objectDescription = `${superEntityDescription}.${property}`
            } else {
                objectDescription = property;
            }
            resultObjectDescriptionList.push(EntityBuilder.buildObject(objectDescription));
            let entity = objectAssociateArray[property];
            if (entity.objects !== undefined) {
                this._recurcyAddObjects(entity.objects, resultObjectDescriptionList, objectDescription);
            }
        }
    }


    async _addObjectActions(objects) {
        let actionList = EntityParserUtil.parse(await this.objView.query(textM.role.objects_actions, textM.dbMethod.get, {}));
        if (actionList.length > 0) {
            return actionList;
        }
        let actionsArray = [];
        for (let object of objects) {
            let objectID = object.fields.ID;
            for (let method in EntityBuilder.buildEntityFromInterface(object.fields.description, this.interfaceInstance).methods) {
                actionsArray.push(EntityBuilder.buildObjectAction(method, objectID));
            }
        }
        let insertedObjectsAction = await this.objView.query(textM.role.objects_actions, textM.dbMethod.insert, {
            values: actionsArray
        });
        return EntityParserUtil.parse(insertedObjectsAction);
    }



    async _addObjectsFields(objects) {
        let objectFields = EntityParserUtil.parse((await this.objView.query(textM.role.filters_fields, textM.dbMethod.get, {})));
        if (objectFields.length > 0) {
            return objectFields;
        }

        let fieldsArray = [];
        for (let object of objects) {
            let objectID = object.fields.ID;
            for (let field in EntityBuilder.buildEntityFromInterface(object.fields.description, this.interfaceInstance).fields) {
                fieldsArray.push(EntityBuilder.buildObjectField(field, objectID));
            }
        }
        let insertedObjectsFields = await this.objView.query(textM.role.objects_fields, textM.dbMethod.insert, {
            values: fieldsArray
        });
        return EntityParserUtil.parse(insertedObjectsFields);
    }


    async _addSigns() {
        let signs = EntityParserUtil.parse((await this.objView.query(textM.role.signs, textM.dbMethod.get, {})));
        if (signs.length > 0) {
            return signs;
        }

        let insertedSigns = await this.objView.query("role.signs", "insert", {
            values:
                [{"description": "равно", "sign": 'equal'},
                    {"description": "неравно", "sign": 'unEqual'},
                    {"description": "больше", "sign": 'greater'},
                    {"description": "меньше", "sign": 'less'},
                    {"description": "больше или равно", "sign": 'greaterEqual'},
                    {"description": "меньше или равно", "sign": 'lessEqual'},
                    {"description": "входит в множество", "sign": 'in'},
                    {"description": "входит в иерархическую группу", "sign": 'rin'},
                    {"description": "включает в себя (операция со строками)", "sign": 'consist'},
                ]
        });
        return EntityParserUtil.parse(insertedSigns);
    }


    async _addFilter() {
        let filters = EntityParserUtil.parse((await this.objView.query(textM.role.filters, textM.dbMethod.get, {})));
        if (filters.length > 0) {
            return filters;
        }
        let filtersArray = []
        filtersArray.push(EntityBuilder.buildFilter("adminFilter"));
        let insertedFilters = await this.objView.query(textM.role.filters, textM.dbMethod.insert, {
            values: filtersArray
        });
        return EntityParserUtil.parse(insertedFilters);
    }


    async _addFiltersActions(filters, objectsActions) {
        let filtersActions = EntityParserUtil.parse((await this.objView.query(textM.role.filters_actions, textM.dbMethod.get, {})));
        if (filtersActions.length > 0) {
            return filtersActions;
        }
        let insertedFiltersAction = [];

        for (const filter of filters) {
            for (const objectAction of objectsActions) {
                insertedFiltersAction.push(EntityBuilder.buildFilterAction(objectAction, filter));
            }
        }
        filtersActions = await this.objView.query(textM.role.filters_actions, textM.dbMethod.insert, {
            values: insertedFiltersAction
        });
        return EntityParserUtil.parse(filtersActions);
    }


    async _addUsers() {
        let users = EntityParserUtil.parse((await this.objView.query(textM.role.users, textM.dbMethod.get, {})));
        if (users.length > 0) {
            return users;
        }
        let insertedUsersArray = [];
        insertedUsersArray.push(EntityBuilder.buildUser("admin", "admin@mail.ru", "admin", "admin"));
        let insertedUsers = await this.objView.query(textM.role.users, textM.dbMethod.insert, {
            values: insertedUsersArray
        });
        return EntityParserUtil.parse(insertedUsers);
    }


    async _addUsersFilters(users, filters) {
        let userFilters = EntityParserUtil.parse(await this.objView.query(textM.role.users_filters, textM.dbMethod.get, {}));
        if (userFilters.length > 0) {
            return userFilters;
        }
        let usersFiltersArray = [];
        for (let user of users) {
            for (let filter of filters) {
                usersFiltersArray.push(EntityBuilder.buildUserFilters(user, filter));
            }
        }
        let insertedUserFilters = await this.objView.query(textM.role.users_filters, textM.dbMethod.insert, {
            values: usersFiltersArray
        });
        let parsedEntity = EntityParserUtil.parse(insertedUserFilters);
        return parsedEntity;
    }
}
