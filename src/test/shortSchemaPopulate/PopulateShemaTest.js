import * as textM from "../../main/util/TextM";
import {EntityParserUtil} from "../../main/util/entityParserUtil";
import {EntityBuilder} from "../../main/util/EntityBuilder";

export class PopulateSchemaTest {

    constructor(subscriberView) {
        this.objView = subscriberView;
        this.interfaceInstance = null;
    }

    async populate() {

        await this.sync1C();

        this.interfaceInstance = await this.objView.getInterface();
        let stages = this._getAllStages();
        let organizations = await this._getOrganization();
        let queries = await this._addQuery(organizations);
        let products = await this._getProduct();
        // let positions = await  this._addPosition(products, queries);

        let objects = await this._addObject();
        let objectsActions = await this._addObjectActions(objects);
        let objectsFields = await this._addObjectsFields(objects);
        let signs = await this._addSigns();
        let filters = await this._addFilter();
        let filtersActions = await this._addFiltersActions(filters, objectsActions, stages, objects);
        let filtersFields = await this._addFiltersFields(objects, filters, objectsFields, signs, organizations);
        let users = await this._addUsers();
        let usersFilters = await this._addUsersFilters(users, filters);
    }

    async sync1C() {
        let supplyList = EntityParserUtil.parse(await this.objView.query(textM.supply.organization, textM.dbMethod.get, {}));
        if (supplyList.length > 0) {
            return;
        }
        await this.objView.query(textM.supply.organization, textM.dbMethod.sync, {});
        await this.objView.query(textM.supply.subdivision, textM.dbMethod.sync, {});
        await this.objView.query(textM.supply.stock, textM.dbMethod.sync, {});
        await this.objView.query(textM.supply.unit, textM.dbMethod.sync, {});
        await this.objView.query(textM.supply.product, textM.dbMethod.sync, {});
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
        let filtersArray = [];
        filtersArray.push(EntityBuilder.buildFilter("admin"));
        filtersArray.push(EntityBuilder.buildFilter("asmUser"));
        filtersArray.push(EntityBuilder.buildFilter("asmDirector"));
        filtersArray.push(EntityBuilder.buildFilter("stsUser"));
        filtersArray.push(EntityBuilder.buildFilter("stsDirector"));
        let insertedFilters = await this.objView.query(textM.role.filters, textM.dbMethod.insert, {
            values: filtersArray
        });
        return EntityParserUtil.parse(insertedFilters);
    }


    async _addFiltersActions(filters, objectsActions, stages, objects) {
        let filtersActions = EntityParserUtil.parse((await this.objView.query(textM.role.filters_actions, textM.dbMethod.get, {})));
        if (filtersActions.length > 0) {
            return filtersActions;
        }
        /**/

        let insertedFiltersAction = [];
       let  successedObjects = [];




        for (const stage of stages) {
            for (const object of objects) {
                for (const filter of filters) {
                    for (const objectAction of objectsActions) {

                        if (filter.fields.description === "admin") {
                            insertedFiltersAction.push(EntityBuilder.buildFilterAction(objectAction, filter));
                        }
//asmUser
                        if ((object.fields.description === stage ||
                                object.fields.description === "supply" ||
                                object.fields.description === "supply.query" ||
                                object.fields.description === "supply.query_position"

                            ) &&
                            objectAction.fields.objectID === object.fields.ID &&
                            !(stage === "supply.stages_procurementCommission" ||
                                stage === "supply.stages_procurementCommission_votes") &&
                            filter.fields.description === "asmUser") {
                            insertedFiltersAction.push(EntityBuilder.buildFilterAction(objectAction, filter));
                        }

//stsUser
                        if ((object.fields.description === stage ||
                                object.fields.description === "supply" ||
                                object.fields.description === "supply.query" ||
                                object.fields.description === "supply.query_position"

                            ) &&
                            objectAction.fields.objectID === object.fields.ID &&
                            !(stage === "supply.stages_procurementCommission" ||
                                stage === "supply.stages_procurementCommission_votes") &&
                            filter.fields.description === "stsUser") {
                            insertedFiltersAction.push(EntityBuilder.buildFilterAction(objectAction, filter));
                        }

//asmDirector
                        if (object.fields.description === stage &&
                            objectAction.fields.objectID === object.fields.ID &&
                            (stage === "supply.stages_procurementCommission" ||
                                stage === "supply.stages_procurementCommission_votes") &&
                            filter.fields.description === "asmDirector") {
                            insertedFiltersAction.push(EntityBuilder.buildFilterAction(objectAction, filter));
                        }

                        if ((object.fields.description === stage ||
                                object.fields.description === "supply" ||
                                object.fields.description === "supply.query" ||
                                object.fields.description === "supply.query_position"

                            ) &&
                            objectAction.fields.objectID === object.fields.ID &&
                            filter.fields.description === "asmDirector") {
                            insertedFiltersAction.push(EntityBuilder.buildFilterAction(objectAction, filter));
                        }


                        if (object.fields.description === stage &&
                            objectAction.fields.objectID === object.fields.ID &&
                            !(stage === "supply.stages_procurementCommission" ||
                                stage === "supply.stages_procurementCommission_votes") &&
                            filter.fields.description === "asmDirector" &&
                            objectAction.fields.description === "get") {
                            insertedFiltersAction.push(EntityBuilder.buildFilterAction(objectAction, filter));
                        }
//stsDirector
                        if (object.fields.description === stage &&
                            objectAction.fields.objectID === object.fields.ID &&
                            (stage === "supply.stages_procurementCommission" ||
                                stage === "supply.stages_procurementCommission_votes") &&
                            filter.fields.description === "stsDirector") {
                            insertedFiltersAction.push(EntityBuilder.buildFilterAction(objectAction, filter));
                        }

                        if (object.fields.description === stage &&
                            objectAction.fields.objectID === object.fields.ID &&
                            !(stage === "supply.stages_procurementCommission" ||
                                stage === "supply.stages_procurementCommission_votes") &&
                            filter.fields.description === "stsDirector" &&
                            objectAction.fields.description === "get") {
                            insertedFiltersAction.push(EntityBuilder.buildFilterAction(objectAction, filter));
                        }

                        if ((object.fields.description === stage ||
                                object.fields.description === "supply" ||
                                object.fields.description === "supply.query" ||
                                object.fields.description === "supply.query_position"

                            ) &&
                            objectAction.fields.objectID === object.fields.ID &&
                            filter.fields.description === "stsDirector") {
                            insertedFiltersAction.push(EntityBuilder.buildFilterAction(objectAction, filter));
                        }
                    }
                }
            }


        }
        filtersActions = await this.objView.query(textM.role.filters_actions, textM.dbMethod.insert, {
            values: insertedFiltersAction
        });
        return EntityParserUtil.parse(filtersActions);
    }

    async _addFiltersFields(objects, filters, objectsFields, signs, organizations) {
        let filtersFieldsArray = [];
        let stages = this._getAllStages();
        let linkValueAsm = this._getLinkValue("asm", organizations);
        let linkValueSts = this._getLinkValue("sts", organizations);
        let asmID = JSON.parse(linkValueAsm).linkValue;
        let stsID = JSON.parse(linkValueSts).linkValue;


        for (const object of objects) {
            for (const filter of filters) {
                for (const objectField of objectsFields) {
                    for (const sign of signs) {

// ASMUSer
                        for (const stage of stages) {
                            if (object.fields.description === stage &&
                                objectField.fields.objectID === object.fields.ID &&
                                objectField.fields.description === textM.fields.description &&
                                sign.fields.sign === textM.sign.unEqual &&
                                !(stage === "supply.stages_procurementCommission" ||
                                    stage === "supply.stages_procurementCommission_votes") &&
                                filter.fields.description === "asmUser") {
                                filtersFieldsArray.push(EntityBuilder.buildFilterFields(object, objectField, filter, sign, stage, linkValueAsm));
                            }
                        }

                        for (const organization of organizations) {
                            if (object.fields.description === textM.supply.query &&
                                objectField.fields.objectID === object.fields.ID &&
                                objectField.fields.description === textM.fields.organization &&
                                sign.fields.sign === textM.sign.equal && organization.fields.ID === asmID &&
                                filter.fields.description === "asmUser") {
                                filtersFieldsArray.push(EntityBuilder.buildFilterFields(object, objectField, filter, sign, organization.fields.ID));
                            }
                        }

// stsUSer
                        for (const stage of stages) {
                            if (object.fields.description === stage &&
                                objectField.fields.objectID === object.fields.ID &&
                                objectField.fields.description === textM.fields.description &&
                                sign.fields.sign === textM.sign.unEqual &&
                                !(stage === "supply.stages_procurementCommission" ||
                                    stage === "supply.stages_procurementCommission_votes") &&
                                filter.fields.description === "stsUser") {
                                filtersFieldsArray.push(EntityBuilder.buildFilterFields(object, objectField, filter, sign, stage, linkValueAsm));
                            }
                        }

                        for (const organization of organizations) {
                            if (object.fields.description === textM.supply.query &&
                                objectField.fields.objectID === object.fields.ID &&
                                objectField.fields.description === textM.fields.organization &&
                                sign.fields.sign === textM.sign.equal && organization.fields.ID === asmID &&
                                filter.fields.description === "stsUser") {
                                filtersFieldsArray.push(EntityBuilder.buildFilterFields(object, objectField, filter, sign, organization.fields.ID));
                            }
                        }

// asmDirector
                        for (const stage of stages) {
                            if (object.fields.description === stage &&
                                objectField.fields.objectID === object.fields.ID &&
                                objectField.fields.description === textM.fields.description &&
                                sign.fields.sign === textM.sign.unEqual /*&&
                                !(stage === "supply.stages_procurementCommission" ||
                                    stage === "supply.stages_procurementCommission_votes")*/ &&
                                filter.fields.description === "asmDirector") {
                                filtersFieldsArray.push(EntityBuilder.buildFilterFields(object, objectField, filter, sign, stage, linkValueAsm));
                            }
                        }

                        for (const organization of organizations) {
                            if (object.fields.description === textM.supply.query &&
                                objectField.fields.objectID === object.fields.ID &&
                                objectField.fields.description === textM.fields.organization &&
                                sign.fields.sign === textM.sign.equal && organization.fields.ID === asmID &&
                                filter.fields.description === "asmDirector") {
                                filtersFieldsArray.push(EntityBuilder.buildFilterFields(object, objectField, filter, sign, organization.fields.ID));
                            }
                        }
// stsDirector
                        for (const stage of stages) {
                            if (object.fields.description === stage &&
                                objectField.fields.objectID === object.fields.ID &&
                                objectField.fields.description === textM.fields.description &&
                                sign.fields.sign === textM.sign.unEqual /*&&
                                !(stage === "supply.stages_procurementCommission" ||
                                    stage === "supply.stages_procurementCommission_votes")*/ &&
                                filter.fields.description === "stsDirector") {
                                filtersFieldsArray.push(EntityBuilder.buildFilterFields(object, objectField, filter, sign, stage, linkValueAsm));
                            }
                        }

                        for (const organization of organizations) {
                            if (object.fields.description === textM.supply.query &&
                                objectField.fields.objectID === object.fields.ID &&
                                objectField.fields.description === textM.fields.organization &&
                                sign.fields.sign === textM.sign.equal && organization.fields.ID === asmID &&
                                filter.fields.description === "stsDirector") {
                                filtersFieldsArray.push(EntityBuilder.buildFilterFields(object, objectField, filter, sign, organization.fields.ID));
                            }
                        }


                    }
                }
            }
        }

        let insertedFiltersField = await this.objView.query(textM.role.filters_fields, textM.dbMethod.insert, {
            values: filtersFieldsArray
        });

        return EntityParserUtil.parse(insertedFiltersField);
    }


    async _addUsers() {
        /* let users = EntityParserUtil.parse((await this.objView.query(textM.role.users, textM.dbMethod.get, {})));
         if (users.length > 0) {
             return users;
         }*/
        let insertedUsersArray = [];
        insertedUsersArray.push(EntityBuilder.buildUser("admin", "admin@mail.ru", "admin", "admin"));
        insertedUsersArray.push(EntityBuilder.buildUser("asmUser", "admin@mail.ru", "asmUser", "asmUser"));
        insertedUsersArray.push(EntityBuilder.buildUser("asmDirector", "admin@mail.ru", "asmDirector", "asmDirector"));
        insertedUsersArray.push(EntityBuilder.buildUser("stsUser", "admin@mail.ru", "stsUser", "stsUser"));
        insertedUsersArray.push(EntityBuilder.buildUser("stsDirector", "admin@mail.ru", "stsDirector", "stsDirector"));
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
                if (filter.fields.description === user.fields.description) {
                    usersFiltersArray.push(EntityBuilder.buildUserFilters(user, filter));
                }
            }
        }
        let insertedUserFilters = await this.objView.query(textM.role.users_filters, textM.dbMethod.insert, {
            values: usersFiltersArray
        });
        let parsedEntity = EntityParserUtil.parse(insertedUserFilters);
        return parsedEntity;
    }

    async _getOrganization() {
        let insertedOrganizations = await this.objView.query(textM.supply.organization, textM.dbMethod.get, {});
        return EntityParserUtil.parse(insertedOrganizations);
    }

    _getAllStages() {
        let stages = [];
        let superEntity = "supply";
        stages.push(`${superEntity}.stages_warehouseControl`);
        stages.push(`${superEntity}.stages_tzPreparation`);
        stages.push(`${superEntity}.stages_nomControl`);
        stages.push(`${superEntity}.stages_supSelection`);
        stages.push(`${superEntity}.stages_supSelection_suppliers`);
        stages.push(`${superEntity}.stages_procurementCommission`);
        stages.push(`${superEntity}.stages_procurementCommission_votes`);
        stages.push(`${superEntity}.stages_acceptance`);
        stages.push(`${superEntity}.stages_billBinding`);
        return stages;

    }

    _getLinkValue(organizationTitle, organizations) {
        switch (organizationTitle) {
            case "sts":
                return organizations.map(x => x.fields)
                    .filter(organizations => organizations.externalCode === "11f74ddc-8ba2-11e5-9690-080027a37367")
                    .map(organization => EntityBuilder.buildLinkCondition(`positionID.queryID.organization.ID`, organization.ID))[0];
            case "asm":
                return organizations.map(x => x.fields)
                    .filter(organizations => organizations.externalCode === "db0e250c-8ba1-11e5-9690-080027a37367")
                    .map(organization => EntityBuilder.buildLinkCondition("positionID.queryID.organization.ID", organization.ID))[0];
        }
    }

    async _addQuery(organizations) {
        let queryArray = organizations.map(organization => EntityBuilder
            .buildQuery(`z1-${organization.fields.description}`, organization.fields.ID));
        let insertedQuery = await this.objView.query(textM.supply.query, "insert", {
            values: queryArray
        });
        return EntityParserUtil.parse(insertedQuery);
    }

    async _getProduct() {

        let products = EntityParserUtil.parse(await this.objView.query(textM.supply.product, textM.dbMethod.get, {
            filter: {
                comparisons: {
                    name: {
                        left: {type: "field", value: "isGroup"},
                        right: {type: "value", value: false},
                        sign: "equal"
                    }
                },
                tree: {and: ["name"]}
            },
            parameters: {
                pagination: {
                    offset: 0,
                    limit: 10
                },
                orderBy: [{field: 'description'}]
            }
        }));

        return EntityParserUtil.parse(products);
    }

    async _addPosition(addedProducts, queries) {
        let positions = EntityParserUtil.parse(await objView.query(textM.supply.query_position, textM.dbMethod.get, {}));
        if (positions.length > 0) {
            return positions;
        }
        let positionArray = [];
        let positionsInProduct = 3;
        for (let query of queries)
            for (let product of addedProducts) {
                for (let i = 0; i < positionsInProduct; i++) {
                    positionArray.push(EntityBuilder.buildPosition(`${query.fields.description} ${product.fields.description} позиция-${i}`, product.fields.ID, product.fields.ID, query.fields.ID));
                }
            }

        let insertedObjects = await objView.query(textM.supply.query_position, textM.dbMethod.insert, {
            values: positionArray
        });
        positions = EntityParserUtil.parse(insertedObjects);
        return positions;
    }


}
