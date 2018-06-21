package com.groupstp.supply.entity;

import com.haulmont.chile.core.datatypes.impl.EnumClass;

import javax.annotation.Nullable;


public enum QueryStatus implements EnumClass<String> {

    in_work("IN_WORK"),
    overdue("OVERDUE"),
    done("DONE"),
    new_item("NEW");

    private String id;

    QueryStatus(String value) {
        this.id = value;
    }

    public String getId() {
        return id;
    }

    @Nullable
    public static QueryStatus fromId(String id) {
        for (QueryStatus at : QueryStatus.values()) {
            if (at.getId().equals(id)) {
                return at;
            }
        }
        return null;
    }
}