package com.groupstp.supply.entity;

import com.haulmont.chile.core.annotations.NamePattern;
import com.haulmont.cuba.core.entity.StandardEntity;
import com.haulmont.cuba.security.entity.User;

import javax.persistence.*;

@NamePattern("%s %s|name,user")
@Table(name = "SUPPLY_EMPLOYEE", uniqueConstraints = {
    @UniqueConstraint(name = "IDX_SUPPLY_EMPLOYEE_UNQ", columnNames = {"EXT_ID"})
})
@Entity(name = "supply$Employee")
public class Employee extends StandardEntity {
    private static final long serialVersionUID = 5671927317455342079L;

    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.PERSIST)
    @JoinColumn(name = "USER_ID", unique = true)
    protected User user;

    @Column(name = "POSITION_")
    protected String position;

    @Column(name = "EMAIL")
    protected String email;

    @Column(name = "NAME", length = 50)
    protected String name;

    @Column(name = "FULL_NAME")
    protected String fullName;

    @Column(name = "EXT_ID")
    protected String extId;

    public void setPosition(String position) {
        this.position = position;
    }

    public String getPosition() {
        return position;
    }


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

    public void setExtId(String extId) {
        this.extId = extId;
    }

    public String getExtId() {
        return extId;
    }


    public void setUser(User user) {
        this.user = user;
    }

    public User getUser() {
        return user;
    }


}