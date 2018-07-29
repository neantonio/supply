package com.groupstp.supply.web.settings;

import com.groupstp.supply.entity.Settings;
import com.groupstp.supply.entity.Suppliers;
import com.groupstp.supply.service.SettingsService;
import com.haulmont.cuba.core.app.importexport.EntityImportExportService;
import com.haulmont.cuba.core.app.importexport.EntityImportView;
import com.haulmont.cuba.core.entity.Entity;
import com.haulmont.cuba.gui.components.*;
import com.haulmont.cuba.gui.xml.layout.ComponentsFactory;

import javax.inject.Inject;
import javax.swing.text.View;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class SettingsBrowse extends AbstractLookup {

    @Inject
    private GroupTable<Settings> settingsesTable;

    @Inject
    protected ComponentsFactory componentsFactory;

    @Inject
    private SettingsService settingsService;

    @Override
    public void init(Map<String, Object> params) {

        settingsesTable.addGeneratedColumn("Значение", entity -> {
            Label field = (Label) componentsFactory.createComponent(Label.NAME);
            field.setValue(settingsService.getObjectValue(entity));
            return field;
        });
    }
}