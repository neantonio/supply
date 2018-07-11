package com.groupstp.supply.entity;

import javax.persistence.*;

import com.haulmont.cuba.core.entity.annotation.OnDelete;
import com.haulmont.cuba.core.entity.annotation.OnDeleteInverse;
import com.haulmont.cuba.core.global.DeletePolicy;
import com.haulmont.cuba.core.entity.StandardEntity;
import java.util.List;

@Table(name = "SUPPLY_QUERY_POSITION_STAGE_DATA")
@Entity(name = "supply$QueryPositionStageData")
public class QueryPositionStageData extends StandardEntity {
    private static final long serialVersionUID = 743333483017336919L;

    @OnDeleteInverse(DeletePolicy.CASCADE)
    @OnDelete(DeletePolicy.UNLINK)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "POSITION_ID")
    protected QueriesPosition position;

    @JoinTable(name = "SUPPLY_QUERY_POSITION_STAGE_DATA_ITEM_LINK",
        joinColumns = @JoinColumn(name = "QUERY_POSITION_STAGE_DATA_ID"),
        inverseJoinColumns = @JoinColumn(name = "QUERY_POSITION_STAGE_DATA_ITEM_ID"))
    @ManyToMany(cascade = CascadeType.PERSIST)
    @OnDeleteInverse(DeletePolicy.UNLINK)
    @OnDelete(DeletePolicy.CASCADE)
    protected List<QueryPositionStageDataItem> dataItems;

    @Column(name = "STAGE")
    protected String stage;

    public void setDataItems(List<QueryPositionStageDataItem> dataItems) {
        this.dataItems = dataItems;
    }

    public List<QueryPositionStageDataItem> getDataItems() {
        return dataItems;
    }


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


}