package com.groupstp.supply.entity;

import com.haulmont.chile.core.annotations.NamePattern;
import com.haulmont.cuba.core.entity.StandardEntity;
import com.haulmont.cuba.security.entity.User;

import javax.persistence.*;
import javax.validation.constraints.NotNull;

@NamePattern("%s|user")
@Table(name = "SUPPLY_EMPLOYEE")
@Entity(name = "supply$Employee")
public class Employee extends StandardEntity {
    private static final long serialVersionUID = 5671927317455342079L;

    @NotNull
    @OneToOne(fetch = FetchType.LAZY, optional = false,cascade = CascadeType.PERSIST)
    @JoinColumn(name = "USER_ID", unique = true)
    protected User user;

    public void setUser(User user) {
        this.user = user;
    }

    public User getUser() {
        return user;
    }


}