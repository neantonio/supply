package com.groupstp.supply.web.settings;

import com.haulmont.chile.core.model.MetaClass;
import com.haulmont.cuba.core.app.importexport.EntityImportExportService;
import com.haulmont.cuba.core.app.importexport.EntityImportView;
import com.haulmont.cuba.core.global.Metadata;
import com.haulmont.cuba.core.global.MetadataTools;
import com.haulmont.cuba.gui.components.AbstractEditor;
import com.groupstp.supply.entity.Settings;
import com.haulmont.cuba.gui.components.Component;
import com.haulmont.cuba.gui.components.LookupField;

import javax.inject.Inject;
import java.lang.reflect.Array;
import java.lang.reflect.Field;
import java.util.*;
import java.util.stream.Collectors;

public class SettingsEdit extends AbstractEditor<Settings> {

    private String entitiesToJSON;

    @Inject
    private EntityImportExportService entityImportExportService;

    @Inject
    private LookupField lookupField;

    @Inject
    private MetadataTools metadataTools ;

    @Override
    public void init(Map<String, Object> params) {
        super.init(params);
        Collection<MetaClass> allPersistentMetaClasses = metadataTools.getAllPersistentMetaClasses();
        Collection<MetaClass> allEmbeddableMetaClasses = metadataTools.getAllEmbeddableMetaClasses();

//        Map<String, Object> map = new LinkedHashMap<>();
//        for (MetaClass metaClass : allPersistentMetaClasses) {
//            map.put(metaClass.toString(),metaClass.getJavaClass());
//            showNotification(getMessage(metaClass.toString()+" "+metaClass.getJavaClass()), NotificationType.TRAY);
//        }

        Map<String, Class> embeddeableClass =
                allEmbeddableMetaClasses.stream().collect(Collectors.toMap(k -> k.toString(), t -> t.getJavaClass()));
        Map<String, Class> persistentClass =
                allPersistentMetaClasses.stream().collect(Collectors.toMap(k -> k.toString(), t->t.getJavaClass()));
        lookupField.setOptionsMap(embeddeableClass);
    }

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

    public void onToJsonBtnClick(Component source) {
        Settings settingsToJson = getItem();
        List<Settings> settingsList = new ArrayList<>();
        settingsList.add(settingsToJson);
        entitiesToJSON = entityImportExportService.exportEntitiesToJSON(settingsList);
        showNotification(getMessage(entitiesToJSON), NotificationType.TRAY);
    }

    public void onFromJsonBtnClick() {
        EntityImportView view = new EntityImportView(Settings.class);
        view.addLocalProperties();
        view.addProperties("division");
        List<Settings> settingsList = (List) entityImportExportService.importEntitiesFromJSON(entitiesToJSON,view);
        Settings settingsFromJson = settingsList.get(0);
        showNotification(getMessage(settingsFromJson.getDivision()+""), NotificationType.TRAY);
    }

    public void onAllClassBtnClick() {
        Settings item = getItem();
        MetaClass metaClass = item.getMetaClass();
        Class<? extends Settings> aClass = item.getClass();
        Class<?> superclass = aClass.getSuperclass();
        Class<?>[] classes = superclass.getClasses();
        Collection<MetaClass> allPersistentMetaClasses = metadataTools.getAllPersistentMetaClasses();
        showNotification(getMessage(allPersistentMetaClasses.toString()), NotificationType.TRAY);
    }



}
