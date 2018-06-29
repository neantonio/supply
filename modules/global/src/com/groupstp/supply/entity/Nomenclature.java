package com.groupstp.supply.entity;

import com.haulmont.chile.core.annotations.Composition;
import com.haulmont.chile.core.annotations.NamePattern;
import com.haulmont.cuba.core.entity.StandardEntity;
import com.haulmont.cuba.core.entity.annotation.Lookup;
import com.haulmont.cuba.core.entity.annotation.LookupType;
import com.haulmont.cuba.core.entity.annotation.OnDelete;
import com.haulmont.cuba.core.entity.annotation.OnDeleteInverse;
import com.haulmont.cuba.core.global.DeletePolicy;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

@NamePattern("%s|name")
@Table(name = "SUPPLY_NOMENCLATURE")
@Entity(name = "supply$Nomenclature")
public class Nomenclature extends StandardEntity {
    private static final long serialVersionUID = 2677217669153063186L;

    @NotNull
    @Column(name = "NAME", nullable = false, unique = true, length = 50)
    protected String name;

    @Column(name = "ISGROUP")
    protected Boolean isgroup;

    @Column(name = "FULL_NAME")
    protected String fullName;

    @Column(name = "ARTICLE", unique = true, length = 25)
    protected String article;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "UNIT_ID")
    protected MeasureUnits unit;

    @Lookup(type = LookupType.SCREEN, actions = {"lookup", "open", "clear"})
    @OnDeleteInverse(DeletePolicy.CASCADE)
    @ManyToOne(fetch = FetchType.LAZY,cascade = CascadeType.PERSIST)
    @JoinColumn(name = "PARENT_ID")
    protected Nomenclature parent;

    @Column(name = "WEIGHT", precision = 10, scale = 3)
    protected BigDecimal weight;

    @Column(name = "DIMENSIONS", length = 30)
    protected String dimensions;

    @Composition
    @OnDelete(DeletePolicy.CASCADE)
    @OneToMany(mappedBy = "nomenclature",cascade = CascadeType.PERSIST)
    protected List<Analogs> analogs;

    @OneToOne(fetch = FetchType.LAZY, mappedBy = "analog")
    protected Analogs analogss;

    public void setAnalogss(Analogs analogss) {
        this.analogss = analogss;
    }

    public Analogs getAnalogss() {
        return analogss;
    }


    public List<Analogs> getAnalogs() {
        return analogs;
    }

    public void setAnalogs(List<Analogs> analogs) {
        this.analogs = analogs;
    }



    public void setIsgroup(Boolean isgroup) {
        this.isgroup = isgroup;
    }

    public Boolean getIsgroup() {
        return isgroup;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getFullName() {
        return fullName;
    }

    public void setArticle(String article) {
        this.article = article;
    }

    public String getArticle() {
        return article;
    }

    public void setUnit(MeasureUnits unit) {
        this.unit = unit;
    }

    public MeasureUnits getUnit() {
        return unit;
    }

    public void setParent(Nomenclature parent) {
        this.parent = parent;
    }

    public Nomenclature getParent() {
        return parent;
    }

    public void setWeight(BigDecimal weight) {
        this.weight = weight;
    }

    public BigDecimal getWeight() {
        return weight;
    }

    public void setDimensions(String dimensions) {
        this.dimensions = dimensions;
    }

    public String getDimensions() {
        return dimensions;
    }


    public void setName(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }


}