package com.groupstp.supply.entity;

import com.haulmont.chile.core.annotations.Composition;
import com.haulmont.chile.core.annotations.NamePattern;
import com.haulmont.cuba.core.entity.StandardEntity;
import com.haulmont.cuba.core.entity.annotation.OnDelete;
import com.haulmont.cuba.core.global.DeletePolicy;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import java.util.List;

@NamePattern("%s|name")
@Table(name = "SUPPLY_URGENCY", uniqueConstraints = {
    @UniqueConstraint(name = "IDX_SUPPLY_URGENCY_UNQ", columnNames = {"EXT_ID"})
})
@Entity(name = "supply$Urgency")
public class Urgency extends StandardEntity {
    private static final long serialVersionUID = -7847872795858658356L;

    @NotNull
    @Column(name = "NAME", nullable = false, unique = true, length = 25)
    protected String name;

    @Composition
    @OnDelete(DeletePolicy.CASCADE)
    @OneToMany(mappedBy = "urgency")
    protected List<StageTerm> stageTerm;

    @Column(name = "EXT_ID")
    protected String extId;

    public void setExtId(String extId) {
        this.extId = extId;
    }

    public String getExtId() {
        return extId;
    }


    public void setStageTerm(List<StageTerm> stageTerm) {
        this.stageTerm = stageTerm;
    }

    public List<StageTerm> getStageTerm() {
        return stageTerm;
    }


    public void setName(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }


}