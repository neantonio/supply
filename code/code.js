'use strict';


let code = {
    "addRecord": function main(grid) {
        var type = 'elementForm';
        var path = grid.getProperties().path;
        // id таблицы для которой запрашиваем форму элемента
        var gridID = grid.getProperties().id;
        // передаем id главного объекта (нужно для редактирования ТЧ)
        var headID = grid.getProperties().headID;
        var request = twoBe.createRequest();
        // Если справочник иерархический, то сразу заполним поле parentID
        if (grid.hierachy) {
            var parentID = {};
            var selectedID = grid.getSelectedIDs()[0];
            if (selectedID) {
                var selectedRec = grid.getRecord(selectedID);
                if (selectedRec.isGroup) {
                    parentID['id'] = selectedID;
                    parentID['name'] = selectedRec.description;
                } else if (selectedRec['parentID'][0]) {
                    parentID['id'] = selectedRec['parentID'][0];
                    var groupRec = grid.getRecord(selectedRec['parentID'][0]);
                    parentID['name'] = groupRec.description;
                }
            }
        }
        request.addParam('action', 'get').addParam('path', path).addData('type', type).addData('headID', headID).addData('parentTableID', gridID).addBefore(function () {
            grid.lock('Идет загрузка..');
        }).addSuccess(function (data) {
            // Добавляем в пустую дату с сервера данные о parentID, чтобы форма при построении их прочитала
            if (parentID) {
                var id = parentID.id;
                var description = parentID.name;
                data.content[0].fk = {
                    parentID: {}
                };
                data.content[0].fk.parentID[id] = description;
                data.content[0].records[0] = {
                    parentID: [id]
                };
            }
            twoBe.buildView(data, path + type);
            grid.unlock();
        }).addError(function (msg) {
            twoBe.showMessage(0, msg);
            grid.unlock();
        }).addCacheKey(path + type).send();
    },
    "copy": function main(grid) {
        var path = grid.path;
        var PK = grid.PK;
        var request = twoBe.createRequest();
        var queryParams = twoBe.createSimpleCondition(PK, PK, grid.getSelectedIDs()[0], 'equal');
        request.addParam('action', 'copy').addParam('path', path).addQueryParams(queryParams).addBefore(function () {
            grid.lock('Копирование...');
        }).addSuccess(function (data) {
            let rec = data.content[0].records[0];
            let fk = data.content[0].fk;
            grid.addRecord(rec, fk);
            var refGrids = twoBe.getGridRefs(path);
            for (var ref in refGrids) {
                refGrids[ref].getProperties().headID = data.content[0].records[0].ID;
            }
            grid.unlock();
        }).addError(function (msg) {
            twoBe.showMessage(0, msg);
            grid.unlock();
        }).send();
    },
    "editRecord": function main(grid) {
        var type = 'elementForm';
        var path = grid.getProperties().path;
        var PK = grid.getProperties().PK;
        // id таблицы для которой запрашиваем форму элемента
        var gridID = grid.getProperties().id;
        // передаем id главного объекта (для передачи в кросс таблицу)
        var headID = grid.getProperties().headID;
        var request = twoBe.createRequest();
        var queryParams = twoBe.createSimpleCondition(PK, PK, grid.getSelectedIDs()[0], 'equal');
        request.addParam('action', 'get').addParam('path', path).addData('type', type).addData('parentTableID', gridID).addQueryParams(queryParams).addBefore(function () {
            grid.lock('Идет загрузка..');
        }).addSuccess(function (data) {
            twoBe.buildView(data, path + type);
            grid.unlock();
        }).addError(function (msg) {
            twoBe.showMessage(0, msg);
            grid.unlock();
        }).addCacheKey(path + type).send();
    },
    "addRecordHierarchy": function main() {

    },
    // отдельная функция для справочника фильтров, так как в одной и из вкладок формы элемента у него нестандартная кросс таблица
    "editFilterRecord": function main(grid) {
        var type = 'elementForm';
        var path = grid.getProperties().path;
        var PK = grid.getProperties().PK;
        // id таблицы для которой запрашиваем форму элемента
        var gridID = grid.getProperties().id;
        // передаем id главного объекта (для передачи в кросс таблицу)
        var headID = grid.getProperties().headID;
        var request = twoBe.createRequest();
        var queryParams = twoBe.createSimpleCondition(PK, PK, grid.getSelectedIDs()[0], 'equal');
        request.addParam('action', 'get').addParam('path', path).addData('type', type).addData('parentTableID', gridID).addData('headID', headID).addData('headIDForFiltersAction', grid.getSelectedIDs()[0]).addQueryParams(queryParams).addBefore(function () {
            grid.lock('Идет загрузка..');
        }).addSuccess(function (data) {
            twoBe.buildView(data, path + type);
            grid.unlock();
        }).addError(function (msg) {
            twoBe.showMessage(0, msg);
            grid.unlock();
        }).addCacheKey(path + type).send();
    },
    "delRecord": function main(grid) {
        twoBe.showConfirm('Вы действительно хотите удалить выбранные позиции?', function () {
            var path = grid.getProperties().path;
            var PK = grid.getProperties().PK;
            var IDs = grid.getSelectedIDs();
            var queryParams = twoBe.createSimpleCondition(PK, PK, IDs, 'in');
            twoBe.createRequest().addParam('action', 'delete').addParam('path', path).addQueryParams(queryParams).addBefore(function () {
                grid.lock('Идет загрузка..');
            }).addSuccess(function (data) {
                grid.deleteRecords(IDs);
                grid.unlock();
            }).addError(function (msg) {
                twoBe.showMessage(0, msg);
                grid.unlock();
            }).send();
        });
    },
    "popupSaveClick": function main(button) {
        var path = button.getProperties().path;
        var popup = twoBe.getById('currentPopup');
        var form = twoBe.getById(path + '-form');
        var data = form.getData();
        if (data === null) return;
        var action = '';
        var PK = form.getProperties().PK;
        if (form.getField(PK).getValue() === '') {
            action = 'add';
            delete data[PK];
        } else {
            action = 'update';
            var id = data[PK];
            delete data[PK];
        }
        /*for (let field in data) {
            if (data[field] === "" || data[field] === null) {
                delete data[field];
            }
        }*/

        if (data != null) {
            var url = twoBe.getDefaultParams().url;
            var request = twoBe.createRequest();
            if (action === 'update') {
                var queryParams = twoBe.createSimpleCondition(PK, PK, id, 'equal');
                request.addQueryParams(queryParams);
            }
            request.addUrl(url).addParam('action', action).addParam('path', path).addData('record', data).addBefore(function () {
                popup.lock('Жди')
            }).addSuccess(function (data) {
                var param = button.getProperties().param;
                if (param && param === 'close') {
                    popup.close();
                    popup.unlock();
                }
                else {
                    popup.unlock();
                }

                var parentTableID = form.getProperties().parentTableID;
                var table;
                if (parentTableID) {
                    table = twoBe.getById(parentTableID);
                }

                form.getField('ID').setValue(data.content[0].records[0].ID);
                if (action === 'add') {
                    let rec = data.content[0].records[0];
                    let fk = data.content[0].fk;
                    table.addRecord(rec, fk);
                    var refGrids = twoBe.getGridRefs(path);
                    for (var ref in refGrids) {
                        refGrids[ref].getProperties().headID = data.content[0].records[0].ID;
                    }
                }
                if (action === 'update') {
                    table.updateRecords(data);
                }
            }).addError(function (msg) {
                twoBe.showMessage(0, msg);
                popup.unlock();
            }).send();
        }
    },
    "popupClose": function main(button) {
        var popup = twoBe.getById('currentPopup');
        popup.close();
    },
    'beforeShow': function main(tab) {
        var popup = twoBe.getById('currentPopup');
        var pathForm = popup.getProperties().path;
        var form = twoBe.getById(pathForm + '-form');
        if (form.getField('ID').getValue() === '') {
            tab.stop();
            var data = form.getData();
            if (data === null) return;
            var PK = form.getProperties().PK;
            delete data[PK];
            for (let field in data) {
                if (data[field] === "" || data[field] === null) {
                    delete data[field];
                }
            }
            if (data != null) {
                var url = twoBe.getDefaultParams().url;
                twoBe.createRequest().addUrl(url).addParam('action', 'add').addParam('path', pathForm).addData('record', data).addBefore(function () {
                    popup.lock('Жди')
                }).addSuccess(function (data) {
                    var table = twoBe.getById(pathForm + '-grid-listForm');
                    if (table === undefined) table = twoBe.getById(path + '-grid-chooseForm');
                    form.getField('ID').setValue(data.content[0].records[0].ID);
                    popup.unlock();
                    let rec = data.content[0].records[0];
                    let fk = data.content[0].fk;
                    table.addRecord(rec, fk);
                    var refGrids = twoBe.getGridRefs(pathForm);
                    for (var ref in refGrids) {
                        refGrids[ref].getProperties().headID = data.content[0].records[0].ID;
                    }
                    // для завки показываем кнопку активировать
                    // var btns = popup.children;
                    // for (var i = 0; i < btns.length; i++) {
                    //     var btn = btns[i];
                    //     if (btn.id === 'ref-query-button-elementForm-activate') {
                    //         btn.show();
                    //         break;
                    //     }
                    // }
                    tab.show();

                }).addError(function (msg) {
                    twoBe.showMessage(0, msg);
                    popup.unlock();
                }).send();
            }
        }
    },
    'afterShow': function main(tab) {
        if (tab.isFilled) {
            tab.show();
        } else {
            var popup = twoBe.getById('currentPopup');
            var pathForm = popup.getProperties().path;
            var tabPath = tab.getProperties().path;
            var form = twoBe.getById(pathForm + '-form');
            var ID = form.getField('ID').getValue();
            var url = twoBe.getDefaultParams().url;
            twoBe.createRequest().addUrl(url).addParam('action', 'get').addParam('path', tabPath).addData('filter', {
                FK: {
                    value: ID,
                    sign: 'equal'
                }
            }).addData('type', 'listForm').addBefore(function () {
                tab.lock('Жди')
            }).addSuccess(function (data) {
                tab.fill(data);
                tab.show();
            }).addError(function () {
                twoBe.showMessage(0, 'Ошипка');
                tab.unlock();
            }).send();
        }
    },
    "stageBeforeShow": function main(tab) {
        var path = tab.getProperties().path;
        var url = twoBe.getDefaultParams().url;
        // Проверим кэш на наличие дополнительных полей которые надо вернуть с запросом
        var object = twoBe.getObjectName(path);
        var cacheKey = 'additionalFields-' + object;
        var additionalFields = twoBe.getCache(cacheKey);
        var request = twoBe.createRequest();
        // И добавим их в данные запроса
        if (additionalFields) request.addData('additionalFields', additionalFields);
        request.addUrl(url).addParam('action', 'get').addParam('path', path).addData('type', 'listForm').addBefore(function () {
            tab.lock("Загрузка...");
        }).addSuccess(function (data) {
            tab.fill(data);
            tab.show();
        }).addError(function (msg) {
            twoBe.showMessage(0, msg);
            tab.unlock();
            //popup.unlock();
        }).send();


    },
    "onPanelOneSelect": function main(el) {
        var path = el.getProperties().path;
        var url = twoBe.getDefaultParams().url;
        var table = twoBe.getById('doc-second' + '-grid-listForm');

        twoBe.createRequest().addUrl(url).addParam('action', 'update').addParam('path', path).addBefore(function () {

        }).addSuccess(function (data) {
            table.updateRecords(data);
        }).addError(function (msg) {
            twoBe.showMessage(0, msg);
        }).send();
    },
    "refreshGrid": function main(grid) {
        grid.reloadGrid();
    },
    "showLink": function main(el) {
        var field = el.parent;
        var path = field.link;
        var url = twoBe.getDefaultParams().url;
        var type = 'chooseForm';
        var sels = field.getValue();

        var selsIDs = [];
        for (var i in sels) {
            selsIDs.push(sels[i].id);
        }
        var multiselect = el.parent.multiline;
        var popup = twoBe.getById('currentPopup');
        var request = twoBe.createRequest();

        request
            .addParam('action', 'get')
            .addParam('path', 'ref-' + path)
            .addData('type', type)
            .addData('selected', selsIDs)
            .addData('multiselect', multiselect)
            .addData('form', popup.path + '-form')
            .addData('field', el.parent.getProperties().name)
            .addBefore(function () {
                popup.lock('Идет загрузка..');
            }).addSuccess(function (data) {
            twoBe.buildView(data);
            popup.unlock();
        }).addError(function (msg) {
            twoBe.showMessage(0, msg);
            popup.unlock();
        }).addCacheKey(path + type)


        var filterGroup = twoBe.createFilterGroup({type: 'and'});
        var queryParams = twoBe.createQueryParams();

        var filterParams = field.getFiltersParams();
        if (filterParams) {
            filterParams.forEach((filerParam) => {
                var filterItem = twoBe.createFilterItem({name: filerParam.name});
                filterItem.setLeft('field', filerParam.name);
                filterItem.setRight('value', filerParam.value);
                filterItem.setSign('equal');
                filterGroup.add(filterItem);
                //request.addFilterParam(filerParam.name, filerParam.value);
            });
            queryParams.addRootGroup(filterGroup);
            request.addQueryParams(queryParams);
        }

        request.send();
    },
    "chooseRecord": function main(button) {
        var path = button.getProperties().path;
        var params = button.getProperties().param;
        var popup = twoBe.getById('currentPopup');
        var grid = twoBe.getById(path + '-grid-chooseForm');
        var ID = grid.getSelectedIDs();
        var form = twoBe.getById(params.form);
        var needToSelect = [];
        for (var i in ID) {
            needToSelect.push({id: ID[i], name: grid.recordsRaw[ID[i]].description})
        }
        if (needToSelect.length > 0) {
            form.getField(params.field).setValue(needToSelect);
            popup.close();
        } else {
            twoBe.showMessage(0, 'Выберите позиции!');
        }
    },
    "expandTest": function main(event) {
        var grid = event.grid;
        var refToExpand = grid.getProperties().refToExpand;
        if (!refToExpand) return;
        var queryParams = twoBe.createSimpleCondition('FK', 'FK', event.id, 'equal');
        twoBe
            .createRequest()
            .addParam('action', 'get')
            .addParam('path', grid.path + '-refs-' + refToExpand)
            .addData('type', 'expandForm')
            .addQueryParams(queryParams)
            .addBefore(function () {
                event.grid.lock('Загрузка');
            })
            .addSuccess(function (data) {
                event.grid.buildInExpand(event.id, data);
                event.grid.unlock();
            })
            .addError(function (msg) {
                twoBe.showMessage(0, msg);
                event.grid.unlock();
            }).send();
    },
    "mapSelected": function main() {
        console.log('mapSelected');
    },
    "mapCursorMoved": function main() {
        console.log('mapCursorMoved');
    },
    "onProductChangeValue": function main(field) {
        var url = twoBe.getDefaultParams().url;
        var value = field.getValue()[0];
        if (!value) return;

        var id = value.id;

        var targetField = field.parent.getField('recipientID');
        var queryParams = twoBe.createSimpleCondition('productID', 'productID', id, 'equal');
        twoBe.createRequest().addUrl(url).addParam('action', 'getContent').addParam('path', 'ref-recipient').addData('type', 'getFieldValues').addQueryParams(queryParams).addBefore(function () {
        }).addSuccess(function (data) {
            let suggestion = targetField._prepareDataForList.call(targetField, data);
            targetField.setListData(suggestion);
        }).addError(function (msg) {
            twoBe.showMessage(0, msg);
        }).send();

        twoBe
            .createRequest()
            .addUrl(url)
            .addParam('action', 'get')
            .addParam('path', grid.path + '-refs-position')
            .addData('type', 'expandForm')
            .addData('filter', {FK: {value: event.id, sign: 'equal'}})
            .addBefore(function () {
                event.grid.lock('Загрузка');
            })
            .addSuccess(function (data) {
                event.grid.buildInExpand(event.id, data);
                event.grid.unlock();
            })
            .addError(function (msg) {
                twoBe.showMessage(0, msg);
                event.grid.unlock();
            }).send();

    },
    "chVote": function main(grid) {
        var idsArr = grid.getSelectedIDs();
        if (!idsArr.length) twoBe.showMessage(0, 'Выберите хотя бы одну позицию!');
        var PK = grid.getProperties().PK;
        var path = grid.getProperties().path;
        var mainGrid = twoBe.getById('ref-stages_procurementCommission-grid-listForm');
        var request = twoBe.createRequest();
        var queryParams = twoBe.createSimpleCondition(PK, PK, idsArr, 'in');
        request.addQueryParams(queryParams);
        request.addParam('action', 'customAction').addData('serverFunction', 'chVote').addParam('path', path).addBefore(function () {
            grid.lock('Голосуем...');
        }).addSuccess(function (data) {
            grid.unlock();
            if (mainGrid) {
                mainGrid.reloadGrid();
            } else {
                grid.reloadGrid();
            }
        }).addError(function (msg) {
            twoBe.showMessage(0, msg);
            grid.unlock();
        }).send();
    },
    "download": function main(grid) {
        var idsArr = grid.getSelectedIDs();
        if (!idsArr.length) twoBe.showMessage(0, 'Выберите хотя бы одну позицию!');
        var PK = grid.getProperties().PK;
        var path = grid.getProperties().path;
        var request = twoBe.createRequest();
        var queryParams = twoBe.createSimpleCondition(PK, PK, idsArr, 'in');
        request.addQueryParams(queryParams);
        request.addParam('action', 'customAction').addData('serverFunction', 'download').addParam('path', path).addBefore(function () {
            grid.lock('Скачиваем...');
        }).addSuccess(function (data) {

            var content = data.fileContent;
            var description = data.fileName;
            var extension = data.fileExtension;

            twoBe.saveFile(content, description, extension);

            grid.unlock();
            grid.reloadGrid();
        }).addError(function (msg) {
            twoBe.showMessage(0, msg);
            grid.unlock();
        }).send();
    },
    "editForm": function main(grid) {
        var type = 'elementForm';
        var path = 'ref-editForm';
        // id таблицы для которой запрашиваем форму элемента
        var gridID = grid.getProperties().id;
        twoBe.createRequest().addParam('action', 'get').addParam('path', path).addData('type', type).addData('parentTableID', gridID).addBefore(function () {
            grid.lock('Идет загрузка..');
        }).addSuccess(function (data) {
            twoBe.buildView(data, path + type);
            grid.unlock();
        }).addError(function (msg) {
            twoBe.showMessage(0, msg);
            grid.unlock();
        }).addCacheKey(path + type).send();
    },
    "fileSending": function main(grid) {
        var type = 'elementForm';
        var path = 'ref-fileSending';
        // id таблицы для которой запрашиваем форму элемента
        var gridID = grid.getProperties().id;
        twoBe.createRequest().addParam('action', 'get').addParam('path', path).addData('type', type).addData('parentTableID', gridID).addBefore(function () {
            grid.lock('Идет загрузка..');
        }).addSuccess(function (data) {
            twoBe.buildView(data, path + type);
            grid.unlock();
        }).addError(function (msg) {
            twoBe.showMessage(0, msg);
            grid.unlock();
        }).addCacheKey(path + type).send();
    },
    "onSendFileClick": function main(button) {
        var path = button.getProperties().path;
        var popup = twoBe.getById('currentPopup');
        var form = twoBe.getById(path + '-form');
        var data = form.getData();
        if (data === null) return;
        var request = twoBe.createRequest();
        request.addParam('action', 'add').addParam('path', path).addData('record', data).addBefore(function () {
            popup.lock('Жди')
        }).addSuccess(function (data) {

        }).addError(function (msg) {
            twoBe.showMessage(0, msg)
        }).send();

    },
    "saveNewCustomField": function main(el) {
        // save field path in cache
        var form = twoBe.getById('ref-editForm-form');
        var field = form.getField('additionalField');
        var value = field.getValue();

        if (!value) return;
        var parentTableID = form.getProperties().parentTableID;
        var grid = twoBe.getById(parentTableID);
        var gridPath = grid.getProperties().path;

        var cacheKey = 'customFieldsFor-' + gridPath + '-grid-listForm';

        var currentCache = twoBe.getCache(cacheKey);

        if (!Array.isArray(currentCache)) currentCache = [];

        if (currentCache.indexOf(value) === -1) {
            currentCache.push(value);
            twoBe.cacheData(currentCache, cacheKey);
        }

        var popup = twoBe.getById('currentPopup');
        popup.close();

    },
    "groupBy": function main(grid) {
        var gridProperties = grid.getProperties();
        var recordsRaw = gridProperties.recordsRaw;
        var columnsRaw = gridProperties.columnsRaw;
        var groupedBy = gridProperties.groupedBy;
        var showGroupCol = gridProperties.showGroupCol;
        var id = gridProperties.id;
        grid.group(recordsRaw, columnsRaw, groupedBy);
    },
    "ungroupStagesStat": function main(grid) {
        let gridProperties = grid.getProperties();
        let id = gridProperties.id;
        let w2grid = w2ui[id];
        w2grid.removeColumn('queryIDFromServer', 'stagesInfo');
        grid.ungroup();
    },
    "groupWithStagesStat": function main(grid) {

        let posIDArr = [];
        let gridProperties = grid.getProperties();
        let recordsRaw = gridProperties.recordsRaw;
        let columnsRaw = gridProperties.columnsRaw;
        let fk = gridProperties.fk;
        let id = gridProperties.id;

        for (let recID in recordsRaw) {
            let record = recordsRaw[recID];
            let positionID = record.positionID[0];
            posIDArr.push(positionID);
        }

        // let serverAnswer = {
        //     columns: {
        //         stagesInfo : {
        //             field: "stagesInfo",
        //             hidden: false,
        //             type: "text",
        //             caption: "Стадии",
        //             size : '30%'
        //         },
        //         queryIDFromServer: {
        //             field: "queryIDFromServer",
        //             hidden: false,
        //             type: "reference",
        //             caption: "Заявка",
        //             size : '30%'
        //         }
        //     },
        //     records: {
        //         "28156b03-b640-8155-979a-73a551135392": { // ID строки на закупочной комиссии, но вообще может быть positionID
        //             "queryIDFromServer": ['4b85b735-5117-3a7a-8463-5567a10a7a49'], // queryID
        //             "stagesInfo" : 'Подбор поставщиков: 1; Закупочная комиссия: 4;'
        //         },
        //         "28156b03-b640-8155-979a-73a551135391" : {
        //             "queryIDFromServer": ['4b85b735-5117-3a7a-8463-5567a10a7a49'], // queryID
        //             "stagesInfo" : 'Подбор поставщиков: 1; Закупочная комиссия: 4;'
        //         },
        //         "28156b03-b640-8155-979a-73a551135390" : {
        //             "queryIDFromServer": ['4b85b735-5117-3a7a-8463-5567a10a7a49'], // queryID
        //             "stagesInfo" : 'Подбор поставщиков: 1; Закупочная комиссия: 4;'
        //         },
        //         "0197a919-121b-498b-4157-56179a5a0033" : {
        //             "queryIDFromServer": ['89929108-8b66-4a75-b823-500747321269'], // queryID
        //             "stagesInfo" : 'Подбор поставщиков: 17; Закупочная комиссия: 18;'
        //         }
        //
        //     },
        //     fk: {
        //         queryIDFromServer: {
        //             "4b85b735-5117-3a7a-8463-5567a10a7a49": "Query 1",
        //             "89929108-8b66-4a75-b823-500747321269": "Query 2"
        //         }
        //     }
        // };


        let request = twoBe.createRequest();
        let url = twoBe.getDefaultParams().url + '/request/getDataForGroupInZK';

        request.addUrl(url).addData('positionIDs', posIDArr).addBefore(function () {
            grid.lock('Requesting data..');
        }).addSuccess(function (serverAnswer) {
            // добавим информацию о колонках
            for (let col in serverAnswer.columns) {
                let colInfo = serverAnswer.columns[col];
                columnsRaw[col] = colInfo;
            }
            // дополним информацию о записи
            for (let positionID in serverAnswer.records) {
                let record = serverAnswer.records[positionID];
                let id = null;
                for (let stageRecID in recordsRaw) {
                    let rawRecord = recordsRaw[stageRecID];
                    if (rawRecord.positionID[0] === positionID) {
                        id = rawRecord.ID;
                        break;
                    }
                }
                if (!id) continue;
                let rawRecord = recordsRaw[id];
                for (let col in record) {
                    let value = record[col];
                    rawRecord[col] = value;
                }
            }
            // добавим информацию о ссылочных полях
            for (let col in serverAnswer.fk) {
                let values = serverAnswer.fk[col];
                for (let id in values) {
                    let toDisplay = values[id];
                    if (fk[col] === undefined) {
                        fk[col] = {};
                    }
                    fk[col][id] = toDisplay;
                }
            }
            // сгруппируем записи
            let groupedRecs = grid.getGroupedRecords(recordsRaw, columnsRaw, ['queryIDFromServer']);
            let w2grid = w2ui[id];
            w2grid.columns = grid.makeColumns();
            // добавим столбцы в w2ui
            //for (let col in serverAnswer.columns) {

                /*if (!w2grid.getColumn(col)) {
                    w2grid.addColumn('ID', colInfo);
                }*/
            //}
            // обновим записи
            w2grid.records = groupedRecs;
            w2grid.refresh();
            grid.unlock();
        }).addError(function (msg) {
            twoBe.showMessage(0, msg);
            grid.unlock();
        }).send();

    },
    "showHistory": function main(grid) {

        let positionID = grid.getSelectedIDs()[0];

        let request = twoBe.createRequest();
        let url = twoBe.getDefaultParams().url + '/request/getPositionHisory';

        request.addUrl(url).addData('positionID', positionID).addBefore(function () {
            grid.lock('Requesting data..');
        }).addSuccess(function (serverAnswer) {
            twoBe.showPopup(0, serverAnswer, {
                title: 'История движения по этапам'
            });
            grid.unlock();
        }).addError(function (msg) {
            twoBe.showMessage(0, msg);
            grid.unlock();
        }).send();

    },
    "onBillFilesSelect": function main(grid) {
        var secondGrid = twoBe.getById('ref-stages_billBinding-grid-listForm');
        // Функция должна отрабатывать только на этапе привязки счетов
        if (!secondGrid) return;

        var recID = grid.getSelectedIDs()[0];
        var recordRaw = grid.recordsRaw[recID];

        var supplierID = recordRaw['supplier'][0];
        var organizationID = recordRaw['organization'][0];
        var subdivisionID = recordRaw['subdivision'][0];
        var selectedBillID = recID;
        var selectedRec = {
            supplier: supplierID,
            organization: organizationID,
            subdivision: subdivisionID
        };

        var recordsRaw = secondGrid.recordsRaw;

        var recordsForW2UI = {};

        // поищем в правой табличке подходящие записи
        for (var recID in recordsRaw) {
            var record = recordsRaw[recID];
            var targetRec = {
                supplier: record.supplier[0],
                organization: record['positionID*queryID*organization'][0],
                subdivision: record['positionID*queryID*subdivision'][0],
                bill: record['bill'][0]
            };
            let propertiesMatch = selectedRec.supplier === targetRec.supplier && selectedRec.organization === targetRec.organization && selectedRec.subdivision === targetRec.subdivision;
            if (propertiesMatch) {
                if (targetRec.bill) {
                    if (targetRec.bill === selectedBillID) {
                        recordsForW2UI[recID] = record;
                    }
                } else {
                    recordsForW2UI[recID] = record;
                }
            }
        }

        recordsForW2UI = secondGrid.makeRecords(recordsForW2UI);
        var w2grid = w2ui[secondGrid.id];
        if (w2grid) {
            w2grid.clear();
            w2grid.records = recordsForW2UI;
            secondGrid.refresh();
        }
    },
    "onBillFilesUnselect": function main(grid) {
        var secondGrid = twoBe.getById('ref-stages_billBinding-grid-listForm');
        var selected = grid.getSelectedIDs();
        var isSelected = selected && (selected.length > 0);
        // если мы просто сняли выделение со строки, а не выделили другую, то отобразим все записи в таблице Привязки счетов
        if (!isSelected && secondGrid) {

            var recordsRaw = secondGrid.recordsRaw;
            var recordsForW2UI = {};

            for (var recID in recordsRaw) {
                var record = recordsRaw[recID];
                if (!record.bill[0]) {
                    recordsForW2UI[recID] = record;
                }
            }

            var allRecordsWithoutBill = secondGrid.makeRecords(recordsForW2UI);
            var w2grid = w2ui[secondGrid.id];
            if (w2grid) {
                w2grid.clear();
                w2grid.records = allRecordsWithoutBill;
                secondGrid.refresh();
            }
        }
    },
    "sync": function main(grid) {
        var path = grid.getProperties().path;
        var request = twoBe.createRequest();
        request.addParam('action', 'customAction').addData('serverFunction', 'sync').addParam('path', path).addBefore(function () {
            grid.lock('Синхронизируем...');
        }).addSuccess(function (data) {
            grid.unlock();
            grid.reloadGrid();
        }).addError(function (msg) {
            twoBe.showMessage(0, msg);
            grid.unlock();
        }).send();
    },
    "updateBills": function main(grid) {

        var selectedPos = grid.getSelectedIDs();
        if (!selectedPos || !selectedPos.length) {
            twoBe.showMessage(0, 'Выберите позиции для привязки к счету!');
            return;
        }

        var billsGrid = twoBe.getById('ref-billFiles-grid-listForm');
        if (!billsGrid) return;

        var selectedBill = billsGrid.getSelectedIDs()[0];
        if (!selectedBill) {
            twoBe.showMessage(0, 'Не выбран счет!');
            return;
        }

        var data = {
            bill: selectedBill
        }

        var queryParams = twoBe.createSimpleCondition(grid.PK, grid.PK, selectedPos, 'in');
        var request = twoBe.createRequest();
        request.addParam('action', 'update').addParam('path', grid.path).addData('record', data).addQueryParams(queryParams).addBefore(function () {
            grid.lock('Привязываем счета...')
        }).addSuccess(function (data) {
            grid.updateRecords(data);
            twoBe.showMessage(0, 'Счета привязаны!')
            grid.unlock('Привязываем счета...')
        }).addError(function (msg) {
            twoBe.showMessage(0, msg)
        }).send();

    },
    "beforeBillBindingRender": function main(event) {
        var grid = event.stpgrid;
        if (grid) {
            var recordsRaw = grid.recordsRaw;
            var recordsForW2UI = {};

            for (var recID in recordsRaw) {
                var record = recordsRaw[recID];
                if (!record.bill[0]) {
                    recordsForW2UI[recID] = record;
                }
            }
            var allRecordsWithoutBill = grid.makeRecords(recordsForW2UI);
            var w2grid = event.w2grid
            if (w2grid) {
                w2grid.clear();
                w2grid.records = allRecordsWithoutBill;
                //grid.refresh();
            }
        }
        //if (event.w2grid.records[0]) {
        //    event.w2grid.select()
        //}
        //event.stpgrid.hideRecords(event.w2grid);
    },
    "onRoleFilterSaveClick": function main(button) {
        var path = button.getProperties().path;
        var popup = twoBe.getById('currentPopup');
        // кросс таблица для редактирования фильтров по действиям, у нее есть свое сохранение поэтому, предупредим если ошиблись кнопками
        var crossGrid = twoBe.getById('ref-filters-refs-filters_actions-crossGrid-crossGrid');
        if (crossGrid) {
            if (crossGrid.hasChanges()) {
                twoBe.showConfirmation('Есть незаписанные фильтры по действиям, продолжить?', () => {
                    save();
                })
            } else {
                save();
            }
        } else {
            save();
        }

        function save() {
            var form = twoBe.getById(path + '-form');
            var data = form.getData();
            if (data === null) return;
            var action = '';
            var PK = form.getProperties().PK;
            if (form.getField(PK).getValue() === '') {
                action = 'add';
                delete data[PK];
            } else {
                action = 'update';
                var id = data[PK];
                delete data[PK];
            }
            for (let field in data) {
                if (data[field] === "" || data[field] === null) {
                    delete data[field];
                }
            }

            if (data != null) {
                var url = twoBe.getDefaultParams().url;
                var request = twoBe.createRequest();
                if (action === 'update') {
                    var queryParams = twoBe.createSimpleCondition(PK, PK, id, 'equal');
                    request.addQueryParams(queryParams);
                }
                request.addUrl(url).addParam('action', action).addParam('path', path).addData('record', data).addBefore(function () {
                    popup.lock('Жди')
                }).addSuccess(function (data) {
                    var param = button.getProperties().param;
                    if (param && param === 'close') {
                        popup.close();
                        popup.unlock();
                    }
                    else {
                        popup.unlock();
                    }

                    var parentTableID = form.getProperties().parentTableID;
                    var table;
                    if (parentTableID) {
                        table = twoBe.getById(parentTableID);
                    }

                    form.getField('ID').setValue(data.content[0].records[0].ID);
                    if (action === 'add') {
                        let rec = data.content[0].records[0];
                        let fk = data.content[0].fk;
                        table.addRecord(rec, fk);
                        var refGrids = twoBe.getGridRefs(path);
                        for (var ref in refGrids) {
                            refGrids[ref].getProperties().headID = data.content[0].records[0].ID;
                        }
                    }
                    if (action === 'update') {
                        table.updateRecords(data);
                    }
                }).addError(function (msg) {
                    twoBe.showMessage(0, msg)
                    popup.unlock();
                }).send();
            }
        }
    },
    "onRoleFilterClose": function main() {
        var popup = twoBe.getById('currentPopup');

        // кросс таблица для редактирования фильтров по действиям, у нее есть свое сохранение поэтому, предупредим если ошиблись кнопками
        var crossGrid = twoBe.getById('ref-filters-refs-filters_actions-crossGrid-crossGrid');
        if (crossGrid) {
            if (crossGrid.hasChanges()) {
                twoBe.showConfirmation('Есть незаписанные фильтры по действиям, продолжить?', () => {
                    popup.close();
                })
            } else {
                popup.close();
            }
        } else {
            popup.close();
        }

    },
    "getPositionInfoForBills": function main(grid) {
        var type = 'positionInfoForm';
        var path = grid.path;
        var billID = grid.getSelectedIDs()[0];
        var request = twoBe.createRequest();
        var queryParams = twoBe.createSimpleCondition('bill', 'bill', billID, 'equal');
        request.addQueryParams(queryParams);
        request.addParam('action', 'get').addParam('path', path).addData('type', type).addBefore(function () {
            grid.lock('Идет загрузка..');
        }).addSuccess(function (data) {
            twoBe.buildView(data, path + type);
            grid.unlock();
        }).addError(function (msg) {
            twoBe.showMessage(0, msg);
            grid.unlock();
        }).send();

    },
    "apiFilterFunction": function main(grid, remoteFuncName) {
        var idsArr = grid.getSelectedIDs();
        if (!idsArr.length) twoBe.showMessage(0, 'Выберите хотя бы одну позицию!');
        var PK = grid.getProperties().PK;
        var path = grid.getProperties().path;
        var request = twoBe.createRequest();
        var queryParams = twoBe.createSimpleCondition(PK, PK, idsArr, 'in');
        request.addQueryParams(queryParams);
        request.addParam('action', 'customAction').addData('serverFunction', remoteFuncName).addParam('path', path).addBefore(function () {
            grid.lock('Подождите...');
        }).addSuccess(function (data) {
            grid.unlock();
            grid.reloadGrid();
        }).addError(function (msg) {
            twoBe.showMessage(0, msg);
            grid.unlock();
        }).send();
    },
    "apiNoFilterFunction": function main(grid, remoteFuncName) {
        var path = grid.getProperties().path;
        var request = twoBe.createRequest();
        request.addParam('action', 'customAction').addData('serverFunction', remoteFuncName).addParam('path', path).addBefore(function () {
            grid.lock('Подождите...');
        }).addSuccess(function (data) {
            grid.unlock();
            grid.reloadGrid();
        }).addError(function (msg) {
            twoBe.showMessage(0, msg);
            grid.unlock();
        }).send();
    },
    "getCopyToOutlayForm": function main(grid) {
        var type = 'copyToOutlayForm';
        var gridID = grid.getSelectedIDs()[0];
        var path = grid.path;
        var request = twoBe.createRequest();
        request.addParam('action', 'get').addParam('path', path).addData('type', type).addData('queryID', gridID).addBefore(function () {
            grid.lock('Подождите...');
        }).addSuccess(function (data) {
            twoBe.buildView(data, path + type);
            grid.unlock();
        }).addError(function (msg) {
            twoBe.showMessage(0, msg);
            grid.unlock();
        }).send();
    },
    "copyToOutlay": function main(button) {
        var path = button.path;
        var form = twoBe.getById(path + '-form');
        var popup = twoBe.getById('currentPopup');
        var data = form.getData();
        if (data === null) return;
        var queryID = form.headID;
        var outlayID = data.outlayID;
        let url = twoBe.getDefaultParams().url + '/request/copyPosToOutlay';

        var request = twoBe.createRequest();
        request.addUrl(url).addData('queryID', queryID).addData('outlayID', outlayID).addBefore(function () {
            popup.lock('Копируем...');
        }).addSuccess(function () {
            popup.close();
        }).addError(function (msg) {
            twoBe.showMessage(0, msg);
            popup.unlock();
        }).send();
    },
    "createQuery": function main(grid) {
        var outlayID = grid.getSelectedIDs()[0];
        let url = twoBe.getDefaultParams().url + '/request/createQueryFromOutlay';

        var request = twoBe.createRequest();
        request.addUrl(url).addData('outlayID', outlayID).addBefore(function () {
            grid.lock('Создаем заявку...');
        }).addSuccess(function () {
            grid.unlock();
        }).addError(function (msg) {
            twoBe.showMessage(0, msg);
            grid.unlock();
        }).send();
    },
    "showPurchasedPositions": function main(grid) {
        var type = 'purchasedPositionsForm';
        var path = grid.path;
        var PK = grid.PK;
        var recID = grid.getSelectedIDs()[0];
        //var posID = grid.getCellRawValue(recID, 'positionID');
        var request = twoBe.createRequest();
        var queryParams = twoBe.createSimpleCondition(PK, PK, recID, 'equal');
        request.addQueryParams(queryParams);
        request.addParam('action', 'get').addParam('path', path).addData('type', type).addBefore(function () {
            grid.lock('Подождите...');
        }).addSuccess(function (data) {
            twoBe.buildView(data, path + type);
            grid.unlock();
        }).addError(function (msg) {
            twoBe.showMessage(0, msg);
            grid.unlock();
        }).send();
    },
    "getSupplierSelectionForm": function main(grid) {
        var type = 'supplierSelectionForm';
        var path = grid.path;
        var selectedIDs = grid.getSelectedIDs();
        var PK = grid.PK;
        var request = twoBe.createRequest();
        var queryParams = twoBe.createSimpleCondition(PK, PK, selectedIDs, 'in');
        request.addQueryParams(queryParams);
        request.addParam('action', 'get').addParam('path', path).addData('type', type).addBefore(function () {
            grid.lock('Подождите...');
        }).addSuccess(function (data) {
            twoBe.buildView(data, path + type);
            grid.unlock();
        }).addError(function (msg) {
            twoBe.showMessage(0, msg);
            grid.unlock();
        }).send();
    },
    "getAddSupplierForm": function main(grid) {
        var type = 'addSupplierForm';
        var path = 'ref-stages_initialOffer';
        var request = twoBe.createRequest();
        request.addParam('action', 'get').addParam('path', path).addData('type', type).addBefore(function () {
            //grid.lock('Подождите...');
        }).addSuccess(function (data) {
            twoBe.buildView(data, path + type);
            //grid.unlock();
        }).addError(function (msg) {
            twoBe.showMessage(0, msg);
            //grid.unlock();
        }).send();
    },
    "addSupplier": function main(button) {
        var popup = twoBe.getById('currentPopup');
        var form = twoBe.getById('addSupplierForm-form');
        if (!form) return;
        var values = form.getField('supplier').getValue();
        if (!values) return;
        var grid = twoBe.getById('ref-stages_initialOffer-crossGridSupSelection-supSelectionForm');
        if (grid) {
            values.forEach((value) => {
                grid.addColumn(value);
            });
        }
        popup.close();
    },
    "saveSupSelection": function main(button) {
        var popup = twoBe.getById('currentPopup');
        var grid = twoBe.getById('ref-stages_initialOffer-crossGridSupSelection-supSelectionForm');

        var changes = grid.getChanges();

        var promiseArr = [];
        // добавляем записи
        if (changes.listForAdd.length) {
            var request = twoBe.createRequest();
            request
                .addParam('action', 'add')
                .addParam('path', 'ref-stages_initialOffer_offers')
                .addData('record', changes.listForAdd)
                .addSuccess((data) => {
                });
            promiseArr.push(request.send());
        }

        // удаляем записи
        if (changes.listForDelete.length) {
            let request = twoBe.createRequest();
            var queryParams = twoBe.createSimpleCondition('ID', 'ID', changes.listForDelete, 'in');
            request.addQueryParams(queryParams);
            request
                .addParam('action', 'delete')
                .addParam('path', 'ref-stages_initialOffer_offers')
                .addSuccess((data) => {
                });
            promiseArr.push(request.send());
        }

        // итоговый callback
        popup.lock('Подождите...');
        Promise.all(promiseArr).then(() => {
            popup.close();
        }).catch((err) => {
            popup.unlock();
            twoBe.showMessage(0, 'Произошла ошибка! Возможно не все записи были изменены!');
        });


    },
    "getQuotationsListForm": function main(grid) {
        var type = 'quotationsListForm';
        var path = 'ref-stages_initialOffer';
        var selectedIDs = grid.getSelectedIDs();
        var PK = grid.PK;
        var request = twoBe.createRequest();
        var queryParams = twoBe.createSimpleCondition(PK, PK, selectedIDs, 'in');
        request.addQueryParams(queryParams);
        request.addParam('action', 'get').addParam('path', path).addData('type', type).addBefore(function () {
            grid.lock('Подождите...');
        }).addSuccess(function (data) {
            twoBe.buildView(data, path + type);
            grid.unlock();
        }).addError(function (msg) {
            twoBe.showMessage(0, msg);
            grid.unlock();
        }).send();
    },
    "saveQuotationList": function main(button) {
        var popup = twoBe.getById('currentPopup');
        var grid = twoBe.getById('ref-stages_initialOffer-crossGridQuotationList-quotationListForm');

        var changes = grid.getChanges();
        var promiseArr = [];
        // добавляем записи
        if (changes.listForAdd.length) {
            var request = twoBe.createRequest();
            request
                .addParam('action', 'add')
                .addParam('path', 'ref-stages_initialOffer_offers')
                .addData('record', changes.listForAdd)
                .addSuccess((data) => {
                });
            promiseArr.push(request.send());
        }

        // изменяем записи
        let forUpdateCount = Object.keys(changes.listForUpdate).length;
        if (forUpdateCount) {
            for (var ID in changes.listForUpdate) {
                var values = changes.listForUpdate[ID];
                var request = twoBe.createRequest();
                var queryParams = twoBe.createSimpleCondition('ID', 'ID', ID, 'equal');
                request.addQueryParams(queryParams);
                request
                    .addParam('action', 'update')
                    .addParam('path', 'ref-stages_initialOffer_offers')
                    .addData('record', values)
                    .addSuccess((data) => {
                    });
                promiseArr.push(request.send());
            }
        }

        // итоговый callback
        popup.lock('Подождите...');
        Promise.all(promiseArr).then(() => {
            popup.close();
        }).catch((err) => {
            popup.unlock();
            twoBe.showMessage(0, 'Произошла ошибка! Возможно не все записи были изменены!');
        });
    },
    "getSuppliersListForm": function main(grid) {
        var type = 'suppliersListForm';
        var path = 'ref-stages_initialOffer';
        var PK = grid.PK;
        var allID = [];
        for (var recid in grid.recordsRaw) {
            allID.push(recid);
        }
        var request = twoBe.createRequest();
        var queryParams = twoBe.createSimpleCondition('initialOfferID', 'initialOfferID', allID, 'in');
        request.addQueryParams(queryParams);
        request.addParam('action', 'get').addParam('path', path).addData('type', type).addBefore(function () {
            grid.lock('Подождите...');
        }).addSuccess(function (data) {
            twoBe.buildView(data, path + type);
            grid.unlock();
        }).addError(function (msg) {
            twoBe.showMessage(0, msg);
            grid.unlock();
        }).send();
    },
    "getQuotationsBySupplierForm": function main(grid) {
        var type = 'quotationsBySupplierForm';
        var path = 'ref-stages_initialOffer';
        var PK = grid.PK;
        var supSelectionGrid = twoBe.getById('ref-stages_initialOffer-grid-listForm');
        if (!supSelectionGrid) return;
        var posOnStageIDs = [];
        for (var recid in supSelectionGrid.recordsRaw) {
            posOnStageIDs.push(recid);
        }
        var selectedID = grid.getSelectedIDs()[0];
        var recordRaw = grid.getRecord(selectedID);
        var supID = recordRaw.supplier[0];
        var supDescription = grid.fk.supplier[supID];
        var request = twoBe.createRequest();
        //addFilterParam('initialOfferID', posOnStageIDs, 'in').addFilterParam('supplier', supID)
        var filterItem1 = twoBe.createFilterItem({name: 'initialOfferID'});
        filterItem1.setLeft('field', 'initialOfferID');
        filterItem1.setRight('value', posOnStageIDs);
        filterItem1.setSign('in');
        var filterItem2 = twoBe.createFilterItem({name: 'supplier'});
        filterItem2.setLeft('field', 'supplier');
        filterItem2.setRight('value', supID);
        filterItem2.setSign('equal');
        var filterGroup = twoBe.createFilterGroup({type: 'and'});
        filterGroup.add([filterItem1, filterItem2]);
        var queryParams = twoBe.createQueryParams();
        queryParams.addRootGroup(filterGroup);
        request.addQueryParams(queryParams);
        request.addParam('action', 'get').addParam('path', path).addData('type', type).addData('supDescription', supDescription).addBefore(function () {
            grid.lock('Подождите...');
        }).addSuccess(function (data) {
            twoBe.buildView(data, path + type);
            grid.unlock();
        }).addError(function (msg) {
            twoBe.showMessage(0, msg);
            grid.unlock();
        }).send();
    },
    "backToInitialOffer": function main(grid) {
        twoBe.showConfirm('Вы действительно хотите откатить выбранные позиции на предыдущий этап?', function () {
            var recIDsArr = grid.getSelectedIDs();
            var recordsToMove = [];
            recIDsArr.forEach((recid) => {
                var recordRaw = grid.recordsRaw[recid];
                if (recordRaw) {
                    recordsToMove.push(recordRaw);
                }
            });
            var request = twoBe.createRequest();
            var url = twoBe.getDefaultParams().url + '/request/backToPreviousStage';
            request.addUrl(url).addData('recordsToMove', recordsToMove).addData('stageTo', 'stages_initialOffer').addData('stageFrom', 'stages_procurementCommission').addBefore(function () {
                grid.lock('Подождите...');
            }).addSuccess(function (data) {
                grid.unlock();
                grid.reloadGrid();
            }).addError(function (msg) {
                twoBe.showMessage(0, msg);
                grid.unlock();
            }).send();
        });

    },
    "decline": function main(grid) {
        twoBe.showConfirm('Вы действительно хотите отказать выбранные позиции?', function () {
            var path = grid.path;
            var recIDsArr = grid.getSelectedIDs();
            var recordsToMove = [];
            recIDsArr.forEach((recid) => {
                var recordRaw = grid.recordsRaw[recid];
                if (recordRaw) {
                    recordsToMove.push(recordRaw);
                }
            });
            var request = twoBe.createRequest();
            var url = twoBe.getDefaultParams().url + '/request/decline';
            request.addUrl(url).addParam('path', path).addData('recordsToMove', recordsToMove).addBefore(function () {
                grid.lock('Подождите...');
            }).addSuccess(function (data) {
                grid.unlock();
                grid.reloadGrid();
            }).addError(function (msg) {
                twoBe.showMessage(0, msg);
                grid.unlock();
            }).send();
        });
    },
    "getFormForAdditionalFields": function (grid) {
        var type = 'configureAdditionalFields';
        var path = 'commonForms';
        var pathParts = grid.path.split('-');
        var object = pathParts[pathParts.length - 1];
        var request = twoBe.createRequest();
        request.addParam('action', 'get').addParam('path', path).addData('type', type).addData('object', object).addBefore(function () {
            grid.lock('Подождите...');
        }).addSuccess(function (data) {
            twoBe.buildView(data, path + type);
            grid.unlock();
        }).addError(function (msg) {
            twoBe.showMessage(0, msg);
            grid.unlock();
        }).send();
    },
    "addFields": function (button) {
        var popup = button.parent;
        var grid = twoBe.getById('additionalFieldsForm-grid-id');
        if (!grid) {
            twoBe.showMessage(0, 'Ошибка при сохранении информации, обратитесь к разработчикам.');
            return;
        }
        var object = grid.data.object;
        var chosenFields = [];
        var selected = grid.getSelectedIDs();
        selected.forEach((id) => {
            var fieldParts = [];
            // получить запись
            var rec = grid.getRecord(id);
            // начало цикла от нижнего элемента вверх по дереву
            do {
                // получить значение поля parentID
                var parentID = rec.parentID;
                // добавить значение поля field в начало массива fieldParts
                fieldParts.unshift(rec.field);
                rec = grid.getRecord(parentID);
            } while (rec);

            // не добавляем поля первого уровня
            if (fieldParts.length > 1) {
                // соединить элементы массива fieldParts по символу "."
                var fieldPath = fieldParts.join('.');
                // добавить поле в массив chosenFields
                chosenFields.push(fieldPath);
            }
        });
        // сохранить значение chosenFields в кэш
        if (chosenFields.length) {
            twoBe.cacheData(chosenFields, 'additionalFields-' + object);
        } else {
            twoBe.deleteCache('additionalFields-' + object);
        }
        popup.close();
    }
};


module.exports = code;