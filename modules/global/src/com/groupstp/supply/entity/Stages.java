package com.groupstp.supply.entity;

import com.haulmont.chile.core.datatypes.impl.EnumClass;

import javax.annotation.Nullable;


public enum Stages implements EnumClass<String> {

    New("New"),
    NomControl("NomControl"),
    StoreControl("StoreControl"),
    SupSelection("SupSelection"),
    Analysis("Analysis"),
    Comission("Comission"),
    Bills("Bills"),
    Logistic("Logistic"),
    Retention("Retention"),
    Abortion("Abortion"),
    Divided("Divided"),
    Done("Done");

    private String id;

    Stages(String value) {
        this.id = value;
    }

    public String getId() {
        return id;
    }

    @Nullable
    public static Stages fromId(String id) {
        for (Stages at : Stages.values()) {
            if (at.getId().equals(id)) {
                return at;
            }
        }
        return null;
    }
}