package com.groupstp.supply.web.settings;

import com.haulmont.cuba.gui.components.AbstractEditor;
import com.groupstp.supply.entity.Settings;
import com.haulmont.cuba.gui.components.Component;

import java.lang.reflect.Array;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class SettingsEdit extends AbstractEditor<Settings> {


    public void onOkBtnClick() throws Exception {

        Settings settings = getItem();
        List<Field> fieldList = Arrays.asList(settings.getClass().getDeclaredFields());

        List<Field> fieldFilterList = fieldList.stream()
                .filter(field -> {
                            String name = field.getName();
                            Object value = null;
                            try {
                                field.setAccessible(true);
                                value = field.get(settings);
                            } catch (IllegalAccessException e) {
                                e.printStackTrace();
                            }
                            return (value != null && !name.contains("_persistence_") && !name.equals("serialVersionUID"));
                        }
                )
                .collect(Collectors.toList());
        int sizeFieldFilterList = fieldFilterList.size();
        if (sizeFieldFilterList == 2) {
            commitAndClose();
        } else {
            showNotification(getMessage("Выбрано значений: "+(sizeFieldFilterList-1)+"\nВыберите 1 значение"), NotificationType.TRAY);
        }
    }

    public void onCancelBtnClick(Component source) {
        this.close("close");
    }

    public void onClearBooleanBtnClick(Component source) {
        getItem().setBooleanValue(null);
    }

}
