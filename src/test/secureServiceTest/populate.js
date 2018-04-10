import * as textM from "../../main/util/TextM";
import {EntityParserUtil} from "../../main/util/entityParserUtil";
import {subscriberView} from "../../../subscriberView";
import {EntityBuilder} from "../../main/util/EntityBuilder";
import * as  PropertyPath from "property-path";

const objView = new subscriberView("root");
let interfaceInstance;

export class Populate {


    async init() {
        await objView.init();
        interfaceInstance = await objView.getInterface();
        let objects = await this._addObject();
        let objectsActions = await this._addObjectActions(objects);
        let objectsFields = await this._addObjectsFields(objects);
        let signs = await this._addSigns();
        let filters = await this._addFilter();
        let filtersActions = await this._addFiltersActions(filters, objectsActions);
        let filtersFields = await this._addFiltersFields(objects, filters, objectsFields, signs);
        let roles = await this._addRoles();
        let rolesFilters = await this._addRolesFilters(roles, filters);
        let users = await this._addUsers();
        let usersFilters = await this._addUsersFilters(users, filters);
        let userRoles = await  this._addUsersRoles(users, roles);
    }

    async _addObject() {
        let objectsList = EntityParserUtil.parse(await objView.query(textM.role.objects, textM.dbMethod.get, {}));
        if (objectsList.length > 0) {
            return objectsList;
        }
        let entityClasses = [];
        this._recurcyAddObjects(interfaceInstance.objectViews, entityClasses);
        let insertedObjects = await objView.query(textM.role.objects, textM.dbMethod.insert, {
            values: entityClasses
        });
        return EntityParserUtil.parse(insertedObjects);
    }

    async _addObjectActions(objects) {
        let actionList = EntityParserUtil.parse(await objView.query(textM.role.objects_actions, textM.dbMethod.get, {}));
        if (actionList.length > 0) {
            return actionList;
        }
        let actionsArray = [];
        for (let object of objects) {
            let objectID = object.fields.ID;
            for (let method in this._getEntityFromInterface(object).methods) {
                actionsArray.push(EntityBuilder.buildObjectAction(method, objectID));
            }
        }
        let insertedObjectsAction = await objView.query(textM.role.objects_actions, textM.dbMethod.insert, {
            values: actionsArray
        });
        return EntityParserUtil.parse(insertedObjectsAction);
    }

    async _addObjectsFields(objects) {
        let objectFields = EntityParserUtil.parse((await objView.query(textM.role.filters_fields, textM.dbMethod.get, {})));
        if (objectFields.length > 0) {
            return objectFields;
        }

        let fieldsArray = [];
        for (let object of objects) {
            let objectID = object.fields.ID;
            for (let field in this._getEntityFromInterface(object).fields) {
                fieldsArray.push(EntityBuilder.buildObjectField(field, objectID));
            }
        }
        let insertedObjectsFields = await objView.query(textM.role.objects_fields, textM.dbMethod.insert, {
            values: fieldsArray
        });
        return EntityParserUtil.parse(insertedObjectsFields);
    }


    async _addSigns() {
        let signs = EntityParserUtil.parse((await objView.query(textM.role.signs, textM.dbMethod.get, {})));
        if (signs.length > 0) {
            return signs;
        }

        let insertedSigns = await objView.query("role.signs", "insert", {
            values:
                [{"description": "равно", "sign": 'equal'},
                    {"description": "неравно", "sign": 'nequal'},
                    {"description": "больше", "sign": 'greater'},
                    {"description": "меньше", "sign": 'less'},
                    {"description": "больше или равно", "sign": 'greatereq'},
                    {"description": "меньше или равно", "sign": 'lesseq'},
                    {"description": "входит в множество", "sign": 'in'},
                    {"description": "входит в иерархическую группу", "sign": 'rin'},
                    {"description": "включает в себя (операция со строками)", "sign": 'consist'},
                ]
        });
        return EntityParserUtil.parse(insertedSigns);
    }


    async _addFilter() {
        let filters = EntityParserUtil.parse((await objView.query(textM.role.filters, textM.dbMethod.get, {})));
        if (filters.length > 0) {
            return filters;
        }
        let filtersArray = [
            {[textM.fields.description]: textM.dbMethod.get},
            {[textM.fields.description]: textM.dbMethod.insert},
            {[textM.fields.description]: textM.dbMethod.update},
            {[textM.fields.description]: textM.dbMethod.delete},
            {[textM.fields.description]: `${textM.dbMethod.get}_${textM.dbMethod.insert}_${textM.dbMethod.update}_${textM.dbMethod.delete}`},
        ];


        let insertedFilters = await objView.query(textM.role.filters, textM.dbMethod.insert, {
            values: filtersArray
        });
        return EntityParserUtil.parse(insertedFilters);
    }


    async _addFiltersActions(filters, objectsActions) {
        let filtersActions = EntityParserUtil.parse((await objView.query(textM.role.filters_actions, textM.dbMethod.get, {})));
        if (filtersActions.length > 0) {
            return filtersActions;
        }
        let insertedFiltersAction = [];
        for (const filter of filters) {
            for (const objectAction of objectsActions) {
                if (filter.fields.description === objectAction.fields.description)
                    insertedFiltersAction.push({
                        [textM.fields.description]: `${objectAction.fields.description} ${filter.fields.description}`,
                        [textM.fields.actionId]: objectAction.fields.ID, [textM.fields.filterId]: filter.fields.ID
                    });
                if (filter.fields.description === `${textM.dbMethod.get}_${textM.dbMethod.insert}_${textM.dbMethod.update}_${textM.dbMethod.delete}`) {
                    insertedFiltersAction.push({
                        [textM.fields.description]: `${objectAction.fields.description} ${filter.fields.description}`,
                        [textM.fields.actionId]: objectAction.fields.ID, [textM.fields.filterId]: filter.fields.ID
                    })
                }
            }
        }
        filtersActions = await objView.query(textM.role.filters_actions, textM.dbMethod.insert, {
            values: insertedFiltersAction
        });
        return EntityParserUtil.parse(filtersActions);
    }


    async _addFiltersFields(objects, filters, objectsFields, signs) {
        let checkFiltersField = EntityParserUtil.parse((await objView.query(textM.role.filters_fields, textM.dbMethod.get, {})));
        if (checkFiltersField.length > 0) {
            return checkFiltersField;
        }
        let filtersFieldsArray = [];
        for (const object of objects) {
            for (const filter of filters) {
                for (const objectField of objectsFields) {
                    for (const sign of signs) {

                        if (object.fields.description === textM.role.users &&
                            objectField.fields.objectID === object.fields.ID && objectField.fields.description === "user" &&
                            sign.fields.description === "равно" && filter.fields.description === "delete") {
                            filtersFieldsArray.push({
                                [textM.fields.description]: `${filter.fields.description} - ${object.fields.description}.${objectField.fields.description} ${sign.fields.description}  userAdmin `,
                                [textM.fields.fieldId]: `${objectField.fields.ID}`,
                                [textM.fields.filterId]: `${filter.fields.ID}`,
                                [textM.fields.signId]: `${sign.fields.ID}`,
                                [textM.fields.values]: "adminName",
                            });
                        }

                        if (object.fields.description === textM.role.users &&
                            objectField.fields.objectID === object.fields.ID && objectField.fields.description === "user" &&
                            sign.fields.description === "равно" && filter.fields.description === "get") {
                            filtersFieldsArray.push({
                                [textM.fields.description]: `${filter.fields.description} - ${object.fields.description}.${objectField.fields.description} ${sign.fields.description}  userAdmin `,
                                [textM.fields.fieldId]: `${objectField.fields.ID}`,
                                [textM.fields.filterId]: `${filter.fields.ID}`,
                                [textM.fields.signId]: `${sign.fields.ID}`,
                                [textM.fields.values]: "adminName",
                            });
                        }

                        if (object.fields.description === textM.role.users &&
                            objectField.fields.objectID === object.fields.ID && objectField.fields.description === "user" &&
                            sign.fields.description === "равно" && filter.fields.description === "get") {
                            filtersFieldsArray.push({
                                [textM.fields.description]: `${filter.fields.description} - ${object.fields.description}.${objectField.fields.description} ${sign.fields.description}  userAdmin `,
                                [textM.fields.fieldId]: `${objectField.fields.ID}`,
                                [textM.fields.filterId]: `${filter.fields.ID}`,
                                [textM.fields.signId]: `${sign.fields.ID}`,
                                [textM.fields.values]: "userName",
                            });
                        }

                    }
                }
            }
        }
        let insertedFiltersField = await objView.query(textM.role.filters_fields, textM.dbMethod.insert, {
            values: filtersFieldsArray
        });

        return EntityParserUtil.parse(insertedFiltersField);
    }

    async _addRoles() {
        let roles = EntityParserUtil.parse((await objView.query(textM.role.roles, textM.dbMethod.get, {})));
        if (roles.length > 0) {
            return roles;
        }
        let rolesArray = [
            {[textM.fields.description]: textM.rang.admin},
            {[textM.fields.description]: textM.rang.user},
            {[textM.fields.description]: textM.rang.readOnly},
        ];
        let insertedFilters = await objView.query(textM.role.roles, textM.dbMethod.insert, {
            values: rolesArray
        });
        return EntityParserUtil.parse(insertedFilters);
    }

    async _addRolesFilters(roles, filters) {
        let rolesFilters = EntityParserUtil.parse((await objView.query(textM.role.roles_filters, textM.dbMethod.get, {})));
        if (rolesFilters.length > 0) {
            return rolesFilters;
        }

        let rolesFiltersArray = [];
        for (let role of roles) {
            for (let filter of filters) {
                switch (role.fields.description) {
                    case textM.rang.admin:
                        //У популированного админа есть суперфильтр со всеми действиями,
                        // поэтому некоторые фильтры отменяем у админадля тестов суммы interfaceInstance и фильтров по полям.
                        if (filter.fields.description === textM.dbMethod.insert) {
                            continue;
                        }
                        rolesFiltersArray.push(this._getRoleFilter(role.fields.ID, role.fields.description, filter.fields.ID, filter.fields.description));
                        break;
                    case textM.rang.user:
                        if (filter.fields.description === textM.dbMethod.get || filter.fields.description === textM.dbMethod.insert || filter.fields.description === textM.dbMethod.update) {
                            rolesFiltersArray.push(this._getRoleFilter(role.fields.ID, role.fields.description, filter.fields.ID, filter.fields.description));
                        }
                        break;
                    case textM.rang.readOnly:
                        if (filter.fields.description === textM.dbMethod.get) {
                            rolesFiltersArray.push(this._getRoleFilter(role.fields.ID, role.fields.description, filter.fields.ID, filter.fields.description));
                        }
                        break;
                }

            }
        }
        let insertedRolesFilters = await objView.query(textM.role.roles_filters, textM.dbMethod.insert, {
            values: rolesFiltersArray
        });
        return EntityParserUtil.parse(insertedRolesFilters);
    }

    _getRoleFilter(roleId, roleDescription, filterId, filterDescription) {
        return {
            "description": `${roleDescription} - ${filterDescription}`,
            "filterID": filterId, "roleID": roleId
        }
    }


    async _addUsers() {
        /*let users = EntityParserUtil.parse((await objView.query(textM.role.users, textM.dbMethod.get, {})));
        if (users.length > 0) {
            return users;
        }*/
        let insertedUsersArray = [];
        insertedUsersArray.push(this._getUser("admin", "admin@mail.ru", "admin", "adminName"));
        insertedUsersArray.push(this._getUser("user", "user@mail.ru", "user", "userName"));
        insertedUsersArray.push(this._getUser("read", "read@mail.ru", "read", "readName"));

        let insertedUsers = await objView.query(textM.role.users, textM.dbMethod.insert, {
            values: insertedUsersArray
        });
        return EntityParserUtil.parse(insertedUsers);
    }

    _getUser(description, email, password, user) {
        return {
            [textM.fields.description]: description,
            [textM.fields.email]: email,
            [textM.fields.password]: password,
            [textM.fields.user]: user
        }
    }


    async _addUsersFilters(users, filters) {
        let userFilters = EntityParserUtil.parse(await objView.query(textM.role.users_filters, textM.dbMethod.get, {}));
        if (userFilters.length > 0) {
            return userFilters;
        }
        let usersFiltersArray = [];
        for (let user of users) {
            for (let filter of filters) {
                if (user.fields.user === "readName" && filter.fields.description === "delete") {
                    usersFiltersArray.push(this._getUserFilters(user, filter));
                }
            }
        }
        let insertedUserFilters = await objView.query(textM.role.users_filters, textM.dbMethod.insert, {
            values: usersFiltersArray
        });
        return EntityParserUtil.parse(insertedUserFilters);
    }

    _getUserFilters(user, filter) {
        return {
            [textM.fields.description]: `${user.fields.description} - ${filter.fields.description}`,
            [textM.fields.filterId]: filter.fields.ID,
            [textM.fields.userId]: user.fields.ID
        }
    }


    async _addUsersRoles(users, roles) {
        let usersRoles = EntityParserUtil.parse(await objView.query(textM.role.users_roles, textM.dbMethod.get, {}));
        if (usersRoles.length > 0) {
            return usersRoles;
        }
        let userRoleArray = [];
        for (let user of users) {
            for (let role of roles) {
                if (user.fields.description === "admin" && role.fields.description === textM.rang.admin) {
                    userRoleArray.push(this._getUserRole(user, role));
                }
                if (user.fields.description === "user" && role.fields.description === textM.rang.user) {
                    userRoleArray.push(this._getUserRole(user, role));
                }
                if (user.fields.description === "read" && role.fields.description === textM.rang.readOnly) {
                    userRoleArray.push(this._getUserRole(user, role));
                }
            }
        }
        let insertedUsersRoles = await objView.query(textM.role.users_roles, textM.dbMethod.insert, {
            values: userRoleArray
        });
        return EntityParserUtil.parse(insertedUsersRoles);
    }


    _getUserRole(user, role) {
        return {
            [textM.fields.description]: `${user.fields.description} - ${role.fields.description}`,
            [textM.fields.roleId]: role.fields.ID,
            [textM.fields.userId]: user.fields.ID
        }
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
    _getEntityFromInterface(object) {
        let pathArray = object.fields.description.split(".");
        let interfacePath = pathArray[0];
        for (let i = 1; i < pathArray.length; i++) {
            let path = `objects.${pathArray[i]}`;
            interfacePath = `${interfacePath}.${path}`;
        }
        let result = PropertyPath.get(interfaceInstance.objectViews, interfacePath);
        return result;
    }

}