import {util} from "../util/utilityClass";

class interfaceFormer{
    constructor(view){
        this.view = view;
        this.tokenUserCache = {};
        this.userFilterCache = {};
        this.userInterfaceCache = {};
        this.userNullGroups = {};
    }

    __getUserInfoByToken(token){
        return this.view.query("role.users", "get", {
            filter: {
                comparisons: {
                    token: {
                        left: {
                            type: "field",
                            value: "ref.users_tokens.token"
                        },
                        right: {
                            type: "value",
                            value: token
                        },
                        sign: "equal"
                    }
                },
                tree: {
                    and: ["token"]
                }
            },
            fields: [
                "ref.users_filters.filtersGroup",
                "ref.users_filters.filterID.ref.filters_actions.actionID.description",
                "ref.users_filters.filterID.ref.filters_actions.actionID.objectID.description",
                "ref.users_filters.filterID.ref.filters_fields.fieldID.description",
                "ref.users_filters.filterID.ref.filters_fields.signID.sign",
                "ref.users_filters.filterID.ref.filters_fields.values",
                "ref.users_filters.filterID.ref.filters_fields.fieldID.objectID.description",

                "ref.users_roles.roleID.ref.roles_filters.filtersGroup",
                "ref.users_roles.roleID.ref.roles_filters.filterID.ref.filters_actions.actionID.description",
                "ref.users_roles.roleID.ref.roles_filters.filterID.ref.filters_actions.actionID.objectID.description",
                "ref.users_roles.roleID.ref.roles_filters.filterID.ref.filters_fields.fieldID.description",
                "ref.users_roles.roleID.ref.roles_filters.filterID.ref.filters_fields.signID.sign",
                "ref.users_roles.roleID.ref.roles_filters.filterID.ref.filters_fields.values",
                "ref.users_roles.roleID.ref.roles_filters.filterID.ref.filters_fields.fieldID.objectID.description"
            ]
        });
    }

    __checkStructure(structure){
        if(!structure){
            structure = {}
        }
        if(!structure.actions){
            structure.actions = {}
        }
        if(!structure.objects){
            structure.objects = {}
        }
    }

    __checkObjectInStructure(object, structure){
        if(!structure.objects[object]){
            structure.objects[object] = {
                actions: {},
                objects: {}
            }
        }
    }

    __checkObjectActionInStructure(object, action, structure){
        if(!structure.objects[object].actions[action]){
            structure.objects[object].actions[action] = {}
        }
    }

    __checkFilterNumberInStructure(object, action, structure, filterNumber){

        if(!structure.objects[object].actions[action][filterNumber]){
            structure.objects[object].actions[action][filterNumber] = {
                fieldsFilters: {
                }
            }
        }
    }

    __addActionFilterToStructure(action, object, structure, filterNumber = 0){
        let objectPath = object.split(".");
        let currentObject = objectPath.shift();

        this.__checkStructure(structure);

        if(objectPath.length > 0){
            if(!structure.objects[currentObject]) {
                structure.objects[currentObject] = {};
            }
            this.__addActionFilterToStructure(action, objectPath.join("."), structure.objects[currentObject], filterNumber)
        }
        else{
            this.__checkObjectInStructure(object, structure);
            this.__checkObjectActionInStructure(object, action, structure);
            this.__checkFilterNumberInStructure(object, action, structure, filterNumber);
        }
    }

    __generateString(){
        return Math.random().toString(36).substr(2, 7);
    }

    __generateName(keys){
        let newKey = this.__generateString();
        while(keys.indexOf(newKey) >= 0){
            newKey = this.__generateString();
        }
        return newKey;
    }

    __addFilterFieldToStructure(object, actionList, field, sign, value, structure, filterNumber = 0){
        let objectPath = object.split(".");
        let currentObject = objectPath.shift();

        if(structure.objects[currentObject]){
            if(objectPath.length > 0){
                this.__addFilterFieldToStructure(objectPath.join("."), actionList, field, sign, value, structure.objects[currentObject], filterNumber);
            }
            else{
                for(let action of actionList){
                    if(structure.objects[currentObject].actions[action] && structure.objects[currentObject].actions[action][filterNumber]) {
                        let keys = Object.keys(structure.objects[currentObject].actions[action][filterNumber].fieldsFilters);
                        // ToDo: вот это доделать
                        let compName = this.__generateName(keys);
                        structure.objects[currentObject].actions[action][filterNumber].fieldsFilters[compName] = {
                            left: {
                                type: "field",
                                value: field
                            },
                            right: {
                                type: "value",
                                value: value
                            },
                            sign: sign
                        };
                    }
                }
            }
        }
    }

    __processFilterActions(actionRecords, structure, filterNumber){
        let actionList = [];
        for(let filterActionID in actionRecords){
            let filterAction = actionRecords[filterActionID];
            let action = util.getFirstValueFromHash(filterAction.fields.actionID);
            //let object = action.fields.objectID.description;
            let actionName = action.fields.description;
            actionList.push(actionName);
            let objectName = action.fields.objectID.description;
            this.__addActionFilterToStructure(actionName, objectName, structure, filterNumber);
        }
        return actionList;
    }

    __processFilterFields(fieldRecords, actions, structure, filterNumber){
        for(let filterFieldID in fieldRecords){
            let filterField = fieldRecords[filterFieldID];
            let field = util.getFirstValueFromHash(filterField.fields.fieldID);
            let fieldName = field.fields.description,
                objectName = field.fields.objectID.description,
                sign = util.getFirstValueFromHash(filterField.fields.signID).fields.sign,
                values = filterField.fields.values;
            this.__addFilterFieldToStructure(objectName, actions, fieldName, sign, values, structure, filterNumber);
        }
    }

    __processFiltersRecords(filters, structure){
        for(let userFilterID in filters){
            let userFilter = filters[userFilterID];
            let filterNumber = userFilter.fields.filtersGroup || this.__generateString();

            let filter = util.getFirstValueFromHash(userFilter.fields.filterID);

            let actionList = this.__processFilterActions(filter.refs.filters_actions, structure, filterNumber);
            this.__processFilterFields(filter.refs.filters_fields, actionList, structure, filterNumber);
        }
    }

    __processUserRolesRecords(userRoles, structure){
        for(let userRoleID in userRoles){
            let userRoleRecord = userRoles[userRoleID];
            let roleRecord = util.getFirstValueFromHash(userRoleRecord.fields.roleID);
            let rolesFilters = roleRecord.refs.roles_filters;
            this.__processFiltersRecords(rolesFilters, structure);
        }
    }

    __getFiltersForUsers(userInfo){
        let userFiltersStructure = {};

        let userRecord = util.getFirstValueFromHash(userInfo.records);

        if(!this.userFilterCache[userRecord.fields.ID]){
            let userFilters = userRecord.refs.users_filters;
            this.__processFiltersRecords(userFilters, userFiltersStructure);

            let userRoles = userRecord.refs.users_roles;
            this.__processUserRolesRecords(userRoles, userFiltersStructure);

            this.userFilterCache[userRecord.fields.ID] = userFiltersStructure;
        }
        return this.userFilterCache[userRecord.fields.ID];
    }

    __setUserTokensCache(userInfo, token){
        let userRecord = util.getFirstValueFromHash(userInfo.records);
        this.tokenUserCache[token] = userRecord.fields.ID;
    }

    async __getFiltersByToken(token){
        let userID = this.tokenUserCache[token];
        if(userID && this.userFilterCache[userID]){
            return this.userFilterCache[userID];
        }

        let userInfoRecords =  await this.__getUserInfoByToken(token);
        this.__setUserTokensCache(userInfoRecords, token);
        return this.__getFiltersForUsers(userInfoRecords);
    }

    __getObjectInterfaceFromCommonInterface(commonInterface, objectName){
        let path = objectName.split(".");
        let currentObject = path.shift();

        if(path.length > 0){
            if(commonInterface.objectViews[currentObject]){
                return this.__getObjectInterfaceFromCommonInterface(commonInterface.objectViews[currentObject], path.join("."));
            }
        }
        else if(commonInterface.objects[currentObject]){
            return commonInterface.objects[currentObject];
        }
        else if(commonInterface.objectViews[currentObject]){
            return commonInterface.objectViews[currentObject];
        }

        throw 'interfaceFormer.__getObjectInterfaceFromCommonInterface. Запрашивается интерфейс несуществующего объекта.';
    }

    __getObjectFilters(filtersStructure, objectName){
        let path = objectName.split(".");
        let currentObject = path.shift();
        if(filtersStructure.objects[currentObject]){
            if(path.length > 0) {
                return this.__getObjectFilters(filtersStructure.objects[currentObject], path.join("."));
            }
            else{
                return filtersStructure.objects[currentObject]
            }
        }
        return {
            actions: {}
        };
    }

    __formMethodsIntoInterface(filterActions, interfaceMethods, formingInterface){
        for(let action in filterActions){
            if(interfaceMethods[action]) {
                formingInterface.methods[action] = interfaceMethods[action];
            }
        }
    }

    __formObjectViewsIntoInterface(filterObjects, interfaceObjectViews, formingInterface){
        for(let objectView in interfaceObjectViews){
            if(filterObjects[objectView]) {
                formingInterface.objectViews[objectView] = this.__cutObjectInterfaceByFilters(
                    interfaceObjectViews[objectView],
                    filterObjects[objectView]
                );
            }
        }
    }

    __formSchemeStages(filterObjects, schemeObject, formingObject){
        if(!formingObject.stages) {
            formingObject.stages = {};
        }

        for(let stage in schemeObject.stages) {
            if(filterObjects[stage]){
                formingObject.stages[stage] = schemeObject.stages[stage];
            }
        }
    }

    __formObjectsIntoInterface(filterObjects, interfaceObjects, formingInterface){
        for(let object in interfaceObjects){
            if(filterObjects[object]) {
                formingInterface.objects[object] = this.__cutObjectInterfaceByFilters(
                    interfaceObjects[object],
                    filterObjects[object]
                );
            }
            if(interfaceObjects[object].common === "scheme"){
                this.__formSchemeStages(filterObjects, interfaceObjects[object], formingInterface.objects[object]);
            }
        }
    }

    __formRefLinksIntoInterface(filterObjects, commonObjects, formingObjects){
        for(let objectName in formingObjects){
            if(commonObjects[objectName]) {
                let refs = commonObjects[objectName].refs;
                formingObjects[objectName].refs = refs.filter(
                    ref => filterObjects[ref] && filterObjects[ref].actions.get
                );
            }
        }
    }

    __cutObjectInterfaceByFilters(objectInterface, filters){
        let currentInterface = {
            methods: {},
            objectViews: {},
            objects: {}
        };

        let actions = Object.keys(filters.actions);
        let objects = Object.keys(filters.objects);
        if(actions.length > 0 || objects.length > 0){
            currentInterface.name = objectInterface.name;
            currentInterface.common = objectInterface.common;
            currentInterface.description = objectInterface.description;
            if(objectInterface.fields){
                currentInterface.fields = objectInterface.fields;
            }
            currentInterface.refs = Object.keys(objectInterface.refs).filter(ref => objects.indexOf(ref) >= 0);
            this.__formMethodsIntoInterface(filters.actions, objectInterface.methods, currentInterface);
            this.__formObjectsIntoInterface(filters.objects, objectInterface.objects, currentInterface);
            this.__formObjectViewsIntoInterface(filters.objects, objectInterface.objectViews, currentInterface);
            this.__formRefLinksIntoInterface(filters.objects, objectInterface.objects, currentInterface.objects);
        }
        return currentInterface;
    }

    __getObjectFromInterface(commonInterface, objectPath){
        let currentObject = objectPath.shift();
        if(objectPath.length > 0){
            if(commonInterface.objectViews[currentObject]){
                return this.__getObjectFromInterface(commonInterface.objectViews[currentObject], objectPath);
            }
            throw 'Нет доступа к указанному объекту';
        }
        else{
            if(commonInterface.objects[currentObject]){
                return commonInterface.objects[currentObject];
            }
            else if(commonInterface.objectViews[currentObject]){
                return commonInterface.objectViews[currentObject];
            }
            throw 'Нет доступа к указанному объекту';
        }
    }

    __getObjectInterfaceByUserID(objectName, userID){
        let path = objectName.split(".");
        return this.__getObjectFromInterface(this.userInterfaceCache[userID], path)
    }

    async getObjectInterfaceByToken(token, originalInterface, objectName){
        let userID = this.tokenUserCache[token];
        if(!userID || !this.userInterfaceCache[userID]) {
            let filters = await this.__getFiltersByToken(token);
            userID = this.tokenUserCache[token];
            this.userInterfaceCache[userID] = this.__cutObjectInterfaceByFilters(originalInterface, filters);
        }
        return objectName ? this.__getObjectInterfaceByUserID(objectName, userID) : this.userInterfaceCache[userID];
    }

    async getFilterGroupsForObjectMethodByToken(objectName, method, token){

        let filters = await this.__getFiltersByToken(token);
        let userFilter = this.__getObjectFilters(filters, objectName);

        if(!userFilter.actions[method]){
            throw "Нет доступа к запрашиваемому методу.";
        }
        return userFilter.actions[method];
    }

    async modifyParametersForObjectMethodByToken(object, method, parameters = {}, token) {
        if(!parameters.filter){
            parameters.filter = {}
        }

        let userFilter = {
            comparisons: {},
            tree: {}
        };
        let filterGroups = await this.getFilterGroupsForObjectMethodByToken(object, method, token);

        let filtersArray = [];
        for(let filterID in filterGroups){
            let comparisons = filterGroups[filterID].fieldsFilters;
            let comparisonsNames = Object.keys(comparisons);
            if(comparisonsNames.length > 0){
                for(let comparisonName in comparisons){
                    userFilter.comparisons[comparisonName] = comparisons[comparisonName];
                }
                filtersArray.push(comparisonsNames);
            }
        }
        if(filtersArray.length > 0){
            userFilter.tree = {
                or: filtersArray.map(comps => {
                    return {
                        and: comps
                    }
                })
            };
            if(!parameters.filter.comparisons){
                parameters.filter = userFilter;
            }
            else {
                for (let comp in userFilter.comparisons) {
                    parameters.filter.comparisons[comp] = userFilter.comparisons[comp];
                }
                parameters.filter.tree = {
                    and: [parameters.filter.tree, userFilter.tree]
                }
            }
        }
    }
}

export {
    interfaceFormer
}