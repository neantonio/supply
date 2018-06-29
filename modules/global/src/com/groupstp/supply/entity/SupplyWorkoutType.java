package com.groupstp.supply.entity;

import com.haulmont.chile.core.datatypes.impl.EnumClass;

import javax.annotation.Nullable;


public enum SupplyWorkoutType implements EnumClass<String> {

    Supply("Supply"),
    Relocation("Relocation");

    private String id;

    SupplyWorkoutType(String value) {
        this.id = value;
    }

    public String getId() {
        return id;
    }

    @Nullable
    public static SupplyWorkoutType fromId(String id) {
        for (SupplyWorkoutType at : SupplyWorkoutType.values()) {
            if (at.getId().equals(id)) {
                return at;
            }
        }
        return null;
    }
}