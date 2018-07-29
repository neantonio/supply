package com.groupstp.supply.web.settings;

import com.groupstp.supply.entity.*;
import com.groupstp.supply.service.SettingsService;
import com.haulmont.chile.core.model.MetaClass;
import com.haulmont.cuba.core.app.importexport.EntityImportExportService;
import com.haulmont.cuba.core.app.importexport.EntityImportView;
import com.haulmont.cuba.core.entity.Entity;
import com.haulmont.cuba.core.global.MetadataTools;
import com.haulmont.cuba.core.global.View;
import com.haulmont.cuba.gui.components.AbstractEditor;
import com.haulmont.cuba.gui.components.Component;
import com.haulmont.cuba.gui.components.LookupField;
import com.haulmont.cuba.gui.data.CollectionDatasource;
import com.haulmont.cuba.gui.data.DsBuilder;

import javax.inject.Inject;
import java.lang.reflect.Array;
import java.lang.reflect.Field;
import java.util.*;
import java.util.stream.Collectors;

/**
 * @author Andrey Kolosov
 */
public class SettingsEdit extends AbstractEditor<Settings> {

    private String entitiesToJSON;

    @Inject
    private EntityImportExportService entityImportExportService;

    @Inject
    private LookupField lookupFieldClass;

    @Inject
    private LookupField lookupFieldEntity;

    @Inject
    private LookupField lookupFieldEnum;

    @Inject
    private LookupField lookupFieldEnumValue;

    @Inject
    private MetadataTools metadataTools;

    @Inject
    private SettingsService settingsService;

    @Override
    public void init(Map<String, Object> params) {
        super.init(params);

        //Задаются значения для поля Сущность
        lookupFieldClass.setOptionsMap(settingsService.getAllSortedClass());

        lookupFieldClass.addValueChangeListener(e -> {
            //Задаются значения для поля Объект в зависимости от того какая сущность выбрана
            lookupFieldEntity.setOptionsMap(settingsService.getAllEntitiesForClass((Class) e.getValue()));
        });

        //Задаются значения для поля Enum
        lookupFieldEnum.setOptionsMap(settingsService.getAllSortedEnums());

        lookupFieldEnum.addValueChangeListener(e -> {
            //Задаются значения для поля Enum Значения в зависимости от того какой Enum выбран
            lookupFieldEnumValue.setOptionsMap(settingsService.getAllEnumValues((Class) e.getValue()));
        });
    }

    /**
     * Обработчик нажатия на кнопку "Ок". Проверяет на только одно заполненое значение.
     */
    public void onOkBtnClick() {

        int sizeFieldFilterList = settingsService.getCountFilledFields(getItem());
        if (sizeFieldFilterList == 2) {
            commitAndClose();
        } else {
            showNotification(getMessage("Выбрано значений: " + (sizeFieldFilterList - 1) + "\nВыберите 1 значение"), NotificationType.TRAY);
        }
    }

    public void onCancelBtnClick(Component source) {
        this.close("close");
    }

    public void onClearBooleanBtnClick(Component source) {
        getItem().setBooleanValue(null);
    }

}
