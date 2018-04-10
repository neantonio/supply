import * as textM from "../../main/util/TextM";
import {EntityParserUtil} from "../util/entityParserUtil";
import {EntityBuilder} from "../util/EntityBuilder";

const adminFilterDescription = "adminFilter";
const commonFilterDescription = "commonFilter";

export class StarterDB {

    constructor(objectView) {
        this.objView = objectView;
        this.interfaceInstance = null;
    }

    async populate() {
        this.interfaceInstance = await this.objView.getInterface();
        let objects = await this._addObject();
        let objectsActions = await this._addObjectActions(objects);
        let objectsFields = await this._addObjectsFields(objects);
        let signs = await this._addSigns();
        let filters = await this._addFilter();
        let filtersActions = await this._addFiltersActions(filters, objectsActions, objects);
        let users = await this._addAdmin();
        let usersFilters = await this._addUsersFilters(users, filters);
    }

    async _addObject() {
        let objectsListBefore = EntityParserUtil.parse(await this.objView.query(textM.role.objects, textM.dbMethod.get, {}));
        let entityClassesFromInterface = [];
        this._recurcyAddObjects(this.interfaceInstance.objectViews, entityClassesFromInterface);
        let differenceObjectLists = this._differenceObjectLists(entityClassesFromInterface, objectsListBefore);
        await this.objView.query(textM.role.objects, textM.dbMethod.insert, {
            values: differenceObjectLists
        });
        let objectsListAfter = EntityParserUtil.parse(await this.objView.query(textM.role.objects, textM.dbMethod.get, {}));
        return objectsListAfter;
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
        let actionsArray = [];
        let objectsActionsListBefore = EntityParserUtil.parse(await this.objView.query(textM.role.objects_actions, textM.dbMethod.get, {}));
        for (let object of objects) {
            let objectID = object.fields.ID;
            let buildEntityFromInterface = EntityBuilder.buildEntityFromInterface(object.fields.description, this.interfaceInstance);
            if (!buildEntityFromInterface) {
                continue;
            }
            for (let method in buildEntityFromInterface.methods) {
                actionsArray.push(EntityBuilder.buildObjectAction(method, objectID));
            }
        }
        let differenceObjectActions = this._getDifferenceListActionsOrFieldsFromDBAndNewBuilded(objectsActionsListBefore, actionsArray);
        await this.objView.query(textM.role.objects_actions, textM.dbMethod.insert, {
            values: differenceObjectActions
        });

        let objectsActionsListAfter = EntityParserUtil.parse(await this.objView.query(textM.role.objects_actions, textM.dbMethod.get, {}));
        return objectsActionsListAfter;
    }


    async _addObjectsFields(objects) {
        let fieldsArray = [];
        let objectsFieldsListBefore = EntityParserUtil.parse(await this.objView.query(textM.role.objects_fields, textM.dbMethod.get, {}));

        for (let object of objects) {
            let objectID = object.fields.ID;

            let buildEntityFromInterface = EntityBuilder.buildEntityFromInterface(object.fields.description, this.interfaceInstance);
            if (!buildEntityFromInterface) {
                continue;
            }
            for (let field in buildEntityFromInterface.fields) {
                fieldsArray.push(EntityBuilder.buildObjectField(field, objectID));
            }
        }
        let differenceObjectActions = this._getDifferenceListActionsOrFieldsFromDBAndNewBuilded(objectsFieldsListBefore, fieldsArray);
        await this.objView.query(textM.role.objects_fields, textM.dbMethod.insert, {
            values: differenceObjectActions
        });
        let objectsFieldsListAfter = EntityParserUtil.parse(await this.objView.query(textM.role.objects_fields, textM.dbMethod.get, {}));

        return objectsFieldsListAfter;
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
        let filtersArray = [];
        filtersArray.push(EntityBuilder.buildFilter(adminFilterDescription));
        filtersArray.push(EntityBuilder.buildFilter(commonFilterDescription));
        let insertedFilters = await this.objView.query(textM.role.filters, textM.dbMethod.insert, {
            values: filtersArray
        });
        return EntityParserUtil.parse(insertedFilters);
    }


    async _addFiltersActions(filters, objectsActions, objects) {
        let filterActionBefore = EntityParserUtil.parse(await this.objView.query(textM.role.filters_actions, textM.dbMethod.get, {}));
        let filtersActionsList = [];
        let objectHistory;
        let objectSupply;
        for (const object of objects) {
            if (object.fields.description === textM.role.history) {
                objectHistory = object;
            }
            if (object.fields.description !== textM.role.role) {
                objectSupply = object;
            }
        }
        for (const objectAction of objectsActions) {
            for (const filter of filters) {
                if (filter.fields.description === adminFilterDescription) {
                    filtersActionsList.push(EntityBuilder.buildFilterAction(objectAction, filter));
                }
                if (filter.fields.description === commonFilterDescription &&
                    (this.isObjectHistoryGet(objectAction, objectHistory) ||
                        this.isObjectSupplyGetInterface(objectAction, objectSupply)
                    )) {
                    filtersActionsList.push(EntityBuilder.buildFilterAction(objectAction, filter));
                }
            }
        }
        let differenceObjectActions = this._getDifferenceFilterActions(filterActionBefore, filtersActionsList);
        let filtersActions = await this.objView.query(textM.role.filters_actions, textM.dbMethod.insert, {
            values: differenceObjectActions
        });
        return EntityParserUtil.parse(filtersActions);
    }


    isObjectHistoryGet(objectAction, objectHistory) {
        return (objectAction.fields.description === textM.methods.get &&
            objectAction.fields.objectID === objectHistory.fields.ID);
    }

    isObjectSupplyGetInterface(entityAction, objectSupply) {
        return (entityAction.fields.description === textM.methods.getInterface &&
            entityAction.fields.objectID === objectSupply.fields.ID);
    }

    async _addAdmin() {
        let users = EntityParserUtil.parse((await this.objView.query(textM.role.users, textM.dbMethod.get, {})));
        if (users.length > 0) {
            return users;
        }
        let insertedUsersArray = [];
        // admin@mail.ru      d.kiselyoff@groupstp.ru
        insertedUsersArray.push(EntityBuilder.buildUser("admin", "d.kiselyoff@groupstp.ru", "admin", "admin"));
        let insertedUsers = await this.objView.query(textM.role.users, textM.dbMethod.insert, {
            values: insertedUsersArray
        });
        return EntityParserUtil.parse(insertedUsers);
    }


    async _addUsersFilters(users, filters) {
        if (users.length === 0) {
            return;
        }
        let userFilters = EntityParserUtil.parse(await this.objView.query(textM.role.users_filters, textM.dbMethod.get, {}));

        let usersFiltersArray = [];
        for (let user of users) {
            for (let filter of filters) {
                if (user.fields.description === "admin" && filter.fields.description === adminFilterDescription) {
                    usersFiltersArray.push(EntityBuilder.buildUserFilters(user, filter));
                }
                else if (filter.fields.description === commonFilterDescription) {
                    usersFiltersArray.push(EntityBuilder.buildUserFilters(user, filter));
                }
            }
        }
        let differenceUsersFilters = this._getDifferenceListFromDBAndNewBuilded(userFilters, usersFiltersArray);
        let insertedUserFilters = await this.objView.query(textM.role.users_filters, textM.dbMethod.insert, {
            values: differenceUsersFilters
        });
        let parsedEntity = EntityParserUtil.parse(insertedUserFilters);
        return parsedEntity;
    }

    _differenceObjectLists(entityClassesFromInterface, objectsList) {
        let descriptionObjectList = objectsList.map(entityClass => entityClass.fields.description);
        let objectSet = new Set(descriptionObjectList);
        let differenceList = entityClassesFromInterface.filter(v => !objectSet.has(v.description));
        return differenceList;
    }


    _getDifferenceListFromDBAndNewBuilded(fromDBList, newEntityList) {
        let descriptionFromDB = fromDBList.map(userFilter => userFilter.fields.description);
        let descriptionDBSet = new Set(descriptionFromDB);
        let differenceList = newEntityList.filter(v => !descriptionDBSet.has(v.description));
        return differenceList;
    }

    _getDifferenceListActionsOrFieldsFromDBAndNewBuilded(fromDBList, newActionsList) {
        let descriptionFromDB = fromDBList.map(actionObject => `${actionObject.fields.objectID}_${actionObject.fields.description}`);
        let descriptionDBSet = new Set(descriptionFromDB);
        let differenceList = newActionsList
            .filter(v => {
                let objectIDActionDescriptionPair = `${v.objectID}_${v.description}`;
                let x = descriptionDBSet.has(objectIDActionDescriptionPair);
                return !descriptionDBSet.has(objectIDActionDescriptionPair);
            });

        return differenceList;
    }

    _getDifferenceFilterActions(fromDBList, newActionsList) {
        let descriptionFromDB = fromDBList.map(v => `${v.fields.actionID}_${v.fields.description}`);
        let descriptionDBSet = new Set(descriptionFromDB);
        let differenceList = newActionsList
            .filter(v => {
                let objectIDActionDescriptionPair = `${v.actionID}_${v.description}`;
                let x = descriptionDBSet.has(objectIDActionDescriptionPair);
                return !descriptionDBSet.has(objectIDActionDescriptionPair);
            });

        return differenceList;
    }


}