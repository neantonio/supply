package com.groupstp.supply.entity;

import com.haulmont.chile.core.annotations.Composition;
import com.haulmont.cuba.core.entity.StandardEntity;

import javax.persistence.*;

@Table(name = "SUPPLY_ANALOGS")
@Entity(name = "supply$Analogs")
public class Analogs extends StandardEntity {
    private static final long serialVersionUID = -8431851887385452986L;

    @Composition
    @ManyToOne(fetch = FetchType.LAZY,cascade = CascadeType.PERSIST)
    @JoinColumn(name = "NOMENCLATURE_ID")
    protected Nomenclature nomenclature;

    @Composition
    @OneToOne(fetch = FetchType.LAZY,cascade = CascadeType.PERSIST)
    @JoinColumn(name = "ANALOG_ID")
    protected Nomenclature analog;

    public void setAnalog(Nomenclature analog) {
        this.analog = analog;
    }

    public Nomenclature getAnalog() {
        return analog;
    }


    public void setNomenclature(Nomenclature nomenclature) {
        this.nomenclature = nomenclature;
    }

    public Nomenclature getNomenclature() {
        return nomenclature;
    }


}