let dataRouter = require('./routers/dataRouter');
import {logger} from '../Logger/controller';

export class utils {
    static getByPath(path, object) {
        if (object === undefined) {
            return ''
        }
        let newObj = '';
        if (path[0] === 'uuid') {
            newObj = object[Object.keys(object)[0]]
        } else {
            newObj = object[path[0]];
        }
        if (path.length > 1) {
            let newPath = path.slice();
            newPath.shift();
            return this.getByPath(newPath, newObj);
        } else {
            return newObj;
        }
    }

    static getFullPath(refFlag, path) {
        let pathArray = path.split('.');
        let fullPath = pathArray.slice();
        for (let i = 0; i < pathArray.length - 1; i++) {
            if (refFlag !== pathArray[i]) {
                fullPath.splice(i * 2 + i + 1, 0, 'uuid', 'fields');
            }
        }
        return fullPath;
    }

    /**
     * Получает дополнительные
     * @param fields - описание полей с сервера
     * @param mainFK - поле для отображения внешнего ключа
     * @param fkInfo - сведения о дополнительных внешних полях
     * @returns {Array} - массив дополнительных полей для запроса
     */
    static getOptionalFieldsOld(fields, fkInfo = {}, mainFK = 'description') {
        let queryOptionalFields = [];
        for (let col in fields) {
            if (fields[col].type === 'link' || fields[col].type === 'ref') {
                queryOptionalFields.push(col + '.' + mainFK);
                if (fkInfo[col] !== undefined) {
                    for (let newCol in fkInfo[col].additional) {
                        queryOptionalFields.push(newCol);
                    }
                }
            }
        }
        return queryOptionalFields;
    }

    static getOptionalFields(fields, fkInfo = {}, mainFK = 'description') {
        let queryOptionalFields = {
            objectFields: [], // поля объекта ссылочного типа для которых мы дополнительно запрашиваем description
            additionalFields: [] // любые другие дополнительные поля
        };
        for (let col in fields) {
            if (fields[col].type === 'link') {
                queryOptionalFields.objectFields.push(col + '.' + mainFK);
                if (fkInfo[col] !== undefined) {
                    for (let newCol in fkInfo[col].additional) {
                        queryOptionalFields.additionalFields.push(newCol);
                    }
                }
                // выводим description главного объекта
            } else if (fields[col].type === 'ref') {
                queryOptionalFields.additionalFields.push(col + '.' + mainFK);
            }
        }

        if (!queryOptionalFields.objectFields.length && !queryOptionalFields.additionalFields.length) {
            queryOptionalFields = [];
        }

        return queryOptionalFields;
    }

    static async extendOptionalFields(object, fields, queryOptionalFields, fkInfo = {}, mainFK = 'description', token, objViewClient, commonInterface) {

        let objectFields = queryOptionalFields.objectFields;
        //objectFields = objectFields.filter(excludeParentID);

        let additionalFields = queryOptionalFields.additionalFields;

        if (additionalFields.length) {
            additionalFields = await checkAdditionalFields();
        }

        queryOptionalFields = objectFields.concat(additionalFields);

        return {
            gridColumns: fields,
            queryOptionalFields: queryOptionalFields
        };

        // функция проверяет поля в свойстве queryOptionalFields.additionalFields, удаляет те которые не существуют и добавляет в fields те поля которые можно выбрать
        async function checkAdditionalFields() {

            let newAdditionalFields = [];

            for (let i = 0; i < additionalFields.length; i++) {
                let fieldPath = additionalFields[i];
                let fieldAfterTitleArr = [];
                //let fieldCorrect = true;
                // по умолчанию смотрим в полях изначального объекта
                let currentFields = fields;

                const fieldsArr = fieldPath.split('.');
                // это вообще не дополнительно поле
                if (fieldsArr.length < 2) {
                    //fieldCorrect = false;
                } else {
                    let lastIndex = fieldsArr.length - 1;
                    // необходимо проверить что все что мы передали в fieldPath действительно валидные поля
                    for (let i = 0; i < fieldsArr.length; i++) {
                        let fieldName = fieldsArr[i];
                        let field = currentFields[fieldName];
                        fieldAfterTitleArr.push(field.title);
                        // поле проверить в текущих филдах объекта
                        if (currentFields[fieldName] === undefined) {
                            // если такого поля нет то исключить выбранный путь
                            //fieldCorrect = false;
                            console.log('Нет запрашиваемого поля ' + fieldPath + ' для объекта ' + object);
                            break;
                            // если поле последнее дополнить изначальные fields новым полем со свойствами required, title, type
                        } else if (i === lastIndex) {
                            let newFieldName = fieldsArr.join('*');
                            let type = Array.isArray(field.type) ? field.type[0] : field.type;
                            let fieldAfterTitle = '';
                            if (fieldAfterTitleArr.length) {
                                fieldAfterTitle = fieldAfterTitleArr.join('.');
                            }
                            fields[newFieldName] = {
                                title: fieldAfterTitle,
                                required: false,
                                type: type
                            };
                            newAdditionalFields.push(fieldPath);
                            // если это ссылочное поле то добавим еще и description и передадим имя объекта на клиент
                            if (type === 'link') {
                                fields[newFieldName].link = field.link;
                                newAdditionalFields.push(fieldPath + '.description');
                            }
                            // если поле не последнее(а значит это link)
                        } else {
                            let objectName = field.link || field.ref;
                            // получить его интерфейс
                            let objInterface;

                            objInterface = utils.getObjectInterface(commonInterface, objectName);
                            if (!objInterface) {
                                let errMsg = `Не удалось получить интерфейс при определении дополнительного поля ${objectName} объекта ${object}`;
                                logger.log('error', errMsg, new Error(errMsg));
                                break;
                            }
                            // текущие филды заменяются на филды из интерфейса
                            currentFields = objInterface.fields;
                        }
                    }
                }

                //return fieldCorrect;

            }

            return newAdditionalFields;

        }

        // TODO это костыль, но для поля которое отвечает за иерархию(а это всегда parentID) не нужно запрашивать description, он и без этого нам вернется, но если запросить то будет ошибка
        function excludeParentID(item) {
            let exclude = true;
            if (item === 'parentID.description') {
                exclude = false;
            }
            return exclude;
        }

    }

    /**
     * Функция дополняет стандартные поля дополнительно запрошенными
     * @param object - объект
     * @param fields - описание полей, которые будут дополнятся
     * @param queryOptionalFields - дополнительные поля
     * @param fkInfo - сведения о дополнительных внешних полях
     * @param mainFK - поле для отображения внешнего ключа
     * @returns {Promise.<*>}
     */
    static async extendOptionalFieldsOld(object, fields, queryOptionalFields, fkInfo = {}, mainFK = 'description', token, objViewClient) {
        //дозапрашиваем поля
        let queryParams = {
            object: object,
            method: 'get',
            filter: {
                'ID': {
                    value: 'c83c8d26-79f2-418c-9850-b53ee28c9ca5',
                    sign: 'equal'
                }
            },
            fields: queryOptionalFields,
            token: token,
            objViewClient: objViewClient
        };
        try {
            let optionalFieldsData = await  dataRouter.getServerData(queryParams);
            for (let newCol in optionalFieldsData.tableDesc.fields) {
                if (newCol.split('.').length === 2) {
                    if (newCol.split('.')[1] === mainFK) {
                        let sourceField = fields[newCol.split('.')[0]];
                        // если запрашиваем представление главного объекта то выведем его отдельным полем
                        if (sourceField !== undefined) {
                            if (sourceField.type === 'ref') {
                                fields[newCol.split('.').join('*')] = {
                                    title: 'ref_description',
                                    required: false,
                                    type: 'string'
                                };
                            }
                        }
                        // это для link
                        fields[newCol.split('.')[0]].title = fields[newCol.split('.')[0]].title + '(' + newCol + ')';
                    } else {
                        //дополнительное поле из этой же таблицы
                        fields[newCol.split('.').join('*')] = {
                            title: fields[newCol.split('.')[0]].title.split('(')[0] + '(' + newCol + ')',
                            required: false,
                            type: optionalFieldsData.tableDesc.fields[newCol]
                        };
                    }
                } else {
                    fields[newCol.split('.').join('*')] = {
                        required: false,
                        title: (fkInfo !== null && fkInfo[newCol.split('.')[0]] !== undefined ? fkInfo[newCol.split('.')[0]].additional[newCol] : ""),
                        type: optionalFieldsData.tableDesc.fields[newCol]
                    }
                }
            }
        } catch (err) {
            console.log("Ошибка при запросе мета-данных о дополнительных полях объекта " + object + " : " + err.stack);
            throw (err);
        }
        return fields;
    }

    /**
     * Формирует записи
     * @param object - объект
     * @param queryOptionalFields - дополнительные поля
     * @param filter - фильтр для запроса
     * @param mainFK - поле для отображения внешнего ключа
     * @returns {Promise.<{}>}
     * @param params - дополнительные параметры запроса, вида лимит и смещение
     */
    static async getRecords(queryOptions, mainFK = "description", commonInterface) {
        let gridRecords = {};
        try {
            // интерфейс получаем для того чтобы отличить какое из дополнительных полей ссылается на главный объект
            let objectInterface;
            // здесь небольшая заплатка для сохранения старого варианта работы при получении интерфейса
            if (!commonInterface) {
                objectInterface = await dataRouter.getInterface(queryOptions.objViewClient, queryOptions.object, queryOptions.token);
            } else {
                objectInterface = this.getObjectInterface(commonInterface, queryOptions.object);
            }
            //let objectInterface = await dataRouter.getInterface(queryOptions.objViewClient, queryOptions.object, queryOptions.token);
            //let objectInterface = this.getObjectInterface(commonInterface, queryOptions.object);
            let objectFields = objectInterface.fields;
            let serverData = await dataRouter.getServerData(queryOptions);
            gridRecords = serverData.records;
            if (queryOptions.fields !== undefined && queryOptions.fields.length > 0) {
                for (let i in queryOptions.fields) {
                    let fullPath = queryOptions.fields[i];
                    let fullPathArr = fullPath.split('.');

                    let pathLength = fullPathArr.length;

                    let pathBegin = fullPathArr[0];
                    let pathEnd = fullPathArr[fullPathArr.length - 1];

                    // нужно определить
                    let rerFieldName = await this._getRefFieldInPath(objectFields, fullPath, queryOptions.objViewClient, queryOptions.token, commonInterface);

                    /*let refFieldFlag = this._isRefField(objectFields, pathBegin);
                    let rerFieldName = refFieldFlag ? : '';*/

                    // не дописываем в записи внешние ключи, так они уже содержатся в объекте, но для ссылок на глвный объект делаем исключение
                    if (pathLength === 2 && pathEnd === mainFK && !rerFieldName) continue;

                    for (let recid in gridRecords) {
                        gridRecords[recid].fields[queryOptions.fields[i].split('.').join('*')] = '';
                        let val = '';
                        try {
                            val = this.getByPath(this.getFullPath(rerFieldName, queryOptions.fields[i]), gridRecords[recid].fields);
                        } catch (e) {
                            //console.log("Ошибка getByPath: " + e);
                        }
                        gridRecords[recid].fields[queryOptions.fields[i].split('.').join('*')] = val;
                    }
                }
            }
        } catch (err) {
            console.log("Ошибка при запросе записей объекта " + queryOptions.object + " : " + err.stack);
            throw (err);
        }

        return gridRecords;
    }

    /**
     * Метод получат на вход поля полученные методом getInterface и имя проверяемого поля. Возвращает true если поле ссылка на главный объект и false если нет
     * @param fields - поля полученные методом getInterface
     * @param fieldName - имя поля
     * @returns {boolean}
     * @private
     */
    static _isRefField(fields, fieldName) {
        let result = false;
        let field = fields[fieldName];
        if (field && field.type === 'ref') {
            result = true;
        }

        return result;
    }

    /**
     * Метод получат на вход поля полученные методом getInterface и имя проверяемого поля. Возвращает название поля, которое является ссылкой на главный объект
     * @param fields
     * @param path
     * @param objectView
     * @param token
     * @returns {Promise.<string>}
     * @private
     */
    static async _getRefFieldInPath(fields, path, objectView, token, commonInterface) {
        try {
            let refField = '';

            let fullPathArr = path.split('.');
            let lastIndex = fullPathArr.length - 1;
            for (let i = 0; i < fullPathArr.length; i++) {
                let fieldName = fullPathArr[i];
                let field = fields[fieldName];
                if (this._isRefField(fields, fieldName)) {
                    refField = fieldName;
                    break;
                } else if (i !== lastIndex) {
                    let objectName = field.link || field.ref;
                    //let objInterface = await dataRouter.getInterface(objectView, objectName, token);
                    let objInterface = this.getObjectInterface(commonInterface, objectName);
                    fields = objInterface.fields;
                }
            }
            return refField;
        } catch (err) {
            console.log(err);
        }
    }

    static getPrimaryKeyField(fields) {

        let PK = null;
        for (let fieldName in fields) {
            let field = fields[fieldName];
            if (field.isPrimary) {
                PK = fieldName;
                break;
            }
        }

        return PK;
    }

    static getObjectName(path) {

        let objectName;

        if (path.split('-refs-').length > 1) {
            objectName = path.split('-refs-')[path.split('-refs-').length - 1];
        } else {
            objectName = path.split('-')[1];
        }

        return objectName;

    }

    static getRefCol(fields) {
        let refCol = '';
        for (let col in fields) {
            if (fields[col].type === 'ref') {
                refCol = col;
            }
        }
        return refCol;
    }

    // получает вложенный интерфейс для конкретного объекта
    static getObjectInterface(commonInterface, object) {
        let result = null;
        let objInterface = commonInterface.objects[object];
        if (objInterface !== undefined) {
            result = objInterface;
        }
        return result;
    }
}