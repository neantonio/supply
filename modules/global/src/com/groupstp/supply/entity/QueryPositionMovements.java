package com.groupstp.supply.entity;

import javax.persistence.Entity;
import javax.persistence.Table;
import com.haulmont.cuba.security.entity.User;
import java.util.Date;
import javax.persistence.Column;
import javax.persistence.FetchType;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;
import javax.validation.constraints.NotNull;
import com.haulmont.cuba.core.entity.StandardEntity;

@Table(name = "SUPPLY_QUERY_POSITION_MOVEMENTS")
@Entity(name = "supply$QueryPositionMovements")
public class QueryPositionMovements extends StandardEntity {
    private static final long serialVersionUID = 1559764868812083103L;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "POSITION_ID")
    protected QueriesPosition position;

    @NotNull
    @Column(name = "STAGE", nullable = false)
    protected String stage;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "USER_ID")
    protected User user;

    public void setPosition(QueriesPosition position) {
        this.position = position;
    }

    public QueriesPosition getPosition() {
        return position;
    }

    public void setStage(Stages stage) {
        this.stage = stage == null ? null : stage.getId();
    }

    public Stages getStage() {
        return stage == null ? null : Stages.fromId(stage);
    }

    public void setUser(User user) {
        this.user = user;
    }

    public User getUser() {
        return user;
    }


}