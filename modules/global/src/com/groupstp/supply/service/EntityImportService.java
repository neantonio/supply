package com.groupstp.supply.service;


import java.io.Serializable;

    public interface EntityImportService {
        String NAME = "supply_EntityImportService";

        Serializable createOrUpdateEntity(String data);
    }