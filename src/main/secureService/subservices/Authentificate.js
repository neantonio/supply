import * as crypto from "crypto";
import * as uuid from "uuid";
import {logger} from "../../../../Logger/controller";
import * as textM from "../../util/TextM";
import {EntityParserUtil} from "../../util/entityParserUtil";

export class Authentificate {

    constructor(objView) {
        this.objView = objView;
    }


    async login(user, password) {
        let usersArray;
        try {
            usersArray = EntityParserUtil.parse(await this._getUserData(user));
        } catch (e) {
            logger.write("error", e);
            throw new Error('User is not registered');
        }

        if (usersArray.length === 0) {
            logger.write("warning", 'User is not registered');
            throw new Error('User is not registered');
        }
        user = usersArray[0];

        const userID = user.fields.ID;
        const hashPassword = user.fields.password;
        const salt = user.fields.salt;
        const description = user.fields.description;

        const hash = this._encryptPassword(password, salt);
        if (hash === hashPassword) {
            const token = await this._generateAuthToken(userID);
            return {"token": token, "description" : description };
        } else {
            logger.write("warning", 'Incorrect username or password.');
            throw('Incorrect username or password.');
        }
    }

    async _getUserData(user) {
        return this.objView.query('role.users', "get", {
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


    _encryptPassword(password, salt) {
        return crypto.createHmac('sha1', salt).update(password).digest('hex');
    }

    async _generateAuthToken(userID, expirationDate) {
        const token = uuid.v4();
        let deltIttmp = await this.objView.query("role.users_tokens", "insert", {
            values: [{
                "IP": "127.0.0.1",
                "expirationDate": "2020-01-11",
                "token": token,
                "userID": userID
            }]
        });
        return token;
    }

    async logout(token) {
        let result = await this.objView.query(textM.role.users_tokens, textM.dbMethod.delete, {
            filter: {
                comparisons: {
                    name: {
                        left: {type: "field", value: textM.fields.token},
                        right: {type: "value", value: token},
                        sign: "equal"
                    }
                },
                tree: {and: ["name"]}
            }
        });
        return result;
    }


    _checkToken(tokenValue) {
        if (tokenValue === undefined || tokenValue === null) {
            throw Error(textM.message.notToken);
        }
    }
}