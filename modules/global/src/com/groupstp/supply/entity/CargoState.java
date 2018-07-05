package com.groupstp.supply.entity;

import com.haulmont.chile.core.datatypes.impl.EnumClass;

import javax.annotation.Nullable;


public enum CargoState implements EnumClass<String> {

    collect("collect"),
    waiting("waiting"),
    processing("processing"),
    shipped("shipped");

    private String id;

    CargoState(String value) {
        this.id = value;
    }

    public String getId() {
        return id;
    }

    @Nullable
    public static CargoState fromId(String id) {
        for (CargoState at : CargoState.values()) {
            if (at.getId().equals(id)) {
                return at;
            }
        }
        return null;
    }
}