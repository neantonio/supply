package com.groupstp.supply.service;


import com.groupstp.supply.entity.Settings;

import java.lang.reflect.Field;
import java.util.List;
import java.util.Map;

/**
 * @author AndreyKolosov
 */
public interface SettingsService {
    String NAME = "supply_SettingsService";

    Map<String, Class> getAllSortedEnums();

    Map<String, Class> getAllSortedClass();

    Map<String, String> getAllEntitiesForClass(Class classValue);

    Map<String, String> getAllEnumValues(Class classValue);

    Object getObjectValue(Settings settings);

    Object getObjectValue(String key);

    List<Field> getFilledFields(Settings settings);

    Integer getCountFilledFields(Settings settings);
}