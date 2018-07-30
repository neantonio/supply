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

    @Column(name = "FULL_NAME")
    protected String fullName;

    @Column(name = "INN", length = 50)
    protected String inn;

    @Column(name = "CONTACTS")
    protected String contacts;

    @Column(name = "EMAIL")
    protected String email;

    @Column(name = "COMMENTS")
    protected String comments;

    public void setInn(String inn) {
        this.inn = inn;
    }

    public String getInn() {
        return inn;
    }

    public void setContacts(String contacts) {
        this.contacts = contacts;
    }

    public String getContacts() {
        return contacts;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getEmail() {
        return email;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }

    public String getComments() {
        return comments;
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