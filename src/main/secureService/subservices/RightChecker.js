import * as textM from "../../util/TextM";
import {EntityBuilder} from "../../util/EntityBuilder";
import * as _ from "lodash";
import {logger} from "../../../../Logger/controller";
import {HashMap} from "hashmap";

export class RightChecker {

    constructor(queryDataInformer) {
        this.queryDataInformer = queryDataInformer;
    }

    cutInterface(object) {
        let cuttedInterface = this._filterInterface(this.queryDataInformer.interfaceInstance, this.queryDataInformer.objectActionFilterMapForUser);
        cuttedInterface = this._getCuttedInterfaceForConcreteObject(object, cuttedInterface);
        return cuttedInterface;
    }

    _getCuttedInterfaceForConcreteObject(object, cuttedInterface) {
        if (object) {
            let splitObjects = object.split('.');
            for (let obj of splitObjects) {
                if (cuttedInterface.objectViews && cuttedInterface.objectViews[obj]) {
                    cuttedInterface = cuttedInterface.objectViews[obj]
                }
                else {
                    cuttedInterface = cuttedInterface.objects[obj];
                }
            }
        }
        return cuttedInterface;
    }


    getFilteredParameteres(objectDescription, method, parameters) {
        this._checkMethodAccess(objectDescription, method);
        let filtersFields = this.queryDataInformer.filterFields;



        let filtersConditionsConditionNameMap = new HashMap();
        this._fillFiltersConditionsConditionNameMap(objectDescription, filtersFields, filtersConditionsConditionNameMap);
        this._fillFiltersConditionsConditionNameMapBySuccessFilter(objectDescription, filtersFields, filtersConditionsConditionNameMap);

        let comparisons = this._getAllComparisons(filtersConditionsConditionNameMap, parameters);
        let tree = this._getTree(filtersConditionsConditionNameMap, parameters);
        parameters.filter = {};
        parameters.filter.comparisons = comparisons;
        parameters.filter.tree = tree;


        return parameters;
    }


    _filterInterface(interfaceInstance, objectsActionsFiltersMap) {
        let superEntityArr = interfaceInstance.objectViews;
        for (let superEntityProperty in superEntityArr) {
            let entityList = superEntityArr[superEntityProperty].objects;
            for (let entityProp  in entityList) {
                let objectDescription = `${superEntityProperty}.${entityProp}`;
                if (objectsActionsFiltersMap.has(objectDescription)) {
                    let successMethodsFilterMap = objectsActionsFiltersMap.get(objectDescription);
                    let methods = entityList[entityProp].methods;
                    for (let method in methods) {
                        if (!successMethodsFilterMap.has(method)) {
                            delete methods[method];
                        }
                    }
                    if (entityList[entityProp].stages) {
                        let stages = entityList[entityProp].stages;
                        for (let stage in stages) {
                            let stageName = `${superEntityProperty}.${stage}`;
                            if (!objectsActionsFiltersMap.has(stageName)) {
                                delete entityList[entityProp].stages[stage];
                            }
                        }
                    }
                } else {
                    delete entityList[entityProp];
                }
            }
        }
        return interfaceInstance;
    }


    _checkMethodAccess(object, method) {
        let objectActionFilterMap = this.queryDataInformer.objectActionFilterMapForUser;
        if (!(objectActionFilterMap.has(object) && objectActionFilterMap.get(object).has(method))) {
            logger.write("error", `${textM.message.noSuccess}  ${object} ${method} , кинули в Secure._checkMethodAccess()`, new Error());
            throw new Error(`${textM.message.noSuccess}  ${object} ${method} , кинули в Secure._checkMethodAccess()`);
        }
    }


    _fillFiltersConditionsConditionNameMap(objectDescription, filtersFields, filtersConditionsConditionNameMap, conditionIndex, fieldPath) {
        if (conditionIndex === undefined || conditionIndex === null) {
            conditionIndex = {i: 0};
        }

        let entityClassFields = this.queryDataInformer.entityDescriptionFieldsMap.get(objectDescription);
        for (let filter of  filtersFields) {
            let filterID = filter.fields.ID;
            if (filter.refs.filters_fields) {
                for (let condition of filter.refs.filters_fields) {
                    for (let field of entityClassFields) {
                        let conditionName = `${filterID}_${conditionIndex.i}`;
                        if (condition.fields.fieldID === field.fields.ID) {
                            let fieldDescription = this._getFieldDescription(field, fieldPath);
                            let conditionEntity = EntityBuilder.buildComparisons(fieldDescription, condition.fields.signID.fields.sign, condition.fields.values);
                            if (filtersConditionsConditionNameMap.has(filterID)) {
                                filtersConditionsConditionNameMap.get(filterID).set(conditionEntity, conditionName);
                            } else {
                                filtersConditionsConditionNameMap.set(filterID, new HashMap().set(conditionEntity, conditionName));
                            }
                            ++conditionIndex.i;
                        }
                    }
                }
            }
        }

        let entity = EntityBuilder.buildEntityFromInterface(objectDescription, this.queryDataInformer.interfaceInstance);
        let entityFields = entity.fields;
        let superEntityPath = objectDescription.substring(0, objectDescription.lastIndexOf("."));
        for (let property in entityFields) {
            let entityField = entityFields[property];
            if (entityField.type === textM.typeField.ref) {
                fieldPath = property;
                let subObjectDescription = `${superEntityPath}.${entityField.ref}`;
                this._fillFiltersConditionsConditionNameMap(subObjectDescription, filtersFields, filtersConditionsConditionNameMap, conditionIndex, fieldPath);
            }
        }
    }


    _getFieldDescription(field, fieldPath) {
        if (fieldPath === undefined) {
            return field.fields.description;
        } else {
            return `${fieldPath}.${field.fields.description}`
        }
    }


    _getAllComparisons(filtersConditionsConditionNameMap, parameters) {
        let comparisons = {};
        if (parameters.filter && parameters.filter !== {}) {
            comparisons = _.cloneDeep(parameters.filter.comparisons);
            comparisons = this._addComparison(filtersConditionsConditionNameMap, comparisons);
        } else {
            comparisons = this._addComparison(filtersConditionsConditionNameMap, comparisons);
        }
        return comparisons;
    }


    _addComparison(filtersConditionsConditionNameMap, comparisons) {
        for (let conditionConditionNameMap of filtersConditionsConditionNameMap.values()) {
            for (let pairEntry of conditionConditionNameMap.entries()) {
                let condition = pairEntry[0];
                let conditionName = pairEntry[1];
                comparisons[conditionName] = EntityBuilder.buildCondition(condition);
            }
        }
        return comparisons;
    }

    _getTree(filtersConditionsConditionNameMap, parameters) {
        let resultTree = {"and": []};
        let groupNumberFiltersConditionsConditionNameMap = this._getGroupNumber_FiltersConditionsConditionNameMap(filtersConditionsConditionNameMap);

        this._fillResultTreeWithFiltersGroup(groupNumberFiltersConditionsConditionNameMap, resultTree);

        if (parameters.filter && parameters.filter.tree && ((parameters.filter.tree.and && parameters.filter.tree.and.length > 0) || (parameters.filter.tree.or && parameters.filter.tree.or.length > 0) )) {
            let tree = parameters.filter.tree;
            resultTree.and.push(tree);
        }
        return resultTree;
    }

    _fillResultTreeWithFiltersGroup(groupNumberFiltersConditionsConditionNameMap, resultTree) {
        for (let filtersConditionPair of groupNumberFiltersConditionsConditionNameMap.entries()) {
            let groupTree = {"or": []};
            let filterConditionMap = filtersConditionPair[1];
            for (let conditionConditionNamePair  of filterConditionMap.entries()) {
                if (!conditionConditionNamePair[1]) {
                    continue;
                }
                let conditionConditionNameMap = conditionConditionNamePair[1];
                let conditions = {"and": []};
                for (let pair of conditionConditionNameMap.entries()) {
                    let conditionName = pair[1];
                    conditions.and.push(conditionName);
                }
                groupTree.or.push(conditions);
            }
            if (groupTree.or.length > 0) {
                resultTree.and.push(groupTree);
            }
        }
    }

    _getGroupNumber_FiltersConditionsConditionNameMap(filtersConditionsConditionNameMap) {
        const filtersGroupMap = new HashMap();
        for (let userFilter of this.queryDataInformer.userFiltersList) {
            let filtersGroup = userFilter.fields.filtersGroup;
            let filterID = userFilter.fields.filterID.fields.ID;
            let condititonsConditionNameMap = filtersConditionsConditionNameMap.get(filterID);
            if (filtersGroupMap.has(filtersGroup)) {
                filtersGroupMap.get(filtersGroup).set(filterID, condititonsConditionNameMap);
            } else {
                let filterMap = new HashMap();
                filterMap.set(filterID, condititonsConditionNameMap);
                filtersGroupMap.set(filtersGroup, filterMap);
            }
        }
        return filtersGroupMap;
    }

    /*
    * if(Object.keys{filter.conditions}.every(fake?)){
    *   filter = {};
    * }
    *
    * */

    _fillFiltersConditionsConditionNameMapBySuccessFilter(objectDescription, filtersFields, filtersConditionsConditionNameMap) {
        console.log("");
        if(this._isEmptyFiltersConditionsConditionNameMap(filtersConditionsConditionNameMap)){
            return;
        }
        let fakeComparisonsName = "fakeComparison";
        let numberComparisons = 0;
        for (let userFilter of this.queryDataInformer.userFiltersList) {
            let filterID = userFilter.fields.filterID.fields.ID;
            let condititonsConditionNameMap = filtersConditionsConditionNameMap.get(filterID);
            if(!condititonsConditionNameMap) {
                console.log("");
                let conditionMap = new HashMap();
                conditionMap.set(this._buildFakeComparisons(), `${fakeComparisonsName}_${numberComparisons}`);
                filtersConditionsConditionNameMap.set(filterID,conditionMap);
                numberComparisons++;
            }
        }

    }





/*
 Вставка фейковых фильтров необходима для корректной проверки прав в случае краевых случаев/
Допустим существует 2 фильтра: один всё разрешает и не имеет филдов, другой имеет филды и разрешает не всё.
-----------------------------------------------
Примеры краевых случаев:
1. оба фильтра находятся в одной группе, тогда права пользователя будут равны правам всё разрешающего фильтра
(условия в фильтрах через OR).
2. Фильтры находятся в разных группах, тогда права пользователя будут равны ограниченного филдами фильтра.
-----------------------------------------------
Данное решение представляет собой костыль, необходимость такого решения возникла
при внедрении деления фильтров пользователя на группы, так как вначале не было подобных требований к системе.
фейковый компарисонс подставляется во всё разрешающий фильтр
* */
     _buildFakeComparisons() {
        return {
            left: {type: "field", value: "ID"},
            right: {type: "field", value: "ID"},
            sign: "equal",
            type:"fieldComparisons"
        }
    }

    _isEmptyFiltersConditionsConditionNameMap(filtersConditionsConditionNameMap) {
        let conditionsSum = 0;
         /*for(let filtersConditionsPair of filtersConditionsConditionNameMap.entries()) {

        }*/
        return filtersConditionsConditionNameMap.entries().length === 0;
    }
}