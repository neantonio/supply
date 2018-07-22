package com.groupstp.supply.web.settings;

import com.groupstp.supply.entity.Settings;
import com.groupstp.supply.entity.Suppliers;
import com.haulmont.cuba.core.entity.Entity;
import com.haulmont.cuba.gui.components.*;
import com.haulmont.cuba.gui.xml.layout.ComponentsFactory;

import javax.inject.Inject;
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

    @Override
    public void init(Map<String, Object> params) {


        settingsesTable.addGeneratedColumn("generatedColumn", entity -> {

            Label field = (Label) componentsFactory.createComponent(Label.NAME);
            Object o = null;
            o = entity.OneValue();
            field.setValue(o);
            return field;

        });
    }
}