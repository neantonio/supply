package com.groupstp.supply.service;


import com.google.gson.JsonObject;
import com.haulmont.cuba.core.entity.Entity;

import java.io.Serializable;

public interface EntityImportService {
    String NAME = "supply_EntityImportService";

    Serializable createOrUpdateEntity(String data);

    Serializable importData(JsonObject e) throws Exception;

    Entity createObject(JsonObject e) throws Exception;
}