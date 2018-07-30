package com.groupstp.supply.service;

import com.groupstp.supply.entity.CargoState;

import com.groupstp.supply.entity.PaymentTableItem;
import com.groupstp.supply.entity.QueryStatus;
import com.groupstp.supply.entity.Settings;
import com.haulmont.chile.core.model.MetaClass;
import com.haulmont.cuba.core.app.importexport.EntityImportExportService;
import com.haulmont.cuba.core.app.importexport.EntityImportView;
import com.haulmont.cuba.core.entity.Entity;
import com.haulmont.cuba.core.entity.StandardEntity;
import com.haulmont.cuba.core.global.MetadataTools;
import org.springframework.stereotype.Service;

import javax.inject.Inject;
import java.lang.reflect.Field;
import java.util.*;
import java.util.stream.Collectors;

/** Сервис для работы со справочником настроек
 * @author AndreyKolosov
 */
@Service(SettingsService.NAME)
public class SettingsServiceBean implements SettingsService {

    @Inject
    private MetadataTools metadataTools;

    @Inject
    private QueryDaoService queryDaoService;

    @Inject
    private EntityImportExportService entityImportExportService;

    /**
     *  Достает все enum в проекте.
     * @return Возвращает мап с ключ/значение = имя enum/класс enum
     */
    @Override
    public Map<String, Class> getAllSortedEnums() {
        Collection<Class> allEnums = metadataTools.getAllEnums();

        //Enum не являющиеся атрибутом в сущности нужно добавлять вручную
        allEnums.add(CargoState.class);
        allEnums.add(PaymentTableItem.class);
        allEnums.add(QueryStatus.class);

        Map<String, Class> enumClasses =
                allEnums.stream().collect(Collectors.toMap(Class::getSimpleName, v -> v));
        //сортировка мапы
        return new TreeMap<>(enumClasses);
    }

    /**
     *  Достает все не системные персистентные классы в проекте.
     * @return Возвращает мап с ключ/значение = имя класса/класс
     */
    @Override
    public Map<String, Class> getAllSortedClass() {
        Collection<MetaClass> allPersistentMetaClasses = metadataTools.getAllPersistentMetaClasses();
        Map<String, Class> persistentClasses =
                allPersistentMetaClasses
                        .stream()
                        .filter(e -> e.getName().contains("supply"))
                        .collect(Collectors.toMap(k -> k.getJavaClass().getSimpleName(), v -> v.getJavaClass()));
        return new TreeMap<String, Class>(persistentClasses);
    }

    /**
     * Достает все объекты переданного класса classValue
     * @param classValue
     * @return Возвращает мап с ключ/значение = имя объекта/объект конвертированый в JSON
     */
    @Override
    public Map<String, String> getAllEntitiesForClass(Class classValue) {
        List<StandardEntity> entityList = queryDaoService.getEntityList(classValue.getSimpleName());
        Map<String, String> mapItemsEntity = entityList.stream().collect(Collectors.toMap(k -> k.getInstanceName()+"   ID= "+k.getId(), v -> {
                    return entityImportExportService.exportEntitiesToJSON(Collections.singletonList(v));
                }
        ));
        return mapItemsEntity;
    }

    /**
     * Достает все значения переданного Enum classValue
     * @param classValue
     * @return Возвращает мап с ключ/значение = значение Enum/значение Enum
     */
    @Override
    public Map<String, String> getAllEnumValues(Class classValue) {
        Map<String, String> mapEnumValues = Arrays.asList(classValue.getEnumConstants()).stream()
                .collect(Collectors.toMap(k -> k.toString(), v -> v.toString()));
        return mapEnumValues;
    }

    /**
     * Достает Значение у объекта settings
     * @param settings
     * @return
     */
    @Override
    public Object getObjectValue(Settings settings) {

        List<Field> fieldFilterList = getFilledFields(settings);
        Field Value = fieldFilterList.get(1);

        Object o = null;
        try {
            o = Value.get(settings);
        } catch (IllegalAccessException e) {
            e.printStackTrace();
        }

        if (Value.getName().equals("savedObject")) {
            String s = o.toString();
            String classNameString = s.split("\"")[3];
            classNameString = classNameString.substring(classNameString.indexOf("$")+1);
            classNameString = "com.groupstp.supply.entity."+classNameString;
            Class<? extends com.haulmont.cuba.core.entity.Entity> cls = null;
            try {
                cls = (Class<? extends com.haulmont.cuba.core.entity.Entity>) Class.forName(classNameString);
            } catch (ClassNotFoundException e) {
                e.printStackTrace();
            }
            EntityImportView entityImportView = new EntityImportView(cls);
            entityImportView.addLocalProperties();
            List settingsList = (List) entityImportExportService.importEntitiesFromJSON(o.toString(), entityImportView);
            o = settingsList.get(0);
        }
    return o;
    }

    /**
     * Достает Значение по ключу
     * @param key Ключ
     * @return Объект-Значение
     */
    @Override
    public Object getObjectValue(String key) {
        Settings settings = queryDaoService.getSettings(key);
        return getObjectValue(settings);
    }

    public List<Field> getFilledFields(Settings settings) {
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
        return fieldFilterList;
    }

    /**
     * Подсчитывает кол-во заполненых атрибутов у объекта настроек
     * @param settings объект настройки
     * @return
     */
    @Override
    public Integer getCountFilledFields(Settings settings) {
        List<Field> fieldList = getFilledFields(settings);
        return fieldList.size();
    }
}