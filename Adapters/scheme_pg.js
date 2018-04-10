import {adapter} from './reference_pg';
import {logger} from '../Logger/controller';

class scheme_pg extends adapter {
    constructor(...args) {
        super(...args);
    }

    init() {
        if(!this.__interface.uniqueFields){
            logger.write(`error`, `У схемы '${this.__interface.name}' не указан список уникальных полей.`, new Error());
            throw `У схемы не указан список уникальных полей`;
        }
        super.init();
        this.uniqueFields = this.__interface.uniqueFields ;
        this.possibleStrategies = this.__getMoveStrategies();
       // let a = 1;
    }

    /**
     * метод update у схемы добавляет запись в служебную таблицу
     * в filter приходят значения уникальных для схемы полей, указанных в спец.структуре unique для связки этапа и полей схемы
     * переданная ДНФ разбирается на конъюнкты и кадый конъюнкт соединяется с записью, переданной в параметре values + добавляется дата.
     *
     * сформированный таким образом список, передается операции insert прототипа, и в служебную таблицу добавляются соответтствующие записи
     * */
    async update(filter, values, parameters, objInfo) {
        if (!filter.tree.or) {
            logger.write("debug", `Ошибка: неверный формат фильтра для метода обновления объекта "Схема"`, new Error());
            throw `Ошибка: неверный формат фильтра для метода обновления объекта "Схема"`;
        }

        let cDate = new Date();
        let dateString = `${cDate.getFullYear()}-${cDate.getMonth() + 1}-${cDate.getDate()} ${cDate.getHours()}:${cDate.getMinutes()}:${cDate.getSeconds()}`;

        let treeArray = filter.tree.or;
        let newValues = [];
        for (let comp of filter.tree.or) {
            if ((!comp instanceof Object) || !comp.and) {
                logger.write("debug", `Ошибка: неверный формат фильтра для метода обновления объекта "Схема". Нельзя указывать в качестве элемента дизъюнкции не объект конъюнкции.`, new Error());
                throw `Ошибка: неверный формат фильтра для метода обновления объекта "Схема". Нельзя указывать в качестве элемента дизъюнкции не объект конъюнкции`;
            }
            let value = {};
            for (let cName of comp.and) {
                if (!cName instanceof String) {
                    logger.write("debug", `Ошибка: неверный формат фильтра для метода обновления объекта "Схема". Нельзя указывать в качестве элемента конъюнкции нестроковое значение.`, new Error());
                    throw `Ошибка: неверный формат фильтра для метода обновления объекта "Схема". Нельзя указывать в качестве элемента конъюнкции нестроковое значение.`;
                }

                if (!filter.comparisons[cName]) {
                    logger.write("debug", `Ошибка: неверный формат фильтра для метода обновления объекта "Схема". Имя сравнения '${cName}' не соответствуют дереву разбора.`, new Error());
                    throw `Ошибка: неверный формат фильтра для метода обновления объекта "Схема". Имя сравнения '${cName}' не соответствуют дереву разбора.`;
                }

                let fieldName, fieldValue;

                if (filter.comparisons[cName].left.type == "field" && filter.comparisons[cName].right.type == "value") {
                    fieldName = filter.comparisons[cName].left.value;
                    fieldValue = filter.comparisons[cName].right.value;
                }
                else if (filter.comparisons[cName].right.type == "field" && filter.comparisons[cName].left.type == "value") {
                    fieldName = filter.comparisons[cName].right.value;
                    fieldValue = filter.comparisons[cName].left.value;
                }
                else {
                    logger.write("debug", `Ошибка: неверный формат фильтра для метода обновления объекта "Схема". В объекте сравнения '${cName}' необходимо описание сравнения поля и значения.`, new Error());
                    throw `Ошибка: неверный формат фильтра для метода обновления объекта "Схема".  В объекте сравнения '${cName}' необходимо описание сравнения поля и значения.`;
                }

                if(filter.comparisons[cName].sign !== "equal"){
                    logger.write("debug", `Ошибка: неверный формат фильтра для метода обновления объекта "Схема". Сравнение поддерживает только операцию эквивалентности. Сравнение '${cName}'.`, new Error());
                    throw `Ошибка: неверный формат фильтра для метода обновления объекта "Схема". Сравнение поддерживает только операцию эквивалентности. Сравнение '${cName}'.`;
                }

                if (!this.__interface.fields[fieldName]) {
                    logger.write("debug", `Ошибка: неверный формат фильтра для метода обновления объекта "Схема". У схемы нет поля '${fieldName}'.`, new Error());
                    throw `Ошибка: неверный формат фильтра для метода обновления объекта "Схема". У схемы нет указанного поля '${fieldName}'.`;
                }

                value[fieldName] = fieldValue;
            }
            for(let field in values[0]){
                if (!this.__interface.fields[field]) {
                    logger.write("debug", `Ошибка: неверный формат фильтра для метода обновления объекта "Схема". У схемы нет поля '${field}'.`, new Error());
                    throw `Ошибка: неверный формат фильтра для метода обновления объекта "Схема". У схемы нет указанного поля '${field}'.`;
                }
                value[field] = values[0][field];
            }
            value.date = dateString;
            newValues.push(value);
        }
        //await
        return super.insert(newValues, {});
    }

    __getUniqueFields(int = this.__interface){
        let res = [];
        for(let field in int.fields){
            if(int.fields[field].unique){
                res.push(field);
            }
        }
        return res;
    }

    async backTo(filter, values, objInfo){
        let backStage = values[0].stage;
        /**
         * 0. Достать записи из истории (stages)
         * 1. Сформировать масив с движением всех позиций
         * 2. Восстановить все возможные ациклические варианты движения по схеме (достать из описания схемы).
         * 3. Для каждой позиции:
         *      а) Определить текущий этап.
         *      б) Найти линейную версию истории для позиции.
         *      Проверить:
         *      в) позиция уже была на этапе, на который переводятся позиции (backStage).
         * 4. Все, что удовлетворило (3в) перевести в термины этапа, куда переводим позиции.
         * 5. В качетсве результата вернуть полученные записи
         * */

        // 0
        let historyRecords = (await this.get([], filter, {
            orderBy: [{
                field:"date",
                sort: "ASC"
            }]
        }, objInfo)).records[this.__interface.name];
        // 1
        let moveArray = this.__getMoveHistory(historyRecords);
        // 2
        let strategies = this.possibleStrategies;

        let toBackValues = [];
        // 3
        for(let i = 0; moveArray.idArray.length > i; ++i){
            // 3а
            let currentPathLength = moveArray.historyArray[i].length;
            let currentStage = moveArray.historyArray[i][currentPathLength - 1];
            // 3б
            let cutPath = this.__getCutPathForReal(moveArray.historyArray[i]);
            // 3в
            if(cutPath.length > 0 && backStage !== cutPath[ cutPath.length - 1 ] && cutPath.indexOf(backStage) >= 0){
                toBackValues.push(moveArray.idArray[i]);
            }
        }

        let resultValues = [];
        // 5 (в формате records)
        for(let value of toBackValues){
            let r = {};
            for(let index in this.uniqueFields){
                // 4
                let stageField = this.__interface.stages[backStage].unique[this.uniqueFields[index]];
                r[stageField] = value[index];
            }
            resultValues.push(r);
        }

        return {
            records: {
                [this.__interface.name]: resultValues
            }
        }
    }

    __getMoveStrategiesForStages(schInt = this.__interface, currentStage = Object.keys(this.__interface.input)[0], previousStages = []){
        // получаем все следующие этапы
        let stageRelation = schInt.relations
            .filter(relation => relation.from === currentStage && previousStages.indexOf(relation.to) < 0)
            .map(relation => relation.to);

        if(stageRelation.length !== 0){
            let nextStagesStrategies = this.__getMoveStrategies(schInt, stageRelation, [currentStage].concat(previousStages));
            return nextStagesStrategies.map(strategy => [currentStage].concat(strategy));
        }
        else{
            return currentStage;
        }
    }

    __getMoveStrategies(schInt = this.__interface, fromStages = Object.keys(this.__interface.input), previousStages = []){
        return [].concat(...fromStages.map(st => this.__getMoveStrategiesForStages(schInt, st, previousStages)));
    }

    __historyToLinearStructures(nestedStructure){
        let uniqueIDs = [];
        let history = [];
        for(let id in nestedStructure){
            if(nestedStructure[id] instanceof Array){
                uniqueIDs.push([id]);
                history.push(nestedStructure[id]);
            }
            else{
                let localStructure = this.__historyToLinearStructures(nestedStructure[id]);
                for(let number in localStructure.idArray) {
                    let localIDs = localStructure.idArray[number];
                    let localHistory = localStructure.historyArray[number];
                    let arrayForCurrentID = [id].concat(localIDs);
                    uniqueIDs.push(arrayForCurrentID);
                    history.push(localHistory);
                }
            }
        }
        return {
            idArray: uniqueIDs,
            historyArray: history
        }
    }

    __getMoveHistory(records){
        let history = {};
        for(let record of records){
            let recordStage = record.stage;
            let currentStage = history;
            for(let i = 0; this.uniqueFields.length > i; ++i){
                let uniqueField = this.uniqueFields[i];
                if(!currentStage[record[uniqueField]]) {
                    if (i < this.uniqueFields.length - 1) {
                        currentStage[record[uniqueField]] = {};
                    }
                    else {
                        currentStage[record[uniqueField]] = [];
                    }
                }
                currentStage = currentStage[record[uniqueField]];
            }
            currentStage.push(recordStage);
        }
        return this.__historyToLinearStructures(history);
    }

    __getCutPathForReal(path = []) {
        let cutPath = [];
        for(let i = 0; path.length > i; ++i){
            let indexInCut = cutPath.indexOf(path[i]);
            if(indexInCut >= 0){
                // удаляем из массива все, кроме проверяемого элемента, чтобы потом лишний push не делать
                cutPath.splice(indexInCut + 1, cutPath.length - indexInCut - 1);
            }
            else{
                cutPath.push(path[i]);
            }
        }
        return cutPath;
    }

    async abort(filter, objInfo){
        // если схема не имеет этапа для отказанных позиций выдать ошибку
        if(!this.__interface.abort || !this.__interface.stages[this.__interface.abort]){
            throw `Схема не имеет этапа для отмененных позиций.`;
        }

        // получаем из истории последние записи по фильтру
        let aborted = await (this.get([], filter, {
            orderBy: [{
                field:"date",
                sort: "DESC"
            }],
            unique: this.__interface.uniqueFields
        }, objInfo));
        aborted = aborted.records[this.__interface.name];

        return {
            records: {
                // убираем из выборки все записи, которые попали на один из конечных этапов
                [this.__interface.name]: aborted.filter(rec => !this.__interface.output[rec.stage])
            }
        }
    }
}

export {scheme_pg as adapter};