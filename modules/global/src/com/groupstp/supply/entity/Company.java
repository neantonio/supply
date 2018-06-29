package com.groupstp.supply.entity;

import javax.persistence.Entity;
import javax.persistence.Table;
import javax.persistence.Column;
import javax.validation.constraints.NotNull;
import com.haulmont.cuba.core.entity.StandardEntity;
import com.haulmont.chile.core.annotations.NamePattern;

@NamePattern("%s|name")
@Table(name = "SUPPLY_COMPANY")
@Entity(name = "supply$Company")
public class Company extends StandardEntity {
    private static final long serialVersionUID = 4213829477306091280L;

    @NotNull
    @Column(name = "NAME", nullable = false, unique = true, length = 25)
    protected String name;

    @Column(name = "FULL_NAME")
    protected String fullName;

    @NotNull
    @Column(name = "INN", nullable = false, length = 13)
    protected String inn;

    @Column(name = "KPP", length = 13)
    protected String kpp;

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

    public void setInn(String inn) {
        this.inn = inn;
    }

    public String getInn() {
        return inn;
    }

    public void setKpp(String kpp) {
        this.kpp = kpp;
    }

    public String getKpp() {
        return kpp;
    }


}