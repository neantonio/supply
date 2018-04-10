import {objectView} from "./objectView";
import * as crypto from "crypto";
import * as validator from "validator";
import * as uuid from "uuid";
import {logger} from "./Logger/controller";
import * as _ from "lodash";

//экспорт для тестирования модуля
export class Permissions extends objectView {
    constructor(filename) {
        super(filename);
        const ref = 'role';
        this.obj = {
            actions: `${ref}.actions`,
            objects: `${ref}.objects`,
            users: `${ref}.users`,
            roles: `${ref}.roles`,
            usersRoles: `${ref}.usersRoles`,
            rolesAction: `${ref}.rolesAction`,
            usersToken: `${ref}.usersToken`
        };
    }

    async init() {
        let self = this;
        await super.init.call(this);
        let intfc = _.cloneDeep(await super.getInterface());
        // const interfaceRole = await super.query("role", "getInterface", {});
        // let interfaceSupply = await super.query("supply", "getInterface", {});
        // await this._setPrivileges(interfaceRole);
        const nameMainObject = intfc.name;
        await setPrivilegesRecursive(intfc);

        async function setPrivilegesRecursive(intfc, name) {
            const objectViews = intfc.objectViews;
            let fullName;
            if (name) {
                fullName = `${name}.${intfc.name}`;
            } else {
                fullName = `${intfc.name}`;
            }
            await self._setPrivileges(intfc, fullName);
            for (let ov in objectViews) {
                // await self._setPrivileges(objectViews[ov], fullName);
                await setPrivilegesRecursive(objectViews[ov], fullName);
            }
        }

        //добавляются методы родителя к текущему, в каждый метод последним параметром добавляется токен
        for (let nameMethod in this.__interface.methods) {
            if (nameMethod !== 'getInterface' && nameMethod !== '') {
                let codeMethod = Object.getPrototypeOf(Object.getPrototypeOf(this))[nameMethod];
                this[nameMethod] = async function (...args) {
                    const token = args.pop();
                    const userData = await this._checkToken(token);
                    if (Object.keys(userData.records).length === 0) {
                        logger.write("warning", `Token is not registered in system.`);
                        throw('Token is not registered in system.');
                    }
                    const userUUID = Object.keys(userData.records)[0];
                    const userID = userData.records[userUUID].fields.ID;
                    await self._checkUser(userID, nameMethod, nameMainObject);
                    return codeMethod.call(self, ...args);
                };
            }
        }
    }

    async _checkUser(userID, nameMethod, nameMainObject) {
        // const recID = Object.keys(tokenData.records)[0];

        // const userID = tokenData.records[recID].fields.ID;
        const mergedRoles = await this._mergeRoles(userID);
        for (let r in mergedRoles) {
            const method = mergedRoles[r].fields.description;
            const nameObject = mergedRoles[r].fields.objectID.description;
            if (method === nameMethod && nameObject === nameMainObject) {
                return true;
            }
        }
        throw('User is not found.');
    }

    async _setPrivileges(iface, name) {
        const o = this.obj;
        // let interfaceRole = await super.query("role", "getInterface", {});
        // let interfaceSupply = await super.query("supply", "getInterface", {});

        function getObjMethods(intface, preIntfaceName) {
            const result = {};
            const objects = Object.keys(intface.objects);
            const methods = Object.keys(intface.methods);
            if (objects.length === 0) {
                return getMainObjMethods(intface, preIntfaceName);
            } else {
                for (let obj in objects) {
                    let nameObj;
                    if (preIntfaceName) {
                        nameObj = preIntfaceName + '.' + objects[obj];
                    } else {
                        nameObj = objects[obj];
                    }
                    result[nameObj] = [];
                    for (let m in intface.objects[objects[obj]].methods) {
                        result[nameObj].push(m);
                    }
                }
                return result;
            }
        }

        function getMainObjMethods(intface, preIntfaceName) {
            if (!preIntfaceName) {
                preIntfaceName = intface.name;
            }
            const result = {};
            // const objects = Object.keys(intface.methods);
            result[preIntfaceName] = [];
            for (let m in intface.methods) {
                result[preIntfaceName].push(m);
            }
            return result;
        }

        let objMethodsSupply = getObjMethods(iface, name);
        // let mainObjMethodsSupply = getMainObjMethods(iface, name);
        // _.merge(objMethodsSupply, mainObjMethodsSupply);
        let objects = await super.query(o.objects, "get", {});
        let objectsInDB = {};
        for (let f in objects.records) {
            objectsInDB[objects.records[f].fields.description] = objects.records[f].fields.ID;
        }

        //ищем недостающие объекты, если находим - записываем в бд
        const toObjects = [];
        for (let f in objMethodsSupply) {
            const tmp = f;
            //тут творится ппц магия, f не видится ниже этого коммента!!!
            if (!objectsInDB[tmp]) {
                toObjects.push({description: tmp});
            }
        }
        if (toObjects.length !== 0) {
            await super.query(o.objects, "insert", {values: toObjects});
        }

        //получаем обновленные записи, для того чтобы узнать uuid новых записей
        objects = await super.query(o.objects, "get", {});
        objectsInDB = {};
        for (let f in objects.records) {
            objectsInDB[objects.records[f].fields.description] = objects.records[f].fields.ID;
        }
        objMethodsSupply = getObjMethods(iface, name);
        // mainObjMethodsSupply = getMainObjMethods(iface);
        // _.merge(objMethodsSupply, mainObjMethodsSupply);

        const actionsSupply = await super.query(o.actions, "get", {});

        //смотрим все записи в actions и если находим недостающие записи то вставляем их
        const toActions = [];
        for (let f in objMethodsSupply) {
            const methods = objMethodsSupply[f];
            for (let m in methods) {
                const objectID = objectsInDB[f];
                if (!findAction(actionsSupply.records, methods[m], objectID)) {
                    toActions.push({
                        description: methods[m],
                        objectID: objectID
                    });
                }

            }
        }
        // return;
        if (toActions.length !== 0) {
            await super.query(o.actions, "insert", {values: toActions});
        }

        function findAction(actions, nameAction, objectID) {
            for (let f in actions) {
                if (actions[f].fields.description === nameAction && actions[f].fields.objectID === objectID) {
                    return {ID: actions[f].fields.ID, description: actions[f].fields.description};
                }
            }
            return false;
        }

        await this._setAdminPrivileges();
        return 'success';
    }

    async _setAdminPrivileges() {
        //если нет админской учетки в users и roles, то херачим новую учетку Администратор в users и roles и связи к ним, иначе
        const user = 'Администратор';
        const role = 'Администратор';
        const o = this.obj;
        const userExist = await this._isUserExist(user);
        const roleExist = await this._isRoleExist(role);

        let userID;
        let roleID;
        if (!userExist) {
            //добавляем админа в хранилище
            const toUsers = [{
                description: user,
                user: 'admin',
                password: 'root'
            }];
            await super.query(o.users, "insert", {values: toUsers});
            userID = toUsers.ID;
        } else {
            userID = userExist.ID;
        }

        if (!roleExist) {
            //добавляем роль
            const toRoles = [{description: role}];
            await super.query(o.roles, "insert", {values: toRoles});
            roleID = toRoles[0].ID;
        } else {
            roleID = roleExist.ID;
        }

        //проверяем связку в таблице userRoles
        const userRolesExist = await this._isUserRolesExist(userID, roleID);
        if (!userRolesExist) {
            const toUserRoles = [{userID: userID, roleID: roleID}];
            await super.query(o.usersRoles, "insert", {values: toUserRoles});
        }

        await this._checkRolesAction(role);
        return 'Задача по установке полных прав администратору системы завершена успешно.';

        //проверяет есть ли в таблице rolesAction все связки для actions и введенной роли
    }

    async _isUserRolesExist(userID, roleID) {
        const obj = await super.query(this.obj.usersRoles, "get", {});
        const records = obj.records;
        for (let u in records) {
            if (records[u].fields.userID === userID && records[u].fields.roleID === roleID) {
                return records[u].fields;
            }
        }
        return false;
    }

    async _isUserExist(user) {
        const users = await super.query(this.obj.users, "get", {});
        const records = users.records;
        for (let u in records) {
            if (records[u].fields.description === user) {
                return records[u].fields;
            }
        }
        return false;
    }

    async _isRoleExist(role) {
        const rls = await super.query(this.obj.roles, "get", {});
        const records = rls.records;
        for (let u in records) {
            if (records[u].fields.description === role) {
                return records[u].fields;
            }
        }
        return false;
    }

    async _checkRolesAction(role) {
        const roleInfo = await this._isRoleExist(role);
        const missedRolesActions = [];
        const rolesAction = await super.query(this.obj.rolesAction, "get", {});
        const actions = await super.query(this.obj.actions, "get", {});
        const recordsActions = actions.records;
        const recordsRolesAction = rolesAction.records;
        for (let u in recordsActions) {
            const actionID = recordsActions[u].fields.ID;
            const inRolAction = inRolesAction(roleInfo.ID, actionID, recordsRolesAction);
            if (inRolAction !== false) {
                missedRolesActions.push({rolesID: inRolAction.rolesID, actionID: inRolAction.actionID});
            }
        }

        function inRolesAction(roleID, actionID, recordsRolesAction) {
            for (let r in recordsRolesAction) {
                //если данная роль и вид действия в системе (actionID) отсутсвуют тогда в массив их
                if (recordsRolesAction[r].fields.rolesID === roleID && recordsRolesAction[r].fields.actionID === actionID) {
                    return false;
                }
            }
            return {rolesID: roleID, actionID: actionID};
        }

        //если в массиве с отсутствующими ролями и действиями есть что-нибудь, то добавляем их в хранилище
        if (missedRolesActions.length !== 0) {
            await super.query(this.obj.rolesAction, "insert", {values: missedRolesActions});
            return `Недостающие actions для роли ${roleInfo.description}`;
        } else {
            return `Все actions у роли "${roleInfo.description}" уже существуют.`
        }
    }

    async _checkToken(token) {
        if (typeof token !== 'string') {
            throw('Invalid token.');
        }
        const o = this.obj;
        const tokenData = await super.query(o.users, "get", {
            fields: [
                'ref.usersRoles.roleID.ref.rolesAction.actionID.description',
                'ref.usersRoles.roleID.ref.rolesAction.description',
                'ref.usersRoles.roleID.ref.rolesAction.actionID.objectID.description'
            ],
            filter: {
                comparisons: {
                    token: {
                        left: {
                            type: 'field',
                            value: 'ref.usersToken.token'
                        },
                        right: {
                            type: 'value',
                            value: token
                        },
                        sign: 'equal'
                    }
                },
                tree: {
                    and: ['token']
                }
            }
        });
        return tokenData;
    }

    //сделать пересечение ролей, далее вызов основного getInterfaces
    async getInterface(token) {
        // порезать права юзера без токена
        if (!token) {
            const interfaceObject = {
                name: 'permissions',
                common: 'permissions',
                description: 'permissions',
                methods: {
                    login: {
                        description: 'Позволяет войти в систему',
                        type: 'object',
                        parameters: [
                            {
                                "description": "Имя пользователя",
                                "name": "login",
                                "type": "string"
                            },
                            {
                                "description": "Пароль",
                                "name": "password",
                                "type": "string"
                            }
                        ]
                    },
                    getInterface: {
                        "description": "Возвращает информацию об объектах предметной области.",
                        "type": "object",
                        parameters: [
                            {
                                "description": "Токен",
                                "name": "token",
                                "type": "string"
                            }
                        ]
                    },
                    logout:
                        {
                            description: 'Позволяет выйти из системы',
                            type: 'object',
                            parameters: [
                                {
                                    "description": "Токен",
                                    "name": "token",
                                    "type": "string"
                                }
                            ]
                        },
                },
                objects: {},
                links: {},
                refs: {}
            };
            return interfaceObject;
        }

        // токен массив
        const intface = _.cloneDeep(await super.getInterface.call(this));

        const tokenData = await this._checkToken(token);

        //перебор
        // не получится т.к. идет выборка по одному токену, т.е запись по любому одна возратится или 0

        if (Object.keys(tokenData.records).length === 0) {
            logger.write("warning", `Token is not registered in system.`);
            throw('Token is not registered in system.');
        }

        // todo: проверка формата токена (uuid и тд)

        //выборка юзера
        const recID = Object.keys(tokenData.records)[0];

        const userID = tokenData.records[recID].fields.ID;
        const mergedRoles = await this._mergeRoles(userID);

        // для удаления методов из интерфейса
        const objectViews = intface.objectViews;
        const nameMainObject = intface.name;
        deleteMethodFromObjectView(intface, nameMainObject, mergedRoles);
        for (let ov in objectViews) {
            // сначала удаляем права из methods

            // затем из objects
            const objectsInObjectView = objectViews[ov].objects;
            for (let o in objectsInObjectView) {
                const nameObject = `${nameMainObject}.${ov}.${objectsInObjectView[o].name}`;
                deleteMethodFromObject(objectsInObjectView[o], nameObject, mergedRoles);
                if (Object.keys(objectsInObjectView[o].methods).length === 0) {
                    delete objectsInObjectView[o];
                }
            }
        }

        // удаляет методы из objects
        function deleteMethodFromObject(object, objectName, allowedMethodsForUser) {
            const methodsOV = object.methods;
            for (let m in methodsOV) {
                if (!isMethodAllowed(m, objectName, allowedMethodsForUser)) {
                    delete methodsOV[m];
                }
            }
        }

        // удаляет методы из methods у главного объекта
        function deleteMethodFromObjectView(object, objectName, allowedMethodsForUser) {
            const methodsOV = object.methods;
            for (let m in methodsOV) {
                if (!isMethodAllowed(m, objectName, allowedMethodsForUser)) {
                    delete methodsOV[m];
                }
            }
        }

        // дозволен ли данный метод для пользователя
        function isMethodAllowed(methodName, nameObjectView, allowedMethodsForUser) {
            for (let u in allowedMethodsForUser) {
                const allowedObjectName = allowedMethodsForUser[u].fields.objectID.description;
                const allowedMethodName = allowedMethodsForUser[u].fields.description;
                if (allowedObjectName === nameObjectView && allowedMethodName === methodName) {
                    return true;
                }
            }
            return false;
        }

        return intface;
        // todo: получить getInterfaces из предка, затем посмотреть что там есть, и сформировать похожую структуру


        //таблица для юзеров токены
        //новый токен делаем, или используем существующий
        //достаем пользователя по токену
        //и к нему достаем права
        //fields:
        //ref.usersRoles.roleID.ref.roleActions.actionID.description - действия для пользователя
        //ref.usersRoles.roleID.ref.roleActions.actionID.objectID.description
        //filter:{
        //  comparisons: {
        //      token: {
        //          left: {
        //              type: 'field',
        //              value: 'ref.tokens.token'
        //          },
        //          right: {
        //              type: 'value',
        //              value: token
        //          },
        //          sign: 'equal'
        //      }
        //  },
        //  tree: {
        //      and: ['token']
        //  }
        //}

        //сделать ТЧ для юзеров, токены
        //добавить для каждого в ov.methods параметр
        //
    }

    async _generateAuthToken(userID, experationDate) {
        // todo: мб добавить поле "Дата создания"
        // todo: доделать дату истечения срока токена. И вообще лучше хранить дату входа, далее просто иметь константу срока хранения токена
        // if (experationDate) {
        //
        // }
        const token = uuid.v4();
        await super.query(this.obj.usersToken, "insert", {
            values: [{
                token: token,
                userID: userID
            }]
        });
        return token;
    }

    //values login pass service hash
    async login(user, password) {
        const userDataFromDB = await this._getUserData(user);
        if (Object.keys(userDataFromDB.records).length === 0) {
            logger.write("warning", 'User is not registered');
            throw('User is not registered');
        }
        const uuidRow = Object.keys(userDataFromDB.records)[0];
        const userIDFromDB = userDataFromDB.records[uuidRow].fields.ID;
        const hashPasswordFromDB = userDataFromDB.records[uuidRow].fields.password;
        const saltFromDB = userDataFromDB.records[uuidRow].fields.salt;

        const hash = this._encryptPassword(password, saltFromDB);
        if (hash === hashPasswordFromDB) {
            const token = await this._generateAuthToken(userIDFromDB);
            return token;
        } else {
            logger.write("warning", 'Incorrect username or password.');
            throw('Incorrect username or password.');
        }
    }

    async _getUserData(user) {
        return super.query('role.users', "get", {
            fields: [],
            filter: {
                comparisons: {
                    user: {
                        left: {
                            type: 'field',
                            value: 'user'
                        },
                        right: {
                            type: 'value',
                            value: user
                        },
                        sign: 'equal'
                    }
                },
                tree: {
                    and: ['user']
                }
            }
        });
    }

    // зашифровывает пароль в хэш с солью
    _encryptPassword(password, salt) {
        return crypto.createHmac('sha1', salt).update(password).digest('hex');
    }

    _generateSymbols(lengthWord) {
        const chars = ['a', 'b', 'c', 'd', 'e', 'f', '(', ')', '[', ']', '!', '?', 'g', 'h', 'i', 'j', 'k', 'l', '&', '^', '%', '@', '*', '$', 'm', 'n', 'o', 'p', 'r', 's', '<', '>', '/', '|', '+', '-', 't', 'u', 'v', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'V', 'X', 'Y', 'Z', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '.', ',', '{', '}', '`', '~'];
        let password = '';
        for (let i = 0; i < lengthWord; i++) {
            const index = getRandomInt(0, chars.length);
            password += chars[index];
        }
        return password;

        function getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min)) + min;
        }
    }

    _checkAuthData(user, password) {
        // const pass = this._encryptPassword(password);
        const userDataFromDB = super.query(this.o.users, "get", {
            fields: [
                'user',
                'password',
                'salt'
            ],
            filter: {
                comparisons: {
                    user: {
                        left: {
                            type: 'field',
                            value: 'users.user'
                        },
                        right: {
                            type: 'value',
                            value: user
                        },
                        sign: 'equal'
                    }
                },
                tree: {
                    and: ['user']
                }
            }
        });
        const userFromDB = userDataFromDB.user; // TODO исправить на верные данные
        const hashPasswordFromDB = userDataFromDB.password; // TODO исправить на верные данные
        const saltFromDB = userDataFromDB.salt; // TODO исправить на верные данные

        const hash = this._encryptPassword(password, saltFromDB);
        if (hash === hashPasswordFromDB) {
            return 'Login is success.'
        } else {
            return 'Incorrect username or password.'
        }
    }

    async logout(token) {
        super.query(this.o.usersToken, "delete", {
            filter: {
                comparisons: {
                    token: {
                        left: {
                            type: 'field',
                            value: 'ref.tokens.token'
                        },
                        right: {
                            type: 'value',
                            value: token
                        },
                        sign: 'equal'
                    }
                },
                tree: {
                    and: ['token']
                }
            }
        })
            .then((res) => 'Logout is successful')
            .catch((err) => 'Logout is successful'); // в любом случае логаут успешный
    }

    async _registerNewUser(fullUserName, login, password, email) {
        const self = this;
        if (login.search(/^[a-zA-Z0-9_]+$/) === -1) {// валидация логина, только английские буквы
            logger.write("warning", 'Unacceptable symbols in login.');
            throw('Unacceptable symbols in login.');
        }
        if (fullUserName.search(/^[a-zA-Zа-яА-Я'][a-zA-Zа-яА-Я-' ]+[a-zA-Zа-яА-Я']?$/) === -1) {//валидация фио
            logger.write("warning", 'Incorrect fio.');
            throw('Incorrect fio.');
        }
        if (password.length === 0) {
            logger.write("warning", 'Empty password.');
            throw('Empty password.');
        }
        if (email && validator.isEmail(email)) {
            email = null;
        }
        const salt = this._generateSymbols(6);
        const pswd = this._encryptPassword(password, salt);
        await super.query('role.users', "insert", {
            values: [{
                description: fullUserName,
                password: pswd,
                user: login
            }]
        });

        // await registrationUser();
        return `User ${fullUserName} has been registered successfully.`;
    }

    // async query(object, method, parameters = {}, token) {
    //     // по токену определяем роль пользователя, и режем права
    //
    //
    //     await super.init.call(this, object, method, parameters);
    // }

    //
    /*async _setUserPrivileges() {
        //если нет админской учетки в users и roles, то херачим новую учетку Администратор в users и roles и связи к ним, иначе
        let user = 'Тестовый пользователь';
        let role = 'Только чтение';
        let o = this.obj;
        let userExist = await this._isUserExist(user);
        let roleExist = await this._isRoleExist(role);

        let userID;
        let roleID;
        if (!userExist.description) {
            //добавляем админа в хранилище
            let toUsers = [{
                description: user,
                user: 'testUser',
                password: 'root'
            }];
            await super.query(o.users, "insert", {values: toUsers});
            userID = toUsers.ID;
            // return Promise.reject(`Пользователя "${user}" с ролью "${role}" не существует в хранилище.`);
        } else {
            // let userInfo = await this._isUserExist(user);
            userID = userExist.ID;
        }

        if (!roleExist.description) {
            //добавляем роль
            let toRoles = [{description: role}];
            await super.query(o.roles, "insert", {values: toRoles});
            roleID = toRoles[0].ID;
        } else {
            // let roleInfo = await this._isRoleExist(role);
            roleID = roleExist.ID;
        }

        //проверяем связку в таблице userRoles
        let userRolesExist = await this._isUserRolesExist(userID, roleID);
        if (!userRolesExist) {
            let toUserRoles = [{userID: userID, roleID: roleID}];
            await super.query(o.usersRoles, "insert", {values: toUserRoles});
        }

        await this._addRolesAction(role);
        return 'Задача по установке полных прав администратору системы завершена успешно.';

        //проверяет есть ли в таблице rolesAction все связки для actions и введенной роли
    }

    async _addRolesAction(role) {
        let roleInfo = await this._isRoleExist(role);
        let missedRolesActions = [];
        let rolesAction = await super.query(this.obj.rolesAction, "get", {});
        let actions = await super.query(this.obj.actions, "get", {});
        let recordsActions = actions.records;
        let recordsRolesAction = rolesAction.records;
        for (let u in recordsActions) {
            let actionID = recordsActions[u].fields.ID;
            if (Object.keys(recordsRolesAction).length === 0) {
                missedRolesActions.push({rolesID: roleInfo.ID, actionID: actionID});
            } else {
                for (let r in recordsRolesAction) {
                    //если данная роль и вид действия в системе (actionID) отсутсвуют тогда в массив их
                    if (!recordsRolesAction[r].fields.rolesID === roleInfo.ID && !recordsRolesAction[r].fields.actionID === actionID) {
                        missedRolesActions.push({rolesID: roleInfo.ID, actionID: actionID});
                    }
                }
            }
        }

        //если в массиве с отсутствующими ролями и действиями есть что-нибудь, то добавляем их в хранилище
        if (missedRolesActions.length !== 0) {
            await super.query(this.obj.rolesAction, "insert", {values: missedRolesActions});
            return `Недостающие actions для роли ${roleInfo.description}`;
        } else {
            return `Все actions у роли "${roleInfo.description}" уже существуют.`
        }
    }*/

    async _getRolesForUser(userID) {
        const rolesForUser = [];
        const resRoleUser = await super.query('role.users', "get", {
            fields: [
                'ref.usersRoles.roleID.description',
            ],
            filter: {
                comparisons: {
                    user: {
                        left: {
                            type: 'field',
                            value: 'ID'
                        },
                        right: {
                            type: 'value',
                            value: userID
                        },
                        sign: 'equal'
                    }
                },
                tree: {
                    and: ['user']
                }
            }
        });
        if (Object.keys(resRoleUser.records).length === 0) {
            throw('Roles for this role is not found.');
        }
        for (let row in resRoleUser.records) {
            const arrUsersRoles = resRoleUser.records[row].refs.usersRoles;
            for (let usrRole in arrUsersRoles) {
                const uuidRoleID = Object.keys(arrUsersRoles[usrRole].fields.roleID)[0];
                const roleID = arrUsersRoles[usrRole].fields.roleID[uuidRoleID].fields.ID;
                rolesForUser.push(roleID);
            }
        }

        return rolesForUser;
    }

    async _getActionsForRole(roleID) {
        const actionsForRole = {};
        const resActionsForRole = await super.query('role.roles', "get", {
            fields: [
                'ref.rolesAction.actionID.description',
                'ref.rolesAction.actionID.objectID.description'
            ],
            filter: {
                comparisons: {
                    role: {
                        left: {
                            type: 'field',
                            value: 'ID'
                        },
                        right: {
                            type: 'value',
                            value: roleID
                        },
                        sign: 'equal'
                    }
                },
                tree: {
                    and: ['role']
                }
            }
        });
        if (Object.keys(resActionsForRole.records).length === 0) {
            return {};
        }

        for (let row in resActionsForRole.records) {
            const arrRolesAction = resActionsForRole.records[row].refs.rolesAction;
            for (let roleAction in arrRolesAction) {
                actionsForRole[roleAction] = arrRolesAction[roleAction];
            }
        }

        // const idRecord = Object.keys(resActionsForRole.records)[0];
        return actionsForRole;
    }

    async _mergeRoles(userID) {
        // Получить все роли
        const rolesForUser = await this._getRolesForUser(userID);

        // получить actions для каждой роли
        let promisesActionsForUser = rolesForUser.map(roleID => this._getActionsForRole(roleID));
        let actionsForUser = await Promise.all(promisesActionsForUser);

        // для каждой роли убрать повторяющиеся
        let arrActUser = {};
        for (let i = 0; i < actionsForUser.length; i++) {
            for (let act in actionsForUser[i]) {
                const arrActions = actionsForUser[i][act].fields.actionID;
                for (let idAction in arrActions) {
                    if (!arrActUser[idAction]) {
                        arrActUser[idAction] = arrActions[idAction];
                    }
                }
            }
        }

        //возвращаем смерженные права
        return arrActUser;

        // наружу отправить роли скопом
    }
}
