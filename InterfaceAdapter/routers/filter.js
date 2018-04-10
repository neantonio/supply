/**
 * Класс формирующий фильтр для запроса к серверу
 */
class Filter {
    constructor() {
        this.comparisons = {}; // блоки сравнения
        this.tree = {}; // отношения блоков (and или or)
        this.pagination = {};
        this.orderBy = [];
    }

    /**
     * Функция заполняет свойства comparisons и tree и возвращаем структуру понятную серверу
     * @param filterParams
     * @returns {{filter: {comparisons: ({}|*|null), tree: ({}|*)}}}
     */
    prepareParams(filterParams, relation, pagination = {}, orderBy = []) {

        this._substituteBetweenSign(filterParams, relation);

        for (let filterItem in filterParams) {
            this._addComparisonItem(filterItem, filterParams[filterItem].value, filterParams[filterItem].sign);
        }

        this._feelTree(filterParams, relation);

        this._feelPagination(pagination);

        this._feelOrderBy(orderBy);

        return {
            filter: {
                comparisons: this.comparisons,
                tree: this.tree
            },
            parameters : {
                pagination : this.pagination,
                orderBy : this.orderBy
            }
        }

    }

    /**
     * Заменяет элемент фильтра с sign === 'between' на 2 отдельных элемента c sign === "greatereq" и sign === "lesseq"
     * @private
     */
    _substituteBetweenSign(filterParams, relation) {
        for (let filterItem in filterParams) {
            if (filterParams[filterItem].sign === 'between') {

                // если в качестве value передали не массив, тогда непонятно что делать с таким условием, просто выбросим его
                if (!Array.isArray(filterParams[filterItem].value)) {
                    this._deleteFilterElem(filterParams, relation, filterItem);
                    continue;
                }

                let beginDate = filterParams[filterItem].value[0];
                let endDate = filterParams[filterItem].value[1];

                let elemGreaterName = filterItem + '-greater';
                let elemLessName = filterItem + '-less';

                filterParams[elemGreaterName] = {
                    value: beginDate,
                    sign: 'greaterEqual'
                };
                filterParams[elemLessName] = {
                    value: endDate,
                    sign: 'lessEqual'
                };

                this._deleteFilterElem(filterParams, relation, filterItem);
                // в relation тоже необходимо сделать 2 отдельных элемента в блоке and

                if (!relation.and || !Array.isArray(relation.and)) {
                    relation.and = [];
                }

                relation.and.push(elemGreaterName);
                relation.and.push(elemLessName);

            }
        }
    }

    /**
     * Удаляем условие отбора из filterParams и relation
     */
    _deleteFilterElem(filterParams, relation, filterItem) {
        delete filterParams[filterItem];

        if (relation.and && Array.isArray(relation.and) && relation.and.length > 0) {
            relation.and = relation.and.filter((elem) => {
                return elem !== filterItem;
            });
        }

        if (relation.or && Array.isArray(relation.or) && relation.or.length > 0) {
            relation.or = relation.or.filter((elem) => {
                return elem !== filterItem;
            });
        }

    }

    /**
     *  Функция создает новый блок для фильтра
     * @param name
     * @param value
     * @param sign
     * @private
     */
    _addComparisonItem(name, value, sign) {
        this.comparisons[name] = {
            left: {},
            right: {},
            sign: ''
        };

        this._addComparisonLeft(name, this.comparisons[name]);
        this._addComparisonRight(value, this.comparisons[name]);
        this._addComparisonSign(sign, this.comparisons[name]);

    }

    /**
     * Функция заполняет секцию left блока фильтра
     * @param value
     * @param comparisonItem
     * @private
     */
    _addComparisonLeft(value, comparisonItem) {
        comparisonItem.left.type = "field";
        // TODO FIX THIS!!!
        let fixedValue = value;
        fixedValue = fixedValue.replace("-greater","");
        fixedValue = fixedValue.replace("-less","");
        comparisonItem.left.value = fixedValue;
    }

    /**
     * Функция заполняет секцию right блока фильтра
     * @param value
     * @param comparisonItem
     * @private
     */
    _addComparisonRight(value, comparisonItem) {
        comparisonItem.right.type = "value";
        comparisonItem.right.value = value;
    }

    /**
     * Функция заполняет секцию sign блока фильтра
     * @param {string} value - тип сравнения (по умолчанию 'equal')
     * @param comparisonItem
     * @private
     */
    _addComparisonSign(value = 'equal', comparisonItem) {
        comparisonItem.sign = value;
    }

    /**
     * Функция заполняет свойство tree фильтра
     *
     * @param {object} filterParams
     * @param {object} relation
     * @private
     */
    _feelTree(filterParams, relation = {}) {

        let andRelation, orRelation;

        if (relation.and && Array.isArray(relation.and) && relation.and.length > 0) {
            andRelation = relation.and;
        }

        if (relation.or && Array.isArray(relation.or) && relation.or.length > 0) {
            orRelation = relation.or;
        }

        // если есть некая комбинация and и or - сформируем древовидную структуру с and в корне
        if (andRelation && orRelation) {
            // корень
            this.tree.and = [];
            // группа полей связанных отношением or
            this.tree.and.push({
                or: orRelation
            });
            // остальные поля связанные отношением and
            andRelation.forEach((item) => {
                this.tree.and.push(item);
            });
            // если определено только or или and - формируем соответствующее свойство и все
        } else if (andRelation) {
            this.tree.and = andRelation;
        } else if (orRelation) {
            this.tree.or = orRelation;
            //  если ничего не определено - значит мы ничего не получили и все добавим в add
        } else {
            this.tree.and = [];
            for (let filterItem in filterParams) {
                this.tree.and.push(filterItem);
            }
        }

    }

    /**
     * Функция заполняет свойство pagination фильтра
     * @param pagination
     * @private
     */
    _feelPagination(pagination){

        if (pagination instanceof Object) {

            if (pagination.offset !== undefined) {
                this.pagination.offset = pagination.offset;
            }

            if (pagination.limit !== undefined) {
                this.pagination.limit = pagination.limit;
            }

        }

    }

    /**
     * Функция заполняет свойство orderBy фильтра
     * @param orderBy
     * @private
     */
    _feelOrderBy(orderBy){

        if (orderBy instanceof Array) {
            this.orderBy = orderBy;
        }

    }
}


module.exports = Filter;