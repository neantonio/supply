package com.groupstp.supply.entity;

import javax.persistence.Entity;
import javax.persistence.Table;
import com.haulmont.cuba.core.entity.StandardEntity;
import com.haulmont.cuba.core.entity.annotation.Lookup;
import com.haulmont.cuba.core.entity.annotation.LookupType;
import javax.persistence.FetchType;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Column;
import javax.validation.constraints.NotNull;

@Table(name = "SUPPLY_STAGE_TERM")
@Entity(name = "supply$StageTerm")
public class StageTerm extends StandardEntity {
    private static final long serialVersionUID = -3901723328727010134L;

    @Lookup(type = LookupType.DROPDOWN, actions = {"lookup", "open", "clear"})
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "URGENCY_ID")
    protected Urgency urgency;

    @NotNull
    @Column(name = "STAGE", nullable = false)
    protected String stage;

    @Column(name = "TIME_")
    protected Integer time;

    public void setStage(Stages stage) {
        this.stage = stage == null ? null : stage.getId();
    }

    public Stages getStage() {
        return stage == null ? null : Stages.fromId(stage);
    }

    public void setTime(Integer time) {
        this.time = time;
    }

    public Integer getTime() {
        return time;
    }


    public void setUrgency(Urgency urgency) {
        this.urgency = urgency;
    }

    public Urgency getUrgency() {
        return urgency;
    }


}