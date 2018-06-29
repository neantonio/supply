package com.groupstp.supply.entity;

import com.haulmont.chile.core.datatypes.impl.EnumClass;

import javax.annotation.Nullable;


public enum Causes implements EnumClass<String> {

    Calculation("Calculation"),
    Replenishment("Replenishment"),
    Plan("Plan"),
    Forecast("Forecast"),
    Need("Need");

    private String id;

    Causes(String value) {
        this.id = value;
    }

    public String getId() {
        return id;
    }

    @Nullable
    public static Causes fromId(String id) {
        for (Causes at : Causes.values()) {
            if (at.getId().equals(id)) {
                return at;
            }
        }
        return null;
    }
}