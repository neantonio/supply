import * as textM from "../../util/TextM";
import {EntityBuilder} from "../../util/EntityBuilder";
import {EntityParserUtil} from "../../util/entityParserUtil";


export class ActionHistory {
    constructor(view, queryDataInformer) {
        this.view = view;
        this.oldValues = null;
        this.queryDataInformer = queryDataInformer;
        this.preSaveHistory();
    }

    preSaveHistory() {
        let actionId = this.queryDataInformer.entityClassMethod.fields.ID;
        let entityClassId = this.queryDataInformer.entityClass.fields.ID;
        let userId = this.queryDataInformer.user.ID;
        let historyList = [];
        let history = EntityBuilder.buildHistory(new Date(), actionId, entityClassId, userId);
        historyList.push(history);
        this.historyList = historyList;
    }


    async writeOldValues(object, method, parameters) {
        this.method = method;
        if (method === textM.dbMethod.get || method === textM.dbMethod.insert) {
            return;
        }
        this.oldValues = EntityParserUtil.parse(await this.view.query(object, textM.dbMethod.get, parameters));
    }


    async commit(newValues) {
        if (this.method === textM.dbMethod.get) {
            return;
        }

        if (this.method === textM.dbMethod.delete) {
            newValues = null;
        }

        let newValuesList = EntityParserUtil.parse(newValues);
        let history = await  this._commitHistory();
        let historyInstances = await this._saveHistoryInstance(history, newValuesList);
        await this._saveHistoryInstanceFields(historyInstances, newValuesList);
    }


    async _commitHistory() {
        let insertedHistory = await this.view.query(textM.role.history, textM.dbMethod.insert, {
                values: this.historyList
            }
        );
        return EntityParserUtil.parse(insertedHistory)[0];
    }


    async _saveHistoryInstance(history, newValues) {
        let historyInstances = this._getHistoryInstances(newValues, history);
        let insertedHistory = await this.view.query(textM.role.history_instances, textM.dbMethod.insert, {
            values: historyInstances
        });
        return EntityParserUtil.parse(insertedHistory);


    }

    _getHistoryInstances(newValues, history) {
        let historyInstances = [];
        if (this.method === textM.dbMethod.insert) {
            historyInstances = newValues.map(v => EntityBuilder.buildHistoryInstance(v, history));

        } else {
            historyInstances = this.oldValues.map(v => EntityBuilder.buildHistoryInstance(v, history));
        }
        return historyInstances;
    }

    async _saveHistoryInstanceFields(historyInstances, newValues) {
        let oldValues = this.oldValues;
        let historyInstanceList = [];
        for (let historyInstance of historyInstances) {
            let historyInstanceFieldsNewValues = this._getHistoryInstanceFields(newValues, historyInstance);
            let historyInstanceFieldsOldValues = this._getHistoryInstanceFields(oldValues, historyInstance);
            this._mergeInstanceFieldsValues(historyInstanceFieldsOldValues, historyInstanceFieldsNewValues, historyInstanceList)
        }


        let insertedHistory = await this.view.query(textM.role.history_instances_fields, textM.dbMethod.insert, {
            values: historyInstanceList
        });

    }

    _getHistoryInstanceFields(values, historyInstance) {
        if (!values) {
            return [];
        }
        let historyInstanceFieldsNewValues = [];
        for (let value of values) {
            if (historyInstance.fields.entityID === value.fields.ID) {
                historyInstanceFieldsNewValues = this._buildHistoryInstanceFieldsValues(historyInstance, value);
            }
        }
        return historyInstanceFieldsNewValues;
    }

    _buildHistoryInstanceFieldsValues(historyInstance, value) {
        let entityClassFields = this.queryDataInformer.entityClassFields;
        let historyInstanceValueList = [];
        for (let entityField of entityClassFields) {
            for (let propertyValue in value.fields)
                if (entityField.fields.description === propertyValue) {
                    let historyInstanceField = EntityBuilder.buildHistoryInstanceField(historyInstance, entityField,
                        value.fields[propertyValue]);
                    historyInstanceValueList.push(historyInstanceField);
                }
        }
        return historyInstanceValueList;
    }

    _mergeInstanceFieldsValues(historyInstanceFieldsOldValues, historyInstanceFieldsNewValues, historyInstanceList) {

        if (historyInstanceFieldsNewValues.length > 0) {
            for (let historyInstanceFieldsNewValue of historyInstanceFieldsNewValues) {
                let historyInstanceFieldsValue = historyInstanceFieldsNewValue;
                historyInstanceFieldsValue.valueNew = historyInstanceFieldsValue.valueOld;
                historyInstanceFieldsValue.valueOld = null;

                for (let historyInstanceFieldsOldValue of historyInstanceFieldsOldValues) {
                    if (historyInstanceFieldsValue.fieldID === historyInstanceFieldsOldValue.fieldID) {
                        historyInstanceFieldsValue.valueOld = historyInstanceFieldsOldValue.valueOld
                    }
                }

                if (historyInstanceFieldsValue.valueOld !== historyInstanceFieldsValue.valueNew) {
                    historyInstanceList.push(historyInstanceFieldsValue);
                }
            }

        } else {
            let IdForFieldEntityId = this._getIdforFieldId();
            for (let historyInstanceFieldsOldValue of historyInstanceFieldsOldValues) {
                //if (historyInstanceFieldsOldValue.fieldID === IdForFieldEntityId)
                    historyInstanceList.push(historyInstanceFieldsOldValue);
            }

        }

    }

    _getIdforFieldId() {
        return this.queryDataInformer.entityClassFields.filter(entityField => entityField.fields.description === textM.fields.id)
            .map(entityField => entityField.fields.ID)[0];
    }
}

