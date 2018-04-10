import {EntityParserUtil} from "../util/entityParserUtil";
import * as _ from "lodash";
import {ArraysUtil} from "../util/ArraysUtil";
import {IntrospectingUtil} from "../util/IntrospectingUtil";
import * as textM from "../util/TextM";
import {HashMap} from "hashmap";
import {EntityBuilder} from "../util/EntityBuilder";
import {logger} from "../../../Logger/controller";

export class QueryDataInformer {
    constructor(initedView) {
        this.view = initedView;
        this.entityClass;
        this.entityClassMethod;
        this.user;
        this.objectActionFilterMapForUser;
        this.entityClassFields;
        this.filterFields;
        this.interfaceInstance;
        this.entityDescriptionFieldsMap;
        this.userFiltersList;
    }


    async getInfo(objectDescription, method, tokenValue) {

        logger.write(`debug`, `QueryDataInformer.getInfo: получение интерфейса и карту действий для пользователя.`);
        [
            this.interfaceInstance,
            this.objectActionFilterMapForUser
        ] = await Promise.all([
            this.view.getInterface(),
            this.getObjectActionFilterMapForUser(tokenValue)
        ]);
        logger.write(`debug`, `QueryDataInformer.getInfo: информация получена.`);

        if (method !== null) {
            logger.write(`debug`, `QueryDataInformer.getInfo: установка соответствие сущность-поля-действия.`);
            this._setEntityAndEntityClassFieldsAndEntityClassAction(objectDescription, method);
            logger.write(`debug`, `QueryDataInformer.getInfo: соответсвие утсановлено.`);

            logger.write(`debug`, `QueryDataInformer.getInfo: получение фильтров для полей.`);
            this.filterFields = await this.getAllFiltersFields(objectDescription, method);
            logger.write(`debug`, `QueryDataInformer.getInfo: фильтры получены.`);
        }
        if (objectDescription !== undefined) {
            logger.write(`debug`, `QueryDataInformer.getInfo: получение соответствия объект-поля.`);
            this.entityDescriptionFieldsMap = this._getEntityDescriptionFieldsMap(objectDescription, new HashMap())
            logger.write(`debug`, `QueryDataInformer.getInfo: соответствие получено.`);
        }

/*
        this.interfaceInstance = await this.view.getInterface();
        this.objectActionFilterMapForUser = await this.getObjectActionFilterMapForUser(tokenValue);
        if (method !== null) {
            await this._setEntityAndEntityClassFieldsAndEntityClassAction(objectDescription, method);
            this.filterFields = await this.getAllFiltersFields(objectDescription, method);
        }
        if (objectDescription !== undefined) {
            this.entityDescriptionFieldsMap = await this._getEntityDescriptionFieldsMap(objectDescription, new HashMap());
        }
*/
        return this;
    }

    async getObjectActionFilterMapForUser(tokenValue) {
        1+1;
        let userActionList = await this._getUserActionTreeList(tokenValue);
        this.userFiltersList = this._getUserFilterList(userActionList);
        logger.write(`debug`, `QueryDataInformer.getObjectActionFilterMapForUser: дерево получено.`);
        return this._getObjectsActionsFiltersMap(userActionList);
    }


    async _getUserActionTreeList(tokenValue) {
        logger.write(`debug`, `QueryDataInformer._getUserActionTreeList: получение действий пользователя над объектами.`);
        let usersActions = EntityParserUtil.parse(await this.getUserActionsObjects(tokenValue));
        logger.write(`debug`, `QueryDataInformer._getUserActionTreeList: действия получены.`);

        logger.write(`debug`, `QueryDataInformer._getUserActionTreeList: установка информации о пользователе.`);
        this._setUserByUserFilterList(usersActions);
        logger.write(`debug`, `QueryDataInformer._getUserActionTreeList: установлено.`);

        logger.write(`debug`, `QueryDataInformer._getUserActionTreeList: соединение фильтров ролей с фильтрами пользователя.`);
        let toReturn = this._mergeRolesFiltersAndUsersFilters(usersActions, usersActions);
        logger.write(`debug`, `QueryDataInformer._getUserActionTreeList: фильры соеденены.`);
        return toReturn;
    }

    async getUserActionsObjects(tokenValue) {
        return await this.view.query("role.users", "get", {
            fields: ["ref.users_roles.roleID.ref.roles_filters.filterID.ref.filters_actions.actionID.objectID.description",
                "ref.users_roles.roleID.ref.roles_filters.filterID.ref.filters_actions.actionID.description",
                "ref.users_filters.filterID.ref.filters_actions.actionID.objectID.description",
                "ref.users_filters.filterID.ref.filters_actions.actionID.description",

                "ref.users_roles.roleID.ref.roles_filters.filtersGroup",
                "ref.users_filters.filtersGroup",


            ],
            filter: {
                comparisons: {
                    name: {
                        left: {type: "field", value: "ref.users_tokens.token"},
                        right: {type: "value", value: tokenValue},
                        sign: "equal"
                    }
                },
                tree: {and: ["name"]}
            }
        });
    }


    _mergeRolesFiltersAndUsersFilters(userFiltersList, rolesFiltersList) {
        let actionList = [];
        actionList.push(userFiltersList);
        let filteredArray = [];
        if (rolesFiltersList[0].refs.users_roles.length > 0) {

            for (let role of rolesFiltersList[0].refs.users_roles) {
                // filteredArray = _.union(rolesFiltersList[0].refs.users_filters, role.fields.roleID.refs.roles_filters);
                rolesFiltersList[0].refs.users_filters.push(role.fields.roleID.refs.roles_filters);
            }

            rolesFiltersList[0].refs.users_filters = ArraysUtil.flatMap(rolesFiltersList[0].refs.users_filters);
        }
        actionList.push(rolesFiltersList);
        let resultActionList = ArraysUtil.flatMap(actionList);
        resultActionList.forEach(v => delete v.refs.users_roles);
        return resultActionList;
    }

    _getObjectsActionsFiltersMap(userActionList) {
        let objectsActionFilterMap = new HashMap();
        for (let userActions of userActionList) {
            let usersFiltersList = userActions.refs.users_filters;
            for (let usersFilter of usersFiltersList) {
                let filtersActions = usersFilter.fields.filterID.refs.filters_actions;
                for (let filter of filtersActions) {
                    if (!filter.fields.actionID.fields.objectID) {
                        continue;
                    }
                    let object = filter.fields.actionID.fields.objectID.description;
                    let action = filter.fields.actionID.fields.description;
                    if (!objectsActionFilterMap.has(object)) {
                        objectsActionFilterMap.set(object, new HashMap());
                    }
                    if (objectsActionFilterMap.get(object).has(action)) {
                        objectsActionFilterMap.get(object).get(action).add({[textM.fields.id]: usersFilter.fields.filterID});
                    } else {
                        objectsActionFilterMap.get(object).set(action, new Set().add({[textM.fields.id]: usersFilter.fields.filterID}));
                    }
                }
            }
        }
        return objectsActionFilterMap;
    }

    async getAllFiltersFields(objectDescription, method) {
        let checkedFiltersList = Array.from(this.objectActionFilterMapForUser.get(objectDescription).get(method));
        let comparisons = {};
        let treeList = [];
        for (let filter of checkedFiltersList) {
            comparisons[filter.ID.fields.ID] = {
                left: {type: "field", value: "ID"},
                right: {type: "value", value: filter.ID.fields.ID},
                sign: "equal"
            };
            treeList.push(filter.ID.fields.ID);
        }
        let selectedFilterField = await this.view.query(textM.role.filters, textM.dbMethod.get, {
            fields: ["ref.filters_fields.ID", "ref.filters_fields.description", "ref.filters_fields.signID.sign",
                "ref.filters_fields.fieldID", "ref.filters_fields.values", "ref.filters_fields.filterID"],
            filter: {
                comparisons: comparisons,
                tree: {or: treeList}
            }
        });
        let filtersList = EntityParserUtil.parse(selectedFilterField);
        return filtersList;
    }

    _setEntityAndEntityClassFieldsAndEntityClassAction(objectDescription, method) {
        this.entityClass = IntrospectingUtil.getEntityClass(objectDescription);
        this.entityClassMethod = this.entityClass.refs.objects_actions.filter(action => action.fields.description === method)[0];
        this.entityClassFields = this.entityClass.refs.objects_fields;
    }

    _setUserByUserFilterList(userFiltersList) {
        this.user = userFiltersList[0].fields;
    }

    _getEntityDescriptionFieldsMap(objectDescription, entityDescriptionFieldsMap) {
        let entityFields = IntrospectingUtil.getEntityClassFields(objectDescription);
        entityDescriptionFieldsMap.set(objectDescription, entityFields);

        let entity = EntityBuilder.buildEntityFromInterface(objectDescription, this.interfaceInstance);
        let fieldsFromInterface = entity.fields;
        let superEntityPath = objectDescription.substring(0, objectDescription.lastIndexOf("."));
        for (let property in fieldsFromInterface) {
            let entityField = fieldsFromInterface[property];
            if (entityField.type === textM.typeField.ref) {
                let subObjectDescription = `${superEntityPath}.${entityField.ref}`;
                this._getEntityDescriptionFieldsMap(subObjectDescription, entityDescriptionFieldsMap);
            }
        }
        return entityDescriptionFieldsMap;
    }


    _getUserFilterList(userActionList) {
        let usersFilters = userActionList[0].refs.users_filters;
        if (usersFilters.length === 0) {
            throw error("Нет доступа, пользователю не назначено ни одного фильтра");
        }
        return usersFilters;

    }
}