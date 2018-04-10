import * as textM from "../../main/util/TextM";
import {EntityParserUtil} from "../../main/util/entityParserUtil";
import {EntityBuilder} from "../../main/util/EntityBuilder";
import * as  PropertyPath from "property-path";

let interfaceInstance;

export class PopulateAliasTest {

    constructor(view) {
        this.objView = view;
    }

    async populate() {
        interfaceInstance = await this.objView.getInterface();
        let queries = await this._addQuery();
        // let products = await this._addProduct();
        let positions = await  this._addPosition( queries);
        let objects = await this._addObject();
        let fields = await this._addObjectsFields(objects);
        let actions = await this._addObjectActions(objects);
        let signs = await this._addSigns();
        let filters = await this._addFilters();
        await this._addFiltersActions(filters, actions);
        let users = await this._addUsers();
        let usersFilters = await this._addUsersFilters(users, filters);
    }

    async _addQuery() {
        let query = EntityBuilder.buildOrganization("z1");
        let query2 = EntityBuilder.buildOrganization("z2");
        let queryArray = [];
        queryArray.push(query);
        queryArray.push(query2);
        let insertedQuery = await this.objView.query(textM.supply.query, "insert", {
            values: queryArray
        });
        return EntityParserUtil.parse(insertedQuery);
    }

    async _addPosition(queries) {
        let positions = EntityParserUtil.parse(await this.objView.query(textM.supply.query_position, textM.dbMethod.get, {}));
        if (positions.length > 0) {
            return positions;
        }
        let positionArray = [];
        let positionsInProduct = 3;
        for (let query of queries)
                for (let i = 0; i < positionsInProduct; i++) {
                    positionArray.push(EntityBuilder.buildPosition(`${query.fields.description} позиция-${i}`, null, null, query.fields.ID));
            }

        let insertedObjects = await this.objView.query(textM.supply.query_position, textM.dbMethod.insert, {
            values: positionArray
        });
        positions = EntityParserUtil.parse(insertedObjects);
        return positions;
    }

    async _addObject() {
        let objectsList = EntityParserUtil.parse(await this.objView.query(textM.role.objects, textM.dbMethod.get, {}));
        if (objectsList.length > 0) {
            return objectsList;
        }
        let entityClasses = [];
        this._recurcyAddObjects(interfaceInstance.objectViews, entityClasses);
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
            for (let method in this._getEntityFromInterface(object).methods) {
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
            for (let field in this._getEntityFromInterface(object).fields) {
                fieldsArray.push(EntityBuilder.buildObjectField(field, objectID));
            }
        }
        let insertedObjectsFields = await this.objView.query(textM.role.objects_fields, textM.dbMethod.insert, {
            values: fieldsArray
        });
        return EntityParserUtil.parse(insertedObjectsFields);
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

    async _addFilters() {
        let filtersArray = [];
        filtersArray.push(EntityBuilder.buildFilter(`rin`));
        filtersArray.push(EntityBuilder.buildFilter(`all`));
        let insertedFilters = await this.objView.query(textM.role.filters, textM.dbMethod.insert, {
            values: filtersArray
        });
        return EntityParserUtil.parse(insertedFilters);
    }

    async _addFiltersActions(filters, objectsActions) {
        let insertedFiltersAction = [];
        for (const filter of filters) {
            console.log("");
            for (const objectAction of objectsActions) {
                insertedFiltersAction.push({
                    [textM.fields.description]: `${objectAction.fields.description} ${filter.fields.description}`,
                    [textM.fields.actionId]: objectAction.fields.ID, [textM.fields.filterId]: filter.fields.ID
                });
            }
        }

        let butchArray = [];
        let z;
        for (let i = 0; i < insertedFiltersAction.length; i++) {
            let filterAction = insertedFiltersAction[i];
            butchArray.push(filterAction);
            if (butchArray.length > 300 || i === insertedFiltersAction.length - 1) {
                await this.objView.query(textM.role.filters_actions, textM.dbMethod.insert, {
                    values: butchArray
                });
                butchArray = [];
                z = i;
            }
        }
        console.log("");
    }





    async _addSigns() {
        let signs = EntityParserUtil.parse((await this.objView.query(textM.role.signs, textM.dbMethod.get, {})));
        if (signs.length > 0) {
            return signs;
        }
        let insertedSigns = await this.objView.query("role.signs", "insert", {
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


    async _addUsers() {
        let user = EntityBuilder.buildUser("rin", "a@mail.ru", "admin", "admin");
        let user2 = EntityBuilder.buildUser("admin2", "a@mail.ru", "admin2", "admin2");
        let users = [];
        users.push(user);
        users.push(user2);
        let insertedObjects = await this.objView.query(textM.role.users, textM.dbMethod.insert, {values: users});
        return EntityParserUtil.parse(insertedObjects);
    }

    async _addUsersFilters(users, filters) {

        let usersFiltersArray = [];

        for (let user of users) {
            for (let filter of filters) {
                if (user.fields.description === "rin" && filter.fields.description === "rin") {
                    usersFiltersArray.push(EntityBuilder.buildUserFilters(user, filter));
                }
                if (user.fields.description === "admin2" && filter.fields.description === "all") {
                    usersFiltersArray.push(EntityBuilder.buildUserFilters(user, filter));
                }
            }
        }
        let insertedUserFilters = await this.objView.query(textM.role.users_filters, textM.dbMethod.insert, {
            values: usersFiltersArray
        });
        return EntityParserUtil.parse(insertedUserFilters);
    }
}

