package com.groupstp.supply.entity;

import javax.persistence.Entity;
import javax.persistence.Table;
import javax.persistence.Column;
import javax.validation.constraints.NotNull;
import com.haulmont.cuba.core.entity.StandardEntity;
import com.haulmont.chile.core.annotations.NamePattern;

@NamePattern("%s|name")
@Table(name = "SUPPLY_NOMENCLATURE")
@Entity(name = "supply$Nomenclature")
public class Nomenclature extends StandardEntity {
    private static final long serialVersionUID = 2677217669153063186L;

    @NotNull
    @Column(name = "NAME", nullable = false, unique = true, length = 50)
    protected String name;

    public void setName(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }


}