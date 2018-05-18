package com.groupstp.supply.entity;

import com.haulmont.chile.core.datatypes.impl.EnumClass;

import javax.annotation.Nullable;


public enum Peridiocities implements EnumClass<String> {

    Onetime("Onetime"),
    Repeated("Repeated"),
    Timetable("Timetable");

    private String id;

    Peridiocities(String value) {
        this.id = value;
    }

    public String getId() {
        return id;
    }

    @Nullable
    public static Peridiocities fromId(String id) {
        for (Peridiocities at : Peridiocities.values()) {
            if (at.getId().equals(id)) {
                return at;
            }
        }
        return null;
    }
}