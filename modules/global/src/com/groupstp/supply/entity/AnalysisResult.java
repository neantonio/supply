package com.groupstp.supply.entity;

import com.haulmont.chile.core.datatypes.impl.EnumClass;

import javax.annotation.Nullable;


public enum AnalysisResult implements EnumClass<String> {

    Selection("Selection"),
    Timeout("Timeout");

    private String id;

    AnalysisResult(String value) {
        this.id = value;
    }

    public String getId() {
        return id;
    }

    @Nullable
    public static AnalysisResult fromId(String id) {
        for (AnalysisResult at : AnalysisResult.values()) {
            if (at.getId().equals(id)) {
                return at;
            }
        }
        return null;
    }
}