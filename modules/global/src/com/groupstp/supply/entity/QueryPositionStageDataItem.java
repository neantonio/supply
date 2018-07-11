package com.groupstp.supply.entity;

import javax.persistence.Entity;
import javax.persistence.Table;
import javax.persistence.Column;
import com.haulmont.cuba.core.entity.StandardEntity;
import com.haulmont.chile.core.annotations.NamePattern;
import com.haulmont.cuba.core.entity.annotation.OnDelete;
import com.haulmont.cuba.core.entity.annotation.OnDeleteInverse;
import com.haulmont.cuba.core.global.DeletePolicy;
import javax.persistence.FetchType;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import com.haulmont.cuba.security.entity.User;

/**
 * @author AntonLomako
 * класс нужен для хранения данных на этапах workflow
 *
 */
@NamePattern("%s %s|itemType,itemValue")
@Table(name = "SUPPLY_QUERY_POSITION_STAGE_DATA_ITEM")
@Entity(name = "supply$QueryPositionStageDataItem")
public class QueryPositionStageDataItem extends StandardEntity {
    private static final long serialVersionUID = -3968312349353172124L;

    @Column(name = "ITEM_NAME")
    protected String itemName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "QUERY_POSITION_STAGE_DATA_ID")
    protected QueryPositionStageData queryPositionStageData;

    @OnDeleteInverse(DeletePolicy.UNLINK)
    @OnDelete(DeletePolicy.UNLINK)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "USER_ID")
    protected User user;

    @Column(name = "ITEM_TYPE")
    protected String itemType;

    @Column(name = "ITEM_VALUE")
    protected String itemValue;

    public void setQueryPositionStageData(QueryPositionStageData queryPositionStageData) {
        this.queryPositionStageData = queryPositionStageData;
    }

    public QueryPositionStageData getQueryPositionStageData() {
        return queryPositionStageData;
    }


    public void setUser(User user) {
        this.user = user;
    }

    public User getUser() {
        return user;
    }




    public void setItemName(String itemName) {
        this.itemName = itemName;
    }

    public String getItemName() {
        return itemName;
    }

    public void setItemType(String itemType) {
        this.itemType = itemType;
    }

    public String getItemType() {
        return itemType;
    }

    public void setItemValue(String itemValue) {
        this.itemValue = itemValue;
    }

    public String getItemValue() {
        return itemValue;
    }






}