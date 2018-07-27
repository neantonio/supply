package com.groupstp.supply.entity;

import javax.persistence.Entity;
import javax.persistence.Table;
import javax.persistence.Column;
import com.haulmont.cuba.core.entity.StandardEntity;
import com.haulmont.chile.core.annotations.NamePattern;

@NamePattern("%s|name")
@Table(name = "SUPPLY_SUPPLIERS")
@Entity(name = "supply$Suppliers")
public class Suppliers extends StandardEntity {
    private static final long serialVersionUID = 5815313248598293563L;

    @Column(name = "NAME", length = 50)
    protected String name;

    @Column(name = "EMAIL")
    protected String email;

    @Column(name = "FULL_NAME")
    protected String fullName;

    public void setEmail(String email) {
        this.email = email;
    }

    public String getEmail() {
        return email;
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