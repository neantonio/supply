package com.groupstp.supply.entity;

import javax.persistence.Entity;
import javax.persistence.Table;
import javax.persistence.FetchType;
import javax.persistence.JoinColumn;
import javax.persistence.OneToOne;
import javax.validation.constraints.NotNull;
import javax.xml.crypto.Data;

import com.haulmont.cuba.core.app.DataService;
import com.haulmont.cuba.core.entity.StandardEntity;
import com.haulmont.chile.core.annotations.NamePattern;
import com.haulmont.cuba.core.global.AppBeans;
import com.haulmont.cuba.core.global.DataManager;
import com.haulmont.cuba.core.global.LoadContext;

import java.util.List;
import javax.persistence.Column;

@NamePattern("%s %s|position,supplier")
@Table(name = "SUPPLY_POSITION_SUPPLIER")
@Entity(name = "supply$PositionSupplier")
public class PositionSupplier extends StandardEntity {
    private static final long serialVersionUID = 7449234047310290573L;

    @NotNull
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "POSITION_ID")
    protected QueriesPosition position;

    @Column(name = "SUGGESTION_REQUEST_SEND")
    protected Boolean suggestionRequestSend=false;

    @Column(name = "SELECTED")
    protected Boolean selected;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SUPPLIER_ID")
    protected Suppliers supplier;


    public void setSuggestionRequestSend(Boolean suggestionRequestSend) {
        this.suggestionRequestSend = suggestionRequestSend;
    }

    public Boolean getSuggestionRequestSend() {
        return suggestionRequestSend;
    }


    public void setSelected(Boolean selected) {
        this.selected = selected;
    }

    public Boolean getSelected() {
        return selected;
    }


    public void setPosition(QueriesPosition position) {
        this.position = position;
    }

    public QueriesPosition getPosition() {
        return position;
    }

    public void setSupplier(Suppliers supplier) {
        this.supplier = supplier;
    }

    public Suppliers getSupplier() {
        return supplier;
    }

    static public PositionSupplier getPositionSupplier(QueriesPosition p, Suppliers s)
    {
        LoadContext<PositionSupplier> ctx = LoadContext.create(PositionSupplier.class).setQuery(
            LoadContext.createQuery("select q from supply$PositionSupplier q where q.position.id=:position" +
                    " AND q.supplier.id=:supplier")
                .setParameter("position", p)
                .setParameter("supplier", s));
        DataManager dataManager = AppBeans.get(DataManager.class);
        List<PositionSupplier> l = dataManager.loadList(ctx);
        return  l.size()>0 ? l.get(0) : null;
    }
}