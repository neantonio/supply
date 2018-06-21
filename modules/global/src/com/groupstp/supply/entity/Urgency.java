package com.groupstp.supply.entity;

import javax.persistence.Entity;
import javax.persistence.Table;
import com.haulmont.cuba.core.entity.StandardEntity;
import javax.persistence.Column;
import javax.validation.constraints.NotNull;
import com.haulmont.chile.core.annotations.NamePattern;
import com.haulmont.chile.core.annotations.Composition;
import com.haulmont.cuba.core.entity.annotation.OnDelete;
import com.haulmont.cuba.core.global.DeletePolicy;
import java.util.List;
import javax.persistence.OneToMany;

@NamePattern("%s|name")
@Table(name = "SUPPLY_URGENCY")
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