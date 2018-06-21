package com.groupstp.supply.entity;

import javax.persistence.Entity;
import javax.persistence.Table;
import javax.persistence.FetchType;
import javax.persistence.JoinColumn;
import javax.persistence.OneToOne;
import com.haulmont.cuba.core.entity.StandardEntity;
import com.haulmont.chile.core.annotations.NamePattern;
import javax.persistence.ManyToOne;

@NamePattern("%s|analog")
@Table(name = "SUPPLY_POSITIONS_ANALOGS")
@Entity(name = "supply$PositionsAnalogs")
public class PositionsAnalogs extends StandardEntity {
    private static final long serialVersionUID = 3744811337229095930L;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ANALOG_ID")
    protected Nomenclature analog;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "QUERIES_POSITION_ID")
    protected QueriesPosition queriesPosition;

    public void setQueriesPosition(QueriesPosition queriesPosition) {
        this.queriesPosition = queriesPosition;
    }

    public QueriesPosition getQueriesPosition() {
        return queriesPosition;
    }


    public void setAnalog(Nomenclature analog) {
        this.analog = analog;
    }

    public Nomenclature getAnalog() {
        return analog;
    }


}