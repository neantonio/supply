package com.groupstp.supply.entity;

import com.haulmont.chile.core.datatypes.impl.EnumClass;

import javax.annotation.Nullable;


public enum Origin implements EnumClass<String> {

    TransactionSystem("TransactionSystem"),
    Supply("Supply"),
    Analytic("Analytic");

    private String id;

    Origin(String value) {
        this.id = value;
    }

    public String getId() {
        return id;
    }

    @Nullable
    public static Origin fromId(String id) {
        for (Origin at : Origin.values()) {
            if (at.getId().equals(id)) {
                return at;
            }
        }
        return null;
    }
}