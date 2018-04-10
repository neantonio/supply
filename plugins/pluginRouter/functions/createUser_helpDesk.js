import {sender} from "./baseClasses/sendClass";
import {util} from "./baseClasses/utilityClass";
import {service} from "./baseClasses/service";

class pluginClass extends service{
    constructor(){
        super(name);
        this.name = name;
        this.__fieldsDescription = {
            "isExecutor": "helpDesk.executor",
            "isQueryCreator": "helpDesk.initiator",
            "isMentor": "helpDesk.mentor"
        };

        this.__objectFilter = {
            "helpDesk.mentor": {
                "helpDesk.queryExecutionHD": {
                    "categoryID.initiatorID.ID": [
                        "get"
                    ]
                },
                "helpDesk.stages_setExecutorHD": {
                    "categoryID.initiatorID.ID": [
                        "get",
                        "update",
                        "toNext"
                    ]
                },
                "helpDesk.stages_inWorkHD": {
                    "categoryID.initiatorID.ID": [
                        "get",
                        "update",
                        "toNext"
                    ]
                },
                "helpDesk.stages_abortedHD": {
                    "categoryID.initiatorID.ID": [
                        "get"
                    ]
                },
                "helpDesk.stages_acceptanceHD": {
                    "categoryID.initiatorID.ID": [
                        "get"
                    ]
                }
            },
            "helpDesk.initiator": {
                "helpDesk.queryToTaskHD": {
                    "initiatorID": ["get", "update", "active"],
                    "problemUserID": ["get", "update", "active"]
                }
            },
            "helpDesk.executor": {
                "helpDesk.stages_inWorkHD": {
                    "executorID": [
                        "get",
                        "update",
                        "toNext"
                    ]
                },
                "helpDesk.stages_abortedHD": {
                    "executorID": [
                        "get"
                    ]
                },
                "helpDesk.stages_acceptanceHD": {
                    "executorID": [
                        "get"
                    ]
                }
            }
        };

        this.__objectForRoles = {
            "helpDesk.mentor": {
                "helpDesk": ["getInterface"],
                "helpDesk.categoryHD": ["getInterface", "get"],
                "helpDesk.initiatorHD": ["getInterface", "get"],
                "helpDesk.priorityHD": ["getInterface", "get"],
                "helpDesk.queryToTaskHD": ["getInterface"],
                "helpDesk.queryExecutionHD": ["getInterface"],
                "helpDesk.stages_abortedHD": ["getInterface"],
                "helpDesk.stages_acceptanceHD": ["getInterface"],
                "helpDesk.stages_inWorkHD": ["getInterface"],
                "helpDesk.stages_setExecutorHD": ["getInterface"]
            },
            "helpDesk.initiator": {
                "helpDesk": ["getInterface"],
                "helpDesk.categoryHD": ["getInterface", "get"],
                "helpDesk.initiatorHD": ["getInterface"],
                "helpDesk.priorityHD": ["getInterface"],
                "helpDesk.queryToTaskHD": ["getInterface", "insert"]
            },
            "helpDesk.executor": {
                "helpDesk": ["getInterface"],
                "helpDesk.categoryHD": ["getInterface"],
                "helpDesk.initiatorHD": ["getInterface"],
                "helpDesk.priorityHD": ["getInterface"],
                "helpDesk.queryExecutionHD": ["getInterface"],
                "helpDesk.stages_abortedHD": ["getInterface"],
                "helpDesk.stages_acceptanceHD": ["getInterface"],
                "helpDesk.stages_inWorkHD": ["getInterface"]
            }
        };

        this.__roleGroups = {
            "helpDesk.mentor": -1,
            "helpDesk.initiator": -2,
            "helpDesk.executor": -3
        }
    }

    __getInitiatorsHD(filter){
        return sender.send({
            object: "helpDesk.initiatorHD",
            method: "get",
            parameters: {
                filter: filter
            }
        });
    }

    __getUsers(IDs){
        return sender.send({
            object: "role.users",
            method: "get",
            parameters: {
                filter: {
                    comparisons: {
                        ids:{
                            left: {
                                type: "field",
                                value: "ID"
                            },
                            right: {
                                type: "value",
                                value: IDs
                            },
                            sign: "in"
                        }
                    },
                    tree: {
                        and: ["ids"]
                    }
                },
                fields: [
                    "ref.users_roles.roleID.description",
                    "ref.users_filters.description",
                    "ref.users_filters.filterID.description",
                    "ref.users_filters.filterID.ref.filters_actions.actionID.description",
                    "ref.users_filters.filterID.ref.filters_fields.fieldID.description",
                    "ref.users_filters.filterID.ref.filters_fields.values",
                    "ref.users_filters.filterID.ref.filters_fields.signID.description"
                ]
            }
        });
    }

    __getUnexistsRoles(records){
        let rolesFlags = {
            "helpDesk.initiator": false,
            "helpDesk.executor": false,
            "helpDesk.mentor": false
        };

        for(let rID in records){
            if(records[rID].fields.description in rolesFlags){
                rolesFlags[records[rID].fields.description] = true;
            }
        }

        let result = [];
        for(let role in rolesFlags){
            if(!rolesFlags[role]){
                result.push(role);
            }
        }

        return result;
    }

    __getAdditionalFieldsForObject(){
        return [
            "ref.objects_actions.ID",
            "ref.objects_actions.description",
            "ref.objects_fields.ID",
            "ref.objects_fields.description"
        ];
    }

    __formFilterForObjectsList(objectsList){
        return {
            comparisons:{
                objects:{
                    left:{
                        type: "field",
                        value: "description"
                    },
                    right: {
                        type: "value",
                        value: objectsList
                    },
                    sign: "in"
                }
            },
            tree: {
                and: ["objects"]
            }
        }
    }

    /**
     * Возвращает структуру
     * objects = {
     *      objectName: {
     *          ID: objectID,
     *          actions: {
     *              actionName: actionID
     *          },
     *          fields: {
     *              fieldName: fieldID
     *          }
     *      }
     * }
     * */
    __formObjectDescriptionFromRecords(records){
        let objects = {};
        for(let rID in records){
            let objectRecord = records[rID];
            let objectName = objectRecord.fields.description;

            let actions = {};
            for(let actionID in objectRecord.refs.objects_actions){
                let action = objectRecord.refs.objects_actions[actionID].fields;
                actions[action.description] = action.ID;
            }

            let fields = {};
            for(let fieldID in objectRecord.refs.objects_fields){
                let field = objectRecord.refs.objects_fields[fieldID].fields;
                fields[field.description] = field.ID;
            }

            objects[objectName] = {
                ID: objectRecord.fields.ID,
                actions: actions,
                fields: fields
            };
        }
        return objects;
    }

    __getObjects(objects){
        return sender.send({
            object: "role.objects",
            method: "get",
            parameters: {
                filter: this.__formFilterForObjectsList(Object.keys(objects)),
                fields: this.__getAdditionalFieldsForObject()
            }
        })
    }

    async __addFilterForRole(roleName){
        return Object.keys(await sender.send({
            object: "role.filters",
            method: "insert",
            parameters:{
                values: [{
                    description: `helpDesk. filter for ${roleName}`
                }]
            }
        }))[0];
    }

    async __addRoleRecord(roleName){
        let insertedRecords = await sender.send({
            object: "role.roles",
            method: "insert",
            parameters:{
                values: [{
                    description: roleName
                }]
            }
        });
        return Object.keys(insertedRecords)[0];
    }

    __addRoleFilter(roleID, filterID, roleName){
        return sender.send({
            object: "role.roles_filters",
            method: "insert",
            parameters:{
                values: [{
                    filterID: filterID,
                    roleID: roleID,
                    description: `helpDesk. filter for ${roleName}`,
                    filtersGroup: this.__roleGroups[roleName]
                }]
            }
        })
    }

    async __addFilterActionsForRolename(objectsDescription, newFilterID, roleName){
        let newActionsForFilter = [];
        for(let object in this.__objectForRoles[roleName]){
            for(let action of this.__objectForRoles[roleName][object]){
                newActionsForFilter.push({
                    actionID: objectsDescription[object].actions[action],
                    filterID: newFilterID,
                    description: `${object}.${action} for ${roleName}`
                });
            }
        }

        return await sender.send({
            object: "role.filters_actions",
            method: "insert",
            parameters: {
                values: newActionsForFilter
            }
        });
    }

    async __addRole(roleName){
        /** Алгоритм:
         *      0) Получить список необходимых объектов и их действий
         *      1) Создать фильтр "helpDesk. filter for roleName"
         *      2) Добавить записи в filter_actions
         *      3) Создать роль helpDesk.roleName
         *      4) Добавить в roles_filters фильтр из 2 для роли из 3
         */
        let objects = this.__objectForRoles[roleName];

        // 0) Получить список необходимых объектов и их действий
        let objectsRecords = await this.__getObjects(objects);
        // 1) Создать фильтр "helpDesk. filter for roleName"
        let newFilterID = await this.__addFilterForRole(roleName);
        // Преобразование записей в удобочитаемую структуру
        let objectsDescription = this.__formObjectDescriptionFromRecords(objectsRecords);
        // 2) Добавить записи в filter_actions
        await this.__addFilterActionsForRolename(objectsDescription, newFilterID, roleName);
        // 3) Создать роль helpDesk.roleName
        let newRoleID = await this.__addRoleRecord(roleName);
        // 4) Добавить в roles_filters фильтр из 2 для роли из 3
        await this.__addRoleFilter(newRoleID, newFilterID, roleName);
        return newRoleID;
    }

    async __addRoles(roles){
        let result = {};
        for(let role of roles){
            let roleID = await this.__addRole(role);
            result[role] = roleID;
        }
        return result;
    }

    /**
     * Возвращает хэш "Имя роли" : "ID роли"
     * */
    async __getRoles(){
        let existsRoles = await sender.send({
            object: "role.roles",
            method: "get",
            parameters: {
                filter: {
                    comparisons: {
                        ids:{
                            left: {
                                type: "field",
                                value: "description"
                            },
                            right: {
                                type: "value",
                                value: Object.keys(this.__objectForRoles)
                            },
                            sign: "in"
                        }
                    },
                    tree: {
                        and: ["ids"]
                    }
                }
            }
        });

        let unexistsRoles = this.__getUnexistsRoles(existsRoles);
        let roles = await this.__addRoles(unexistsRoles);
        for(let roleID in existsRoles){
            let role = existsRoles[roleID];
            roles[role.fields.description] = roleID;
        }
        return roles;
    }

    __getHelpDeskRoles(initiatorRecords){
        let result = {};
        for(let initiatorID in initiatorRecords){
            let initiatorFields = initiatorRecords[initiatorID].fields;
            for(let roleField in this.__fieldsDescription){
                if(initiatorFields[roleField]){
                    if(!result[initiatorID]){
                        result[initiatorID] = [];
                    }
                    result[initiatorID].push(this.__fieldsDescription[roleField]);
                }
            }
        }
        return result;
    }

    __getUsersRoles(records){
        let result = {};
        for(let userID in records){
            let userRoles = records[userID].refs.users_roles;
            for(let userRoleID in userRoles){
                let roleRecord = util.getFirstValueFromHash(userRoles[userRoleID].fields.roleID);
                let {
                    description: roleName,
                    ID: roleID
                } = roleRecord.fields;
                if(this.__objectForRoles[roleName]){
                    if(!result[userID]){
                        result[userID] = {};
                    }
                    if(!result[userID][roleName]){
                        result[userID][roleName] = [];
                    }
                    result[userID][roleName].push(userRoleID);
                }
            }
        }
        return result;
    }

    async __deleteUsersRolesByID(idArray){
        if(idArray.length === 0){
            return;
        }

        return await sender.send({
            object: "role.users_roles",
            method: "delete",
            parameters: {
                filter: {
                    comparisons: {
                        pks:{
                            left:{
                                type: "field",
                                value: "ID"
                            },
                            right:{
                                type: "value",
                                value: idArray
                            },
                            sign: "in"
                        }
                    },
                    tree: {and: ["pks"]}
                }
            }
        });
    }

    async __addUsersRoles(newRecords){
        return await sender.send({
            object: "role.users_roles",
            method: "insert",
            parameters: {
                values: newRecords
            }
        });
    }

    async __updateUserData(newRecords){
        if(newRecords.length === 0){
            return;
        }

        return await sender.send({
            object: "role.users",
            method: "update",
            parameters: {
                values: newRecords.map(r => {
                    return {
                        user: r.user,
                        password: r.password
                    }
                }),
                filter: {
                    comparisons: {
                        pks:{
                            left:{
                                type: "field",
                                value: "ID"
                            },
                            right:{
                                type: "value",
                                value: newRecords.map(r => r.ID)
                            },
                            sign: "in"
                        }
                    },
                    tree: {and: ["pks"]}
                }
            }
        });
    }

    async __configureUsersRoles(initiatorRoles, usersRoles, roles, usersInfo){
        let usersIDs = Object.keys(initiatorRoles).concat(Object.keys(usersRoles));
        let addRoles = [];
        let delRolesID = [];
        let registeringUserInRoles = [];
        for(let userID of usersIDs){
            if(!initiatorRoles[userID]){
                // code for delete roles from user
                for(let userRole in usersRoles[userID]){
                    delRolesID = delRolesID.concat(usersRoles[userID][userRole]);
                }
            }
            else{
                for(let iRoleName of initiatorRoles[userID]){
                    if(!usersRoles[userID] || !usersRoles[userID][iRoleName]){
                        if(!usersInfo[userID].user){
                            usersInfo[userID].user = usersInfo[userID].email.split("@")[0];
                            registeringUserInRoles.push({
                               ID: userID,
                               user: usersInfo[userID].user,
                               password: usersInfo[userID].user
                            });
                        }

                        addRoles.push({
                            userID: userID,
                            roleID: roles[iRoleName],
                            description: `${iRoleName} for ${usersInfo[userID].user}`
                        });
                    }
                }
            }
            // обработка ненужных ролей у пользователя
            if(usersRoles[userID]) {
                for (let uRoleName in usersRoles[userID]) {
                    if(!initiatorRoles[userID] || initiatorRoles[userID].indexOf(uRoleName) < 0){
                        delRolesID = delRolesID.concat(usersRoles[userID][uRoleName]);
                    }
                }
            }
        }

        let addPromise = this.__addUsersRoles(addRoles);
        let delPromise = this.__deleteUsersRolesByID(delRolesID);
        let userUpdatePromise = this.__updateUserData(registeringUserInRoles);
        return Promise.all([addPromise, delPromise, userUpdatePromise]);
    }

    __getUsersInfo(records){
        let info = {};
        for(let userID in records){
            let fields = records[userID].fields;
            info[userID] = {
                user: fields.user,
                email: fields.email
            }
        }
        return info;
    }

    /**
     * Возвращает структуру вида
     * obj = {
     *      userID: {
     *          name: userName,
     *          userFilters: {
     *              roleName: [
     *                  {
     *                      ID: userFilterID from users_filters,
     *                      filterID: filterID from filters
     *                  }
     *              ]
     *          }
     *      }
     * }
     * */
    __getUsersFilters(records){
        let filterNames = Object.keys(this.__objectFilter);

        let usersFilters = {};

        for(let userID in records){
            let userName = records[userID].fields.description;
            for(let userFilterID in records[userID].refs.users_filters){
                let userFilter = records[userID].refs.users_filters[userFilterID];
                let userFilterName = userFilter.fields.description;
                let [role, user] = userFilterName.split(" filter for ");
                if(role && filterNames.indexOf(role) >= 0 && userName === user){
                    if(!usersFilters[userID]){
                        usersFilters[userID] = {
                            name: userName,
                            userFilters: {}
                        };
                    }
                    if(!usersFilters[userID].userFilters[role]){
                        usersFilters[userID].userFilters[role] = []
                    }
                    usersFilters[userID].userFilters[role].push({
                        ID: userFilterID,
                        filterID: util.getFirstValueFromHash(userFilter.fields.filterID).fields.ID
                    });
                }
            }
        }
        return usersFilters;
    }

    __deleteFiltersByID(IDs){
        if(IDs.length === 0){
            return;
        }

        return sender.send({
            object: "role.filters",
            method: "delete",
            parameters: {
                filter: {
                    comparisons: {
                        ids:{
                            left: {
                                type: "field",
                                value: "ID"
                            },
                            right: {
                                type: "value",
                                value: IDs
                            },
                            sign: "in"
                        }
                    },
                    tree: {
                        and: ["ids"]
                    }
                }
            }
        });
    }

    __deleteUsersFiltersByID(IDs){
        return sender.send({
            object: "role.users_filters",
            method: "delete",
            parameters: {
                filter: {
                    comparisons: {
                        ids:{
                            left: {
                                type: "field",
                                value: "ID"
                            },
                            right: {
                                type: "value",
                                value: IDs
                            },
                            sign: "in"
                        }
                    },
                    tree: {
                        and: ["ids"]
                    }
                }
            }
        });
    }

    __addFilter(name){
        return sender.send({
            object: "role.filters",
            method: "insert",
            parameters: {
                values: [{
                    description: name
                }]
            }
        });
    }

    __addFieldToObject(fieldName, objectID){
        return sender.send({
            object: "role.objects_fields",
            method: "insert",
            parameters: {
                values: [{
                    description: fieldName,
                    objectID: objectID
                }]
            }
        });
    }

    __addUserFilter(userID, filterID, description, groupID){
        return sender.send({
            object: "role.users_filters",
            method: "insert",
            parameters: {
                values: [{
                    userID: userID,
                    filterID: filterID,
                    description: description,
                    filtersGroup: groupID
                }]
            }
        });
    }

    __addFiltersActions(newRecords){
        return sender.send({
            object: "role.filters_actions",
            method: "insert",
            parameters: {
                values: newRecords
            }
        });
    }

    __addFilterFields(newRecords){
        return sender.send({
            object: "role.filters_fields",
            method: "insert",
            parameters: {
                values: newRecords
            }
        });
    }

    async __getSigns(){
        let signsRecords = await sender.send({
            object: "role.signs",
            method: "get",
            parameters: {}
        });
        let result = {};
        for(let signID in signsRecords){
            result[signsRecords[signID].fields.sign] = signID;
        }
        return result;
    }

    async __addFilterForUserByRole(userID, userName, filter, role, index){
        /**
            * 1. Добавить фильтр
            * 2. Добавить фильтр пользователя для каждого из фильтра из п.1.
            * 3. Заполнить действия для фильтра из п.1
            * 4. Заполнить фильтры по полям для фильтра из п.1
        **/
        // 1. добавление фильтра
        let newFilterID = util.getFirstValueFromHash(await this.__addFilter(`${role} filter for ${userName}`)).fields.ID;
        // 2. Добавить фильтр пользователя
        await this.__addUserFilter(userID, newFilterID, role, index);

        // 3. Добавить действия для фильтра
        let newFilterActions = [];
        for(let actionID in filter.actions){
            newFilterActions.push({
                description: filter.actions[actionID],
                actionID: actionID,
                filterID: newFilterID
            });
        }
        let filterActionsPromise = this.__addFiltersActions(newFilterActions);

        let signs = await this.__getSigns();
        // 4. Добавить фильтры по полям
        let newFilterFields = [];
        for(let fieldID in filter.fields){
            let field = filter.fields[fieldID];
            newFilterFields.push({
                description: `${field} is ID of ${userName}`,
                values: userID,
                signID: signs.equal,
                fieldID: fieldID,
                filterID: newFilterID
            });
        }
        let filterFields = this.__addFilterFields(newFilterFields);
        await Promise.all(newFilterActions, newFilterFields);
    }

    /**
     * this.__objectFilter
     * "helpDesk.mentor": {
          "helpDesk.queryExecutionHD": {
             "categoryID.initiatorID.ID": [
               "get"
             ]
          },
       "helpDesk.stages_setExecutorHD": {
          "categoryID.initiatorID.ID": [
             "get",
             "update",
             "toNext"
          ]
       }
     }
      */
    async __getFiltersByRole(role){
        /**
         * 0. Формируем необходимое количество новых фильтров
         * */

        if(!this.__objectFilter[role]){
            return;
        }

        /**
         * {
         *  filterName: {
         *      actions: {
         *          ID: actionID
         *      },
         *      fields: {
         *          fieldID: userID
         *      }
         *  }
         * }
         * */
        let filters = [];
        // получаем список объектов c действиями и полями
        let objectRecords = await this.__getObjects(this.__objectFilter[role]);
        let objects = this.__formObjectDescriptionFromRecords(objectRecords);
        for(let object in this.__objectFilter[role]){
            if(!objects[object]){
                continue;
            }

            let fieldNames = Object.keys(this.__objectFilter[role][object]);
            for(let i = 0; i < fieldNames.length; ++i){
                let fieldName = fieldNames[i];
                if(filters.length === i){
                    filters[i] = {
                        actions: {},
                        fields: {}
                    };
                }

                if(!objects[object].fields[fieldName]){
                    let newFieldRecord = await this.__addFieldToObject(fieldName, objects[object].ID);
                    objects[object].fields[fieldName] = util.getFirstValueFromHash(newFieldRecord).fields.ID;
                }

                filters[i].fields[objects[object].fields[fieldName]] = fieldName;

                actionMarker: for(let action of this.__objectFilter[role][object][fieldName]){
                    if(!objects[object].actions[action]){
                        continue actionMarker;
                    }
                    filters[i].actions[objects[object].actions[action]] = action;
                }
            }
        }
1+1;
        return filters;
        //await Promise.all(filters.map((filter, index) => this.__addFilterForUserByRole(userID, userName, filter, role, index)));
    }

    async __addFiltersForUsersByRoles(addFilters, userInfo){
        let promises = [];
        let syncData = [];
        for(let userID in addFilters){
            let userName = userInfo[userID].user;
            for(let role of addFilters[userID]){
                syncData.push({
                    userID: userID,
                    userName: userName,
                    role: role
                });
                promises.push(this.__getFiltersByRole(role));
            }
        }
        let filtersArray = await Promise.all(promises);
        let addFiltersPromises = [];
        let filterIndex = 1;
        for(let i = 0; i < filtersArray.length; ++i){
            let filters = filtersArray[i];
            let {
                userID, userName, role
            } = syncData[i];
            for(let filter of filters){
                addFiltersPromises.push(
                    this.__addFilterForUserByRole(userID, userName, filter, role, filterIndex++)
                );
            }
        }
        return await Promise.all(addFiltersPromises);
        //return await Promise.all(filters.map((filter, index) => this.__addFilterForUserByRole(userID, userName, filter, role, index)));
    }

    /**
     * входные параметры
     * usersFilter = {
     *      userID: {
     *          name: userName,
     *          userFilters: {
     *              roleName: [
     *                  {
     *                      ID: userFilterID from users_filters,
     *                      filterID: filterID from filters
     *                  }
     *              ]
     *          }
     *      }
     * }
     *
     * initiatorRoles = {
     *      userID: [rolesNames]
     * }
     * */
    async __configureUsersFilters(usersFilters, initiatorRoles, userInfo){
        let delFiltersID = [];
        let delUserFiltersID = [];
        // проверяем наличие лишних фильтров
        for(let userID in usersFilters){
            let userName = usersFilters[userID].name;
            for(let roleName in usersFilters[userID].userFilters){
                if(!initiatorRoles[userID] || !initiatorRoles[userID].indexOf(roleName) < 0){
                    usersFilters[userID].userFilters[roleName].forEach(info => {
                        delFiltersID.push(info.filterID);
                        delUserFiltersID.push(info.ID);
                    })
                }
            }
        }

        // удаляем лишние фильтры (filters) и фильтры пользователей (users_filters)
        await this.__deleteUsersRolesByID(delUserFiltersID);
        await this.__deleteFiltersByID(delFiltersID);

        // сверяем необходимые фильтры с уже имеющимися
        let addFilters = {};
        for(let userID in initiatorRoles){
            for(let roleName of initiatorRoles[userID]){
                if(!usersFilters[userID] || !usersFilters[userID].userFilters[roleName]){
                    if(!addFilters[userID]){
                        addFilters[userID] = [];
                    }
                    addFilters[userID].push(roleName);
                }
            }
        }
        await this.__addFiltersForUsersByRoles(addFilters, userInfo);
    }

    async run(parameters = {}, token){
        console.log("Start new user create");
        // получаем интерфейс объекта "Пользователи" из проекта "helpDesk"
        let initiatorHDInterface = await this.__getInterface("helpDesk", "initiatorHD");
        // получаем идентификаторы ролей доступа для определенного уровня пользователей (инициатор, куратор, исполнитель)
        let roles = await this.__getRoles();

        // получаем информацию из объекта "Пользователи" проекта "helpDesk"
        let initiatorHDFilter = this.__formFilterByParameters(initiatorHDInterface, parameters);
        let initiatorRecords = await this.__getInitiatorsHD(initiatorHDFilter);
        // определяем. какие права должны быть у обрабатываемых пользователей
        let initiatorRoles = this.__getHelpDeskRoles(initiatorRecords);

        // получаем информацию о пользователях из подсистемы "Права доступа"
        let usersRecords = await this.__getUsers(Object.keys(initiatorRecords));
        // определяем, какие из прав проекта helpDesk уже есть у пользователей
        let usersRoles = this.__getUsersRoles(usersRecords);
        let usersFilters = this.__getUsersFilters(usersRecords);

        // конфигурирование ролей доступа для пользователей проекта "helpDesk"
        let userInfo = this.__getUsersInfo(usersRecords);
        // конфиругирование статических ролей для пользователей
        await this.__configureUsersRoles(initiatorRoles, usersRoles, roles, userInfo);
        // конфигурирование динамических прав доступа
        await this.__configureUsersFilters(usersFilters, initiatorRoles, userInfo);
    }
}

let name = "createUser_helpDesk";
let plugin = new pluginClass();

/*
plugin.run()
    .catch((e) => {
        console.log();
    });
*/

export {
    plugin as plugin,
    name as name
}
