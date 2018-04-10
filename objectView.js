/**
 * Created by User on 02.06.2017.
 */

'use strict';

import {interfaceController} from './commonInterfaces/controller';
import {utilits} from './utilityController';
import {adapterController} from './adapterController';
import {typeController} from './typeController';
import {logger} from './Logger/controller';
import _ from "lodash";
import {subscriberView} from './subscriberView';
import {promiseReadDir, promiseReadFile} from './service/fsPromise';
import * as afs from 'async-file';
import {httpRequest} from "./service/requestPromise";
// import {routerConstructor} from "./plugins/pluginRouter/router"

/**
 * Обозначение знаков сравнения:
 *  equal       равно
 *  unEqual      неравно
 *  greater     больше
 *  less        меньше
 *  greaterEqual   больше или равно
 *  lessEqual      меньше или равно
 *  in          входит в множество
 *  rin         входит в иерархическую группу
 *  consist     включает в себя (операция со строками)
 * */

export class objectView {
    constructor(name) {
        if (!name)
            throw new Error(`'filename' обязательный параметр для конструктора объектного представления.`);
        this.__objects = {};
        this.__interface = {
            objects: {}
        };
        this.__objectViews = {};
        this.__name = name;
        // this.__pluginRouter = new routerConstructor("extended");
    }

    __formComparison(name, field, value) {
        return {
            left: {type: "value", value: value},
            right: {type: "field", value: field},
            sign: "equal"
        };
    }

    __getFilter(uniqueFields, addValues) {
        let schemaFilter = {
            comparisons: {},
            tree: {
                or: []
            }
        };

        let stageFilter = {
            comparisons: {},
            tree: {
                or: []
            }
        };
        for (let index in addValues) {
            let v = addValues[index];
            //console.log(value);
            //let v = value;
            //addValues.map((value, index) => {
            let arr = [];
            for (let uField in uniqueFields) {
                if (!v[uniqueFields[uField]]) {
                    logger.write(`error`, `Формирование фильтра для этапа. В одном из переданных описании отсутствует значение для уникального поля '${uField}'.`, new Error());
                    throw `Формирование фильтра для этапа. В одном из переданных описании отсутствует значение для уникального поля '${uField}'.`;
                }
                let name = `${uField}${index}`;
                let value = v[uniqueFields[uField]];
                let com = {
                    left: {type: "value", value: v[uniqueFields[uField]]},
                    right: {type: "field", value: uField},
                    sign: "equal"
                };
                schemaFilter.comparisons[name] = this.__formComparison(name, uField, value);
                stageFilter.comparisons[name] = this.__formComparison(name, uniqueFields[uField], value);
                arr.push(name);
            }
            schemaFilter.tree.or.push({and: arr});
            stageFilter.tree.or.push({and: arr});
            //});
        }
        return {
            stage: stageFilter,
            schema: schemaFilter
        };
    }

    __checkTree(tree) {
        let rTree = {};
        for (let f in tree)
            if (tree[f].length > 0) {
                let tArr = [];
                for (let part of tree[f])
                    if (part instanceof Array) {
                        let treePart = this.__checkTree(part);
                        if (JSON.stringify(treePart) !== "{}")
                            tArr.push(treePart);
                    }
                    else {
                        tArr.push(part);
                    }
                if (tArr.length > 0)
                    rTree[f] = tArr;
            }
        return rTree;
    }

    /// ИЗМЕНЯЕТ ПАРАМЕТР filter!!!!!
    async __stageFilterMode(schObj, stageName, filter = {}) {
        let unique = schObj.__interface.stages[stageName].unique;
        let lastStages = await schObj.get([], {}, {
            unique: Object.keys(unique),
            orderBy: [{
                field: 'date',
                sort: 'DESC'
            }]
        }, {});
        if (filter.tree) {
            filter.tree = this.__checkTree(filter.tree);
        }
        //let pk = this.__getPK(this.__objects[stageName].__interface);
        // ToDO: переделать на механизм stage/schema
        let values = lastStages.records[schObj.__interface.name].filter(x => x.stage === stageName).map(v => {
            let res = {};
            for (let f in unique) {
                res[unique[f]] = v[f];
            }
            return res;
        });
        let stUnique = {};
        Object.keys(unique).forEach(v => {
            stUnique[unique[v]] = unique[v];
        });
        if (values.length > 0) {
            let stageFilter = this.__getFilter(stUnique, values).schema;
            if (!filter.comparisons)
                filter = {
                    comparisons: {}
                };
            for (let c in stageFilter.comparisons) {
                filter.comparisons[c] = stageFilter.comparisons[c];
            }
            if (filter.tree) {
                filter.tree = {and: [stageFilter.tree, filter.tree]};
            }
            else {
                filter.tree = stageFilter.tree;
            }
            return filter;
        }
    }

    /**
     * async createUser(filter, values, parameters){
        let json = {
            method: "createUser_helpDesk",
            parameters: {
                filter: filter,
                values: values,
                parameters: {
                    object: this.__interface.name
                }
            },
            token: parameters.token
        };

        let result = await httpRequest("localhost", 8000, json);
    }
     *
     */



    __createMethodForPlugin(pluginParameters, connectionInfo, projectInfo){
        let self = this;
        return function (){
            let parameters = {};
            for(let i = 0; i<pluginParameters.length; ++i){
                parameters[pluginParameters[i].name] = arguments[i];
            }
            let token = parameters.parameters.token;
            parameters.parameters.project = projectInfo.project;
            parameters.parameters.object = projectInfo.object;

            let json = {
                method: connectionInfo.name,
                parameters: parameters,
                token: token
            };

            return httpRequest(connectionInfo.host, connectionInfo.port, json);

            // return self.__pluginRouter.query(connectionInfo.method, parameters, token)
        }
    }

    __pluginsInit(parentProjectName = ""){
        for(let object in this.__objects){
            if(this.__objects[object].__interface.plugins) {
                for (let pluginName in this.__objects[object].__interface.plugins){
                    let pluginInfo = this.__objects[object].__interface.plugins[pluginName];
                    /*
                    interfaceController.addMethod(
                        object,
                        pluginName,
                        pluginInfo.description,
                        pluginInfo.type,
                        pluginInfo.parameters
                    );
                    */
                    this.__objects[object][pluginName] = this.__createMethodForPlugin(
                        pluginInfo.parameters,
                        pluginInfo.connection,
                        {
                            project: parentProjectName,
                            object: object
                        }
                    )
                }
            }
        }
    }

    async init(parentProjectName = "") {
        let self = this;
        let objStorage = "./objectInterfaces/";
        // await this.__pluginRouter.init();
        let objDesc;
        let objs = {};
        // регистрация поддерживаемых типов данных
        await typeController.init();
        // Первичная настройка контроллеров интерфейсов и утилит
        await interfaceController.init();
        await utilits.init();
        // регистрация интерфейса для объектного описания
        let ovName = await interfaceController.interfaceRegistrationFromFile(this.__name + ".json");
        this.__interface = await interfaceController.getInterfaceByName(ovName);

        objDesc = this.__interface.objects;
        // если в описании не указан объект конкретной реализации, считаем, что имя такое же, как и у объекта предметной области
        for (let k in objDesc) {
            if (!objDesc[k].uObject)
                objDesc[k].uObject = k;

            if (!objDesc[k].fields)
                objDesc[k].fields = {};
        }

        /**
         * object: {
         *  utility: uName,
         *  object: oName
         * }
         * */
        // Регистрация интерфейсов
        await Promise.all(
            Object.keys(objDesc).map(
                o => interfaceController.interfaceRegistrationFromFile(`${__dirname}/objectInterfaces/${this.__name}/${o}.json`))
        );

        // проверка связанности зарегстрированных интерфейсов
        await interfaceController.check();
        // получение интрерфейсов объектов предметной области
        let ints = {};
        await Promise.all(Object.keys(objDesc).map(async (oName) => {
            let int = await interfaceController.getInterfaceByName(oName);
            ints[int.name] = _.cloneDeep(int);
        }));
        // загрузка адаптеров для объектов
        for (let i in ints) {
            //await Promise.all(ints.map(async (i) => {
            // Получаем утилиту для объекта
            let int = ints[i];
            let util = await utilits.getUtil(objDesc[int.name].utility);
            // формирование описания
            let uInfo = {
                object: objDesc[int.name].uObject,
                fields: {}
            };
            let fKeys = {};
            for (let f in int.fields) {
                if (objDesc[int.name].fields[f])
                    uInfo.fields[f] = objDesc[int.name].fields[f];
                else
                    uInfo.fields[f] = f;

                try {
                    if (!(int.fields[f].type instanceof Array) && ["link", "ref"].indexOf(int.fields[f].type) >= 0) {
                        let linkType = int.fields[f].type;
                        let linkToObject = int.fields[f][linkType];
                        let linkObject = ints[linkToObject];
                        let linkObjectPK = this.__getPK(linkObject);
                        let linkObjectPKType = linkObject.fields[linkObjectPK].type;
                        fKeys[f] = linkObjectPKType;
                    }
                }
                catch(e){
                    console.log()
                }
            }

            int.uInfo = uInfo;
            // получаем адаптер
            let adapter = await adapterController.getAdapter(int, objDesc[int.name].utility);
            // записываем объект в реестр
            this.__objects[int.name] = new adapter(int, util, fKeys);
            // todo АДСКИЙ КОСТЫЛЬ, ДАЁМ ОБЪЕКТУ ССЫЛКУ НА ВЫШЕСТОЯЩИЙ ОБЪЕКТ
            this.__objects[int.name].parent = this;
            await this.__objects[i].init();
        }

        // ВСЕ ЗАРЕГИСТРИРОВАНО!!
        // await self.loadSubscribers();

        for (let o in this.__objects) {
            // присоединение табличных частей
            for (let ref in this.__objects[o].__interface.refs) {
                await this.__objects[o].__setRef(ref, this.__objects[ref]);
            }
        }
        // инициализируем подчинённые предметные области
        for (let ov in this.__interface.objectViews) {
            console.log(ov);
            try {
                let newProjectPath = (parentProjectName ? parentProjectName + "." : "") + ov;
                this.__objectViews[ov] = /*new objectView(o)*/new subscriberView(ov);
                await this.__objectViews[ov].init(newProjectPath);
            }
            catch(e){
                console.log(e);
            }
        }
        this.__pluginsInit(parentProjectName);
    }

    /**
     * Добавляет в систему новый объект.
     * @param {string} oName Название объекта
     * @param {Object} oInt Интерфейс объекта
     * @param {string} utility Название утилиты для работы с объектом
     * @param {Object} uDesc Описание объекта в терминах утилиты
     */
    async addObject(oName, oInt, utility, uDesc) {
        // регистрируем интерфейс объекта в контроллере (ему нужны файлы, а у нас их нет, поэтому используем другой метод)
        await interfaceController.interfaceRegistration(oName, _.cloneDeep(oInt));
        logger.write(`debug`, `Интерфейс объекта ${oName} зарегистрирован.`);
        // проверка связанности зарегстрированных интерфейсов
        await interfaceController.check();
        // получаем полный интерфейс объекта с иерархией
        let int = await interfaceController.getInterfaceByName(oName);
        logger.write(`debug`, `Полный интерфейс объекта ${oName} получен.`);
        // получаем ссылку на утилиту
        let util = await utilits.getUtil(utility);
        logger.write(`debug`, `Получена утилита для работы с объектом ${oName}.`);
        // копируем uDesc, чтобы дополнить его
        let uInfo = {object: uDesc.uObject, fields: uDesc.fields ? _.cloneDeep(uDesc.fields) : {}};
        /*JSON.parse(JSON.stringify(uDesc));*/
        // сопоставляем поля объектного и утилитного описания объекта, получаем внешние ключи
        let fKeys = {};
        for (let f in int.fields) {
            // если в утилитном описании объекта поле отсутствует, то добавляем его туда, копируя сигнатуру из интерфейса
            if (!uInfo.fields[f]) {
                uInfo.fields[f] = f;
            }
            // если поле является ссылкой на другой объект
            let foreignObj = null;
            if (!(int.fields[f].type instanceof Array) && ["link", "ref"].indexOf(int.fields[f].type) >= 0) {
                // получаем интерфейс объекта, на который идёт ссылка
                foreignObj = await interfaceController.getInterfaceByName(int.fields[f][int.fields[f].type]);
                // узнаём тип его первичного ключа
                fKeys[f] = foreignObj.fields[this.__getPK(foreignObj)].type;
            }
        }
        logger.write(`debug`, `Представление объекта ${oName} дополнено, поля сопоставлены, внешние ключи определены.`);
        // ??? дополняем интерфейс объекта
        int.uInfo = uInfo;
        // имея полный интерфейс объекта и утилиту, получаем адаптер
        let adapter = await adapterController.getAdapter(int, utility);
        // регистрируем адаптер в OV
        this.__objects[oName] = new adapter(int, util, fKeys);
        logger.write(`debug`, `Адаптер для работы с объектом ${oName} создан и зарегистрирован.`);
        // инициализируем объект
        await this.__objects[oName].init();
        // если мы сюда дошли, записываем интерфейсы добавленных объектов в файлы
        let dataToAppend = {utility: utility, uObject: uDesc.uObject};
        if (uDesc.fields) {
            dataToAppend.fields = uDesc.fields;
        }
        await this.__writeObjectToFile(oName, oInt, dataToAppend);
        logger.write(`debug`, `Объект ${oName} добавлен.`);
        return `Объект ${oName} добавлен.`;
    }

    /**
     Сохраняет в файл *.json описание интерфейса объекта и обновляет файл objectView.json
     @arg oName Имя добавляемого объекта
     @arg dataToCreate Описание интерфейса, которое будет сохранено в отдельный файл
     @argdataToAppend Данные об интерфейсе объекта, которые будут дописаны в objectView.json
     */
    async __writeObjectToFile(oName, dataToCreate, dataToAppend) {
        let configFile = this.__name + '.json';

        // пишем в отдельный файл описание интерфейса объекта
        try {
            await afs.writeFile(`./objectInterfaces/${this.__name}/${oName}.json`, JSON.stringify(dataToCreate, null, 4));
            logger.write(`debug`, `Файл ${__dirname}./objectInterfaces/${oName}.json создан.`);
        } catch (e) {
            logger.write(`error`, `Не удалось создать файл ${oName}.json.`);
            return Promise.reject(`Не удалось создать файл ${oName}.json.`);
        }

        // читаем objectView.json, парсим, дополняем, перезаписываем
        try {
            let buf = await afs.readFile(configFile);
            buf = JSON.parse(buf);
            buf.objects[oName] = dataToAppend;
            await afs.writeFile(configFile, JSON.stringify(buf, null, 4));
            logger.write(`debug`, `Файл конфигурации ${configFile} обновлён.`);
        } catch (e) {
            logger.write(`error`, `Не удалось обновить файл конфигурации ${configFile}.`);
            return Promise.reject(`Не удалось обновить файл конфигурации ${configFile}.`);
        }
        return `Интерфейс объекта ${oName} сохранён.`;
    }

    async getInterface() {
        let int = _.cloneDeep(this.__interface);

        for(let o in int.objects) {
            int.objects[o] = await this.__objects[o].getInterface();
        }

        for(let ov in int.objectViews) {
            int.objectViews[ov] = await this.__objectViews[ov].getInterface();
        }

        return int;
    }

    __getPK(obj) {
        for (let f in obj.fields)
            if (obj.fields[f].isPrimary)
                return f;
    }

    __getRefKey(obj) {
        for (let f in obj.fields)
            if (obj.fields[f].type == "ref")
                return {
                    o: obj.fields[f].ref,
                    uo: this.__objects[obj.name].__uInfo.object,
                    rLink: f,
                    urLink: this.__objects[obj.name].__uInfo.fields[f]
                };
    }

    /**
     * Получает на вход имя объекта @obj и строку @link, начинающуюся с имени поля объекта - ссылки на другой объект,
     * либо ссылку на табличную часть
     *
     * obj = "obj1"
     * link = "field2.f1.description"
     *
     * Возвращает список объектов и связанных с ними объектов в хранилище
     * {
     *      "field2.f1": {
     *          "obj": "obj3",
     *          "uObj": "table3",
     *          "primary": {
     *              "pk": "ID",
     *              "upk": "id__uuid",
     *              "type": "uuid"
     *          },
     *          "fields": [
     *              {
     *                  "field": "description",
     *                  "ufield": "description__string",
     *                  "type": "string"
     *              }
     *          ]
     *      },
     *      "field2": {
     *          "obj": "obj2",
     *          "uObj": "table2",
     *          "primary": {
     *              "pk": "ID",
     *              "upk": "id__uuid",
     *              "type": "uuid"
     *          },
     *          "link":[
     *              {
     *                  "fk": "makerID",
     *                  "ufk": "maker_id__uuid",
     *                  "type": "uuid"
     *              }
     *          ]
     *      }
     * }
     * */
    async __getObject(obj, link) {
        let parts = link.split(".");
        let curObject = this.__objects[obj];
        let curPosition = parts[0], prevPosition;
        let res = {};
        for (let i = 0; i < parts.length - 1; ++i) {
            if (["ref", "link"].indexOf(parts[i]) >= 0) {
                curPosition += "." + parts[++i];
                if (!curObject.__interface.refs[parts[i]]) {
                    logger.write(`warning`, `Объект '${curObject.__interface.name}' не имеет табличной части с именем '${parts[i]}'.`, new Error());
                    throw `Ошибка при парсинге запроса`;
                }
                curObject = this.__objects[parts[i]];

                let pk = this.__getPK(curObject.__interface);
                if (!pk) {
                    logger.write(`warning`, `Объект ${curObject.name} не имеет поля, являющегося первичным ключом.`, new Error());
                    throw `Ошибка при парсинге запроса. Отсутствует первичный ключ у объекта '${curObject.__interface.name}'.`;
                }

                res[curPosition] = {
                    "primary": {
                        "pk": pk,
                        "type": curObject.__interface.fields[pk].type,
                        "upk": curObject.__uInfo.fields[pk]
                    },
                    "obj": curObject.__interface.name,
                    "uObj": curObject.__uInfo.object,
                    "link": {},
                    "fields": [],
                    "rLink": this.__getRefKey(curObject.__interface)
                };
            }
            else {
                if (["link", "ref"].indexOf(curObject.__interface.fields[parts[i]].type) < 0) {
                    logger.write(`warning`, `Поле '${parts[i]}' объекта '${curObject.name}' не является ссылкой на объект.`, new Error());
                    throw `Ошибка при парсинге запроса`;
                }

                curObject = this.__objects[curObject.__interface.fields[parts[i]][curObject.__interface.fields[parts[i]].type]];

                let PK = this.__getPK(curObject.__interface);
                if (!PK) {
                    logger.write(`warning`, `Объект ${curObject.name} не имеет поля, являющегося первичным ключом.`, new Error());
                    throw `Ошибка при парсинге запроса`;
                }

                res[curPosition] = {
                    "primary": {
                        "pk": PK,
                        "type": curObject.__interface.fields[PK].type,
                        "upk": curObject.__uInfo.fields[PK]
                    },
                    "obj": curObject.__interface.name,
                    "uObj": curObject.__uInfo.object,
                    "link": {},
                    "fields": []
                };

                if (prevPosition)
                    res[prevPosition].link[parts[i]] = {
                        "o": curPosition,
                        "fk": parts[i],
                        "ufk": this.__objects[res[prevPosition].obj].__uInfo.fields[parts[i]]
                    };
            }
            prevPosition = curPosition;
            curPosition += "." + parts[i + 1];
        }
        if (prevPosition) {
            try {
                res[prevPosition].fields.push({
                    "field": parts[parts.length - 1],
                    "ufield": curObject.__uInfo.fields[parts[parts.length - 1]],
                    "type": curObject.__interface.fields[parts[parts.length - 1]].type
                });
            }
            catch(e){
                console.log();
            }
        }
        if (parts.length == 1) {
            let type = curObject.__interface.fields[parts[parts.length - 1]].type;
            if (!type instanceof Array) {
                let object = curObject.__interface.fields[parts[parts.length - 1]][type];
                let pk = this.__getPK(this.__objects[object].__interface);
                res[parts[0]] = {
                    link: {},
                    fields: []
                };
                res[parts[0]].obj = object;
                res[parts[0]].uObj = this.__objects[object].__uInfo.object;
                res[parts[0]].primary = {
                    "pk": pk,
                    "upk": this.__objects[object].__uInfo.fields[pk],
                    "type": this.__objects[object].__interface.fields[this.__getPK(this.__objects[object].__interface)].type
                };
            }

        }

        return res;
    }

    __getObjInfo(prepRes) {
        let objInfo = {};
        prepRes.forEach(field => field.forEach(fieldPart => {
            for (let chain in fieldPart) {
                if (!objInfo[chain]) {
                    objInfo[chain] = fieldPart[chain];
                }
                else {
                    _.assign(objInfo[chain].link, fieldPart[chain].link);
                    objInfo[chain].fields = objInfo[chain].fields.concat(fieldPart[chain].fields);
                }
            }
        }));
        for (let part in objInfo) {
            let link = {};
            if (objInfo[part].link) {
                if (objInfo[part].link instanceof Array) {
                    objInfo[part].link.forEach(l => {
                        if (!link[l.fk])
                            link[l.fk] = l;
                    });
                }
                else if (objInfo[part].link instanceof Object) {
                    link = objInfo[part].link;
                }
            }
            objInfo[part].link = link;


            let fields = {};
            if (objInfo[part].fields && objInfo[part].fields instanceof Array) {
                objInfo[part].fields.forEach(l => {
                    if (!fields[l.field])
                        fields[l.field] = l;
                });
            }
            objInfo[part].fields = fields;
        }
        return objInfo;
    }

    async __filterPrepare(obj, filter) {
        if (filter) {
            let fields = [];
            for (let comp in filter.comparisons) {
                if (filter.comparisons[comp].left.type === "field") {

                    /**
                     * let flag = true;
                     * while(flag){
                     *
                     * }
                     * */
                    // queryID.organization
                    // organization
                    fields.push(filter.comparisons[comp].left.value);

                    if (filter.comparisons[comp].sign === "rin"
                        && filter.comparisons[comp].left.value !== "parentID") {
                        console.log("");
                        fields.push(`${filter.comparisons[comp].left.value}.ID`);
                    }

                }
                if (filter.comparisons[comp].right.type === "field") {
                    fields.push(filter.comparisons[comp].right.value);
                    if (filter.comparisons[comp].sign === "rin"
                        && filter.comparisons[comp].right.value !== "parentID") {
                        console.log("");
                        fields.push(`${this.__objects[obj].__interface.fields[filter.comparisons[comp].right.value].link}.parentID`);
                    }

                }
            }
            return await Promise.all(fields.map(f => this.__getObject(obj, f)))
        }
        else
            return [];
    }

    __fieldsPrepare(obj, fields) {
        return fields ? Promise.all(fields.map(f => this.__getObject(obj, f))) : Promise.resolve([]);
    }

    async __parametersPrepare(obj, parameters) {
        let result = [];

        if (parameters.orderBy) {
            result.orderBy = [];
            for (let f of parameters.orderBy) {
                result.orderBy.push(await this.__getObject(obj, f.field));
            }
        }

        if (parameters.unique) {
            result.unique = [];
            for (let f of parameters.unique) {
                result.unique.push(await this.__getObject(obj, f));
            }
        }

        /*
        for(let parName of ["orderBy", "unique"]){
            if(parameters[parName]){
               for(let field of parameters[parName]){
                   if(field.match(/\./)) {
                       result.push(await this.__getObject(obj, field));
                   }
               }
            }
        }
        */
        return result;
    }

    /**
     *
     * @param {string} oName - имя объекта, для которого нужно получить записи
     * @param {Object} result - результат выборки из адаптера
     * @param {Object} filter = {
     *      @name: имя поля, по которому фильтр (первичный ключ или внешний),
     *      @value: значение поля @name
     * }
     * */
    // __objectResult(oName, result, filter) {
    //     if (!this.__objects[oName]) {
    //         logger.write(`warning`, `Нет описания для объекта ${oName}.`);
    //         return {};
    //     }
    //
    //     if (!result[oName]) {
    //         logger.write(`warning`, `Нет данных об объекте ${oName}.`);
    //         return {};
    //     }
    //
    //     let fields = this.__objects[oName].__interface.fields;
    //     let refs = this.__objects[oName].__interface.refs;
    //     let finish = {};
    //
    //     let self = this;
    //     // для всех записей из интересующего объекта
    //     for (let id in result[oName]) {
    //         let res = {
    //             fields: {}
    //         };
    //         // если запись соответствует фильтру
    //         if ((!filter || (result[oName][id][filter.name] === filter.value))&& (!!result[oName][id][this.__getPK(this.__objects[oName].__interface)])) {
    //             // проверяем все поля объекта
    //             for (let f in fields) {
    //                 // на наличие их в результате выборки
    //                 if (/*result[oName][i][f] || result[oName][i][f] === null*/result[oName][id].hasOwnProperty(f)) {
    //                     // если поле не является ссылкой на другой объект
    //                     if (fields[f].type === "ref") {
    //                         let fo = fields[f][fields[f].type];
    //                         if (result[fo]) {
    //                             /*
    //                             let pk = this.__getPK(this.__objects[fields[f][fields[f].type]].__interface);
    //
    //                             let rec = {};
    //                             for (let r of result[fo]) {
    //                                 try {
    //                                     if (r[pk] === result[oName][i][f]) {
    //                                         _.extend(rec, r);
    //                                     }
    //                                 }
    //                                 catch (e) {
    //                                     1 + 1
    //                                 }
    //                             }*/
    //                             res.fields[f] = /*result[fo][result[oName][id][f]] || */result[oName][id][f];
    //                         }
    //                         else {
    //                             res.fields[f] = result[oName][id][f];
    //                         }
    //                     }
    //                     else if (fields[f].type === "link") {
    //                         /*
    //                         let t = this.__objectResult(fields[f][fields[f].type], result, {
    //                             name: this.__getPK(this.__objects[fields[f][fields[f].type]].__interface),
    //                             value: result[oName][i][f]
    //                         });
    //                         res.fields[f] = Object.keys(t).length > 0 ? t : result[oName][i][f];
    //                         */
    //                         let fo = fields[f][fields[f].type];
    //                         res.fields[f] = result[fo] && result[fo][result[oName][id][f]] || result[oName][id][f];
    //                     }
    //                     else {
    //                         res.fields[f] = result[oName][id][f];
    //                     }
    //                 }
    //             }
    //
    //             for (let r in refs) {
    //                 //for(let r in refs){
    //                 if (!res.refs)
    //                     res.refs = {};
    //
    //                 res.refs[r] = this.__objectResult(r, result, {
    //                     name: this.__getRefKey(this.__objects[r].__interface).rLink,
    //                     value: result[oName][id][this.__getPK(this.__objects[oName].__interface)]
    //                 });
    //             }
    //             ;
    //             finish[result[oName][id][this.__getPK(this.__objects[oName].__interface)]] = res;
    //             let a = 1;
    //         }
    //     }
    //     return finish;
    // }

    __objectResult(object, recInfo) {
        if (!this.__objects[object]) {
            logger.write(`warning`, `Нет описания для объекта ${object}.`);
            return {};
        }

        if (!recInfo.records[object]) {
            logger.write(`warning`, `Нет данных об объекте ${object}.`);
            return {};
        }


        let result = {};

        for (let id in recInfo.records[object]) {
            result[id] = this.__getRecord(object, recInfo, id);
        }
        return result;
    }

    __getRecord(object, recInfo, ID, prevObject = object, prevID = ID) {

        if (!recInfo.records[object] || !recInfo.records[object][ID]) {
            return ID;
        }

        let fields = this.__objects[object].__interface.fields;
        let refs = this.__objects[object].__interface.refs;
        let PK = this.__getPK(this.__objects[object].__interface);

        let record = {
            fields: {},
            refs: {}
        };

        for (let field in recInfo.records[object][ID]) {
            if (!fields[field]) {
                continue;
            }

            if (recInfo.records[object][ID][field] === null) {
                record.fields[field] = null;
                continue;
            }

            if (fields[field].type === "link") {
                let newRec = this.__getRecord(fields[field].link, recInfo, recInfo.records[object][ID][field]);
                if (typeof newRec === "object") {
                    record.fields[field] = {
                        [recInfo.records[object][ID][field]]: this.__getRecord(fields[field].link, recInfo, recInfo.records[object][ID][field])
                    };
                }
                else {
                    record.fields[field] = newRec;
                }
                /*
                * нормальная структура
                record.fields[field] = this.__getRecord(fields[field].link, recInfo, recInfo.records[object][ID][field]);
                * */
                continue;
            }

            if (fields[field].type === "ref") {
                if (prevObject !== fields[field].ref) {
                    let value = this.__getRecord(fields[field].ref, recInfo, recInfo.records[object][ID][field], object, ID);
                    record.fields[field] = typeof value === "object" ? value.fields : value;
                }
                else {
                    // костыль для Димы
                    record.fields[field] = recInfo.records[object][ID][field];
                    /*
                    if(recInfo.records[object][ID][field]&&
                        (!recInfo.records[object][ID][field].refs || Object.keys(recInfo.records[object][ID][field].refs).length === 0) &&
                        (Object.keys(recInfo.records[object][ID]).length === 1) &&
                        (recInfo.records[object][ID][PK]) ){
                        record.fields[field] = ID;
                    }
                    else {
                        record.fields[field] = {
                            [this.__getPK(this.__objects[fields[field].ref].__interface)]: recInfo.records[object][ID][field]
                        };
                    }
                    */
                }
                /*
                нормальная структура
                if (prevObject !== fields[field].ref) {
                    record.fields[field] = {
                        [recInfo.records[object][ID][field]]: this.__getRecord(fields[field].ref, recInfo, recInfo.records[object][ID][field], object, ID)
                    };
                }
                else {
                    record.fields[field] = recInfo.records[object][ID][field];
                }
                */
                continue;
            }

            record.fields[field] = recInfo.records[object][ID][field];
        }

        if (recInfo.refs[object] && recInfo.refs[object][ID]) {
            //for(let ref of refs){
            record.refs = recInfo.refs[object][ID];
            for (let r in record.refs) {
                for (let rID in record.refs[r]) {
                    // if (r !== prevObject && rID !== prevID) {
                    record.refs[r][rID] = this.__getRecord(r, recInfo, rID, object, ID);

                    //}
                    //else{
                    //   record.refs[r][rID] = ID;
                    // }
                }
            }

            for (let ref in refs) {
                if (!record.refs[ref]) {
                    record.refs[ref] = {};
                }
            }
            //}
        }


        return record;
    }

    __getFieldType(field) {
        return ["string", "object"];
    }

    async __checkFKvalues(obj, values) {
        let self = this;
        let fields = this.__objects[obj].__interface.fields;
        //let comp = {};
        await Promise.all( Object.keys(fields).map( async(f) => {

            //for(let f in fields){
        if (fields[f].type && typeof fields[f].type === "string" && ["ref", "link"].indexOf(fields[f].type) >= 0) {
            let fObj = fields[f][fields[f].type];
            let fPK = self.__getPK(self.__objects[fObj].__interface);
            let comp = [];
            values.forEach(record => {
                if (record[f] && comp.indexOf(record[f]) < 0)
                    comp.push(record[f]);
            });
            if (comp.length > 0) {
                let filter = {
                    comparisons: {
                        PKFind: {
                            left: {
                                type: "field",
                                value: fPK
                            },
                            sign: "in",
                            right: {
                                type: "value",
                                value: comp
                            }
                        }
                    },
                    tree: {
                        and: ["PKFind"]
                    }
                };
                //let obj_info = self.__objectsPrepare(fObj, );
                let fSelect = await self.__objects[fObj].get([], filter, [], {});
                fSelect.records[fObj].forEach(
                    r => {
                        let i = comp.indexOf(r[fPK]);
                        if (i >= 0)
                            comp.splice(i, 1);
                    }
                );
                if (comp.length > 0) {
                    logger.write(`debug`, `Указано несуществующее значение для ссылки на объект '${self.__objects[fObj].__interface.description}'`, new Error());
                    throw `Указано несуществующее значение для ссылки на объект '${self.__objects[fObj].__interface.description}'`;
                }
            }
        }
        //}
    }));
    }

    async __valuesPrepare(obj, values = []) {
        let self = this;
        let r = await Promise.all(values.map(async (record) => {
            let res = true;
            for (let f in record) {
                if (!self.__objects[obj].__interface.fields[f]) {
                    logger.write(`warning`, `Объект '${obj} не имеет поле ${f}.'`, new Error());
                    delete record[f];
                    //throw new Error(`Объект '${obj} не имеет поле ${f}.'`);
                }
                else {
                    let ch;
                    if (self.__objects[obj].__interface.fields[f].type instanceof Array) {
                        ch = await typeController.checkValue(self.__objects[obj].__interface.fields[f].type[0], record[f]);
                    }
                    else {
                        let type = self.__objects[obj].__interface.fields[f].type;
                        let fObj = self.__objects[obj].__interface.fields[f][type];
                        let fPK = self.__getPK(self.__objects[fObj].__interface);
                        let fType = self.__objects[fObj].__interface.fields[fPK].type;
                        ch = await typeController.checkValue(fType[0], record[f]);
                    }

                    if (!ch)
                        logger.write(`warning`, `Значение поля '${f}' объекта '${obj}' не может принимать значение '${record[f]}'.`, new Error());
                    res = res && ch;
                }
            }
            return res;
        }));
        let resVals = [], errors = [];
        values.forEach((record, i) => {
            if (r[i])
                resVals.push(record);
            else
                errors.push(record);
        });
        if (errors.length > 0) {
            logger.write(`warning`, `В переданном массиве значений имеются некорректные записи.\n Records: ` + JSON.stringify(errors), new Error());
            return Promise.reject(`В переданном массиве значений имеются некорректные записи.`);
        }
        await self.__checkFKvalues(obj, resVals);
        return resVals;
    }


    /**Принимает на вход имя объекта и фильтр.
     * Возвращает хэш с именами таблиц и записями из них*/
    async __getLinkRecords(obj, fields, filter, parameters, objInfo /*filter, fields = {fields: {}}, parameters = {}*/) {

        // ToDo: в будущем нужно предусмотреть возможность присутствия нескольких ссылок из одного объекта
        // Получаем из интерфейса объекта имена всех таблиц и табличных частей, ссылающиеся на него
        let links = this.__objects[obj].__interface.links;
        let refs = this.__objects[obj].__interface.refs;
        // получаем имя поля, являющегося первичным ключом
        let PK = this.__getPK(this.__objects[obj].__interface);

        // получение данных из объекта
        let getRes = await this.__objects[obj].get(fields, filter, parameters, objInfo);
        let mainLinks = {
            [obj]: getRes.records[obj]
        };
        let existRecords = {
            [obj]: getRes.records[obj]
        };
        let self = this;
        let pkValues = [];
        let result = {
            [obj]: {
                records: {
                    [obj]: []
                },
                this: getRes
            }
        };
        for (let table in mainLinks) {
            if (table !== obj) {
                result[table] = mainLinks[table];
            }
            for (let rec of mainLinks[table]) {
                let pkForLink = this.__getPK(this.__objects[table].__interface);
                if (rec[pkForLink]) {
                    pkValues.push(rec[pkForLink]);
                }
            }
        }

        if (pkValues.length > 0) {
            //for (let link in links) {
            await Promise.all( Object.keys(links).map( async (link) => {
                let comp = {
                    comparisons: {
                        c: {
                            left: {
                                type: "field",
                                value: links[link]
                            },
                            right: {
                                type: "value",
                                value: pkValues
                            },
                            sign: "in"
                        }
                    },
                    tree: {
                        and: ["c"]
                    }
                };
                if (link !== obj) {
                    result[link] = await self.__objects[link].get([], comp, {});
                }
                else {
                    result[link].records[link] = (await self.__objects[link].get([], comp, {})).records;
                }
            }).concat(Object.keys(refs).map( async (ref) => {
            /*
            }));

            //for (let ref in refs) {
            await Promise.all( Object.keys(refs).map( async (ref) => {
            */
                let comp = {
                    comparisons: {
                        c: {
                            left: {
                                type: "field",
                                value: self.__getRefKey(refs[ref].__interface).rLink
                            },
                            right: {
                                type: "value",
                                value: pkValues
                            },
                            sign: "in"
                        }
                    },
                    tree: {
                        and: ["c"]
                    }
                };
                let refRes = await self.__getLinkRecords(ref, [], comp);
                for (let t in refRes)
                    if (result[t]) {
                        try {
                            if(result[t].records[t].filter(rec => !!rec[self.__objects[t].__getPK()]).length === 0) {
                                result[t].records[t].push(refRes[t]);
                            }
                        }
                        catch (e) {
                            console.log(e);
                        }
                    } else {
                        result[t] = refRes[t];
                    }
            })));
        }
        return result;
    }

    __formHashFromArrays(records) {
        let recs = {}, refs = {};
        let self = this;
        let selfRecords = records;
        //todo: непонятно почему obj равен "refs", хотя по сути там должны быть только названия объектов
        for (let obj in selfRecords) {
            if (obj === "refs") {
                continue;
            }
            let fields = self.__objects[obj].__interface.fields;
            let refField;
            for (let field in fields) {
                if (fields[field].type === "ref") {
                    refField = field;
                    if (!refs[fields[field].ref]) {
                        refs[fields[field].ref] = {};
                    }
                }
            }

            recs[obj] = {};
            let PK = self.__getPK(self.__objects[obj].__interface);
            records[obj].forEach(rec => {
                recs[obj][rec[PK]] = rec;
                if (refField) {
                    if (!refs[fields[refField].ref][rec[refField]]) {
                        refs[fields[refField].ref][rec[refField]] = {};
                    }
                    if (!refs[fields[refField].ref][rec[refField]][obj]) {
                        refs[fields[refField].ref][rec[refField]][obj] = {};
                    }
                    refs[fields[refField].ref][rec[refField]][obj][rec[PK]] = rec;
                }
            });

        }
        return {
            records: recs,
            refs: refs
        };
    }

    __resultForm(object, res) {
        let records = !!res && res.records ? this.__objectResult(object, this.__formHashFromArrays(res.records)) : [];
        let description = {};
        _.extend(description, this.__objects[object].__interface);
        //delete description.methods;
        let fields = {};
        description.refs = Object.keys(description.refs);
        // вылетало здесь
        if (res && res.fields && res.fields instanceof Array) {
            res.fields.forEach(f => {
                fields[f] = this.__getFieldType(f);
            })
        }

        let tableDesc = {
            object: description,
            fields: fields
        };

        return {
            records: records,
            tableDesc: tableDesc
        };
    }

    async __fieldsModification(object, method, parameters) {
        if (this.__objects[object].__interface.methods[method].permanentParameters && this.__objects[object].__interface.methods[method].permanentParameters.fields) {
            if (!parameters.fields) {
                parameters.fields = [];
            }
            for (let field of this.__objects[object].__interface.methods[method].permanentParameters.fields) {
                if (parameters.fields.indexOf(field) < 0) {
                    parameters.fields.push(field);
                }
            }
        }
        if (this.__objects[object].__interface.methods[method].permanentParameters &&
            this.__objects[object].__interface.methods[method].permanentParameters.parameters &&
            this.__objects[object].__interface.methods[method].permanentParameters.parameters.allFields
            || parameters.parameters && parameters.parameters.allFields) {
            parameters.fields = (parameters.fields || []).concat(await this.__objects[object].getAllFields());
        }
    }

    async query(object, method, parameters = {filter: {}}) {

        let self = this;
        if (!this.__interface.objects[object] && !this.__objectViews[object]) {
            let splitObject = object.split(".");
            if (splitObject.length < 2) {
                throw(`Обращение к несуществующему объекту '${object}'`);
            }
            //console.log();
            logger.write(`debug`, `objectView.query: выполнение запроса к подобъекту.`);
            let result = await this.__objectViews[splitObject[0]].query(
                splitObject.slice(1, splitObject.length).join("."),
                method,
                parameters);
            logger.write(`debug`, `objectView.query: запрос выполнен.`);

            result.name = splitObject[0] + "." + result.tableDesc.object.name;
            return result;
        }

        if (this.__objectViews[object]) {
            if (!this.__objectViews[object][method]) {
                throw(`Обращение к несуществующему методу '${method}' объекта '${object}'`);
            }

            logger.write(`debug`, `objectView.query: выполнение запроса к объекту.`);
            let toReturn = this.__objectViews[object][method](...parameters);
            logger.write(`debug`, `objectView.query: запрос выполнен.`);
            return toReturn;
        }
        let serPars = {
            objInfo: -1
        };

        if (!this.__objects[object]) {
            logger.write(`warning`, `Запрос к несуществующему объекту '${object}'`, new Error());
            return Promise.reject(`Запрос к несуществующему объекту '${object}'`);
        }

        if (!this.__objects[object][method]) {
            logger.write(`warning`, `Обращение к несущетсвующему методу '${method}' объекта '${object}'.`, new Error());
            return Promise.reject(`Обращение к несущетсвующему методу '${method}' объекта '${object}'.`);
        }

        /*
        if(parameters.parameters && parameters.parameters.allFields){
            parameters.fields = (parameters.fields || []).concat(await this.__objects[object].getAllFields());
        }
        */

        let aParameters = [];
        let notObjectPrepareParams = ['values'];
        let nop = []; //['values'];
        let processed = [];
        let parNames = [];

        logger.write(`debug`, `objectView.query: подготовка параметров к обработке.`);
        if (this.__objects[object].__interface.methods[method].parameters) {
            for (let i = 0; i < this.__objects[object].__interface.methods[method].parameters.length; ++i) {
                let p = this.__objects[object].__interface.methods[method].parameters[i];
                parNames.push(p.name);
                if (serPars[p.name] !== -1) {
                    if (self[`__${p.name}Modification`]) {
                        await self[`__${p.name}Modification`](object, method, parameters);
                    }
                    aParameters[i] = parameters[p.name] ? parameters[p.name] : p.name === "filter" ? {} : [];
                    if (parameters[p.name] && notObjectPrepareParams.indexOf(p.name) < 0) {
                        if (self[`__${p.name}Prepare`] && typeof self[`__${p.name}Prepare`] === 'function') {
                            processed[i] = self[`__${p.name}Prepare`](object, parameters[p.name]);
                        }
                        else {
                            processed[i] = Promise.resolve(parameters[p.name]);
                        }
                    }
                    else {
                        processed[i] = Promise.resolve([]);
                        if (notObjectPrepareParams.indexOf(p.name) >= 0) {
                            nop.push(p.name);
                        }
                    }
                }
                else {
                    serPars[p.name] = i;
                }
            }
        }
        logger.write(`debug`, `objectView.query: параметры приготовлены к дальнейшей обработке.`);

        logger.write(`debug`, `objectView.query: обработка параметров.`);
        for (let par in nop) {
            let name = nop[par];
            if (this[`__${name}Prepare`] && typeof this[`__${name}Prepare`] === 'function') {
                await this[`__${name}Prepare`](object, parameters[name]);
            }
        }
        let fr = await Promise.all(processed);
        logger.write(`debug`, `objectView.query: параметры обработаны.`);

        let links = [];
        for (let f in this.__objects[object].__interface.fields) {
            if (["ref", "link"].indexOf(this.__objects[object].__interface.fields[f].type) >= 0) {
                links.push(f);
            }
        }


        logger.write(`debug`, `objectView.query: заполнение objInfo.`);
        aParameters[serPars["objInfo"]] = {
            fields: this.__getObjInfo(
                fr.filter(x => x !== undefined && x instanceof Array)
            ),
            records: {}
        };
        logger.write(`debug`, `objectView.query: objInfo подготовлено.`);

        logger.write(`debug`, `objectView.query: обработка ссылочных полей.`);
        let oLinks = await Promise.all(links.map(l => self.__getObject(object, l)));
        let qwe = this.__getObjInfo([oLinks]);
        for (let f in qwe) {
            if (!aParameters[serPars["objInfo"]]) {
                aParameters[serPars["objInfo"]] = {
                    fields: {},
                    records: {}
                };
            }

            if (!aParameters[serPars["objInfo"]].fields[f]) {
                aParameters[serPars["objInfo"]].fields[f] = qwe[f];
            }
        }
        logger.write(`debug`, `objectView.query: работа со ссылками окончена.`);

        logger.write(`debug`, `objectView.query: дополнительная обработка фильтра.`);
        if (parNames.indexOf("filter") >= 0) {
            parameters.filter = parameters.filter || {comparisons:{}, tree: {}}
            logger.write(`debug`, `objectView.query: выполнение __filterPrepare.`);
            let fp = _.assign(...(await self.__filterPrepare(object, parameters.filter)));
            logger.write(`debug`, `objectView.query: __filterPrepare выполнено.`);

            for (let o in fp) {
                let nFields = {};
                fp[o].fields.forEach(f => {
                    nFields[f.field] = f;
                });
                fp[o].fields = nFields;
            }

            /*let getLinkRecords = await self.__getLinkRecords(object, parameters.filter, {fields: fp},
                parNames.indexOf('parameters') >=0 ? aParameters[parNames.indexOf('parameters')] : {});*/
            // fields, filter, parameters, objInfo
            let fieldsNumber = parNames.indexOf('fields');
            let filterNumber = parNames.indexOf('filter');
            let parametersNumber = parNames.indexOf('parameters');
            let objInfoNumber = parNames.indexOf('objInfo');

            logger.write(`debug`, `objectView.query: получение информации о внешних объектах.`);
            let linkRecords = await self.__getLinkRecords(
                object,
                fieldsNumber >= 0 ? aParameters[fieldsNumber] : [],
                filterNumber >= 0 ? aParameters[filterNumber] : {},
                parametersNumber >= 0 ? aParameters[parametersNumber] : {},
                objInfoNumber >= 0 ? aParameters[objInfoNumber] : {}
            );
            logger.write(`debug`, `objectView.query: информация о внещних объектах получена.`);

            if (method === "get") {
                logger.write(`debug`, `objectView.query: формирование результата.`);
                let toReturn = this.__resultForm(object, linkRecords[object].this);
                logger.write(`debug`, `objectView.query: результат сформирован.`);
                return toReturn;
            }

            aParameters[serPars["objInfo"]].records = linkRecords;
        }

        // let fs = await this.__objects[object].getAllFields();

        logger.write(`debug`, `objectView.query: выполнение вызываемого метода объекта.`);
        let res = await this.__objects[object][method](...aParameters);
        logger.write(`debug`, `objectView.query: метод выполнен.`);


        logger.write(`debug`, `objectView.query: формирование результата.`);
        let toReturn = this.__resultForm(object, res);
        logger.write(`debug`, `objectView.query: результат сформирован.`);

        return toReturn;

    }

    async info() {
        let self = this;
        //let ints = await Promise.all( Object.keys(self.__objects).map(o => self.__objects[o].getInterface()) );
        let res = {};
        let oInts = {};
        (await Promise.all(Object.keys(self.__objects).map(o => self.__objects[o].getInterface())))
            .forEach(i => {
                oInts[i.name] = i;
            });
        for (let el in this.__interface)
            res[el] = this.__interface[el];

        res.objects = oInts;
        return res;
    }
}