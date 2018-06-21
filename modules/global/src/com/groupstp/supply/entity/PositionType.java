package com.groupstp.supply.entity;

import com.haulmont.chile.core.datatypes.impl.EnumClass;

import javax.annotation.Nullable;


public enum PositionType implements EnumClass<String> {

    specification("specification"),
    nomenclature("nomenclature");

    private String id;

    PositionType(String value) {
        this.id = value;
    }

    public String getId() {
        return id;
    }

    @Nullable
    public static PositionType fromId(String id) {
        for (PositionType at : PositionType.values()) {
            if (at.getId().equals(id)) {
                return at;
            }
        }
        return null;
    }
}