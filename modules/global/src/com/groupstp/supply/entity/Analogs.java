package com.groupstp.supply.entity;

import javax.persistence.Entity;
import javax.persistence.Table;
import com.haulmont.cuba.core.entity.StandardEntity;
import javax.persistence.FetchType;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.OneToOne;

@Table(name = "SUPPLY_ANALOGS")
@Entity(name = "supply$Analogs")
public class Analogs extends StandardEntity {
    private static final long serialVersionUID = -8431851887385452986L;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "NOMENCLATURE_ID")
    protected Nomenclature nomenclature;

    @OneToOne(fetch = FetchType.LAZY)
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