package com.groupstp.supply.entity;

import com.haulmont.chile.core.annotations.NamePattern;
import com.haulmont.cuba.core.entity.StandardEntity;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;
import javax.validation.constraints.NotNull;

@NamePattern("%s|name")
@Table(name = "SUPPLY_MEASURE_UNITS", uniqueConstraints = {
    @UniqueConstraint(name = "IDX_SUPPLY_MEASURE_UNITS_UNQ", columnNames = {"EXT_ID"})
})
@Entity(name = "supply$MeasureUnits")
public class MeasureUnits extends StandardEntity {
    private static final long serialVersionUID = -7426351803220588191L;

    @Column(name = "CODE")
    protected String code;

    @NotNull
    @Column(name = "NAME", nullable = false, unique = true, length = 5)
    protected String name;

    @Column(name = "FULL_NAME", length = 25)
    protected String fullName;

    @Column(name = "EXT_ID")
    protected String extId;

    public void setExtId(String extId) {
        this.extId = extId;
    }

    public String getExtId() {
        return extId;
    }


    public void setCode(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getFullName() {
        return fullName;
    }


}