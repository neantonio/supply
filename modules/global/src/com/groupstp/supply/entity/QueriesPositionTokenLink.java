package com.groupstp.supply.entity;

import javax.persistence.Entity;
import javax.persistence.Table;
import com.haulmont.chile.core.annotations.Composition;
import com.haulmont.cuba.core.entity.annotation.OnDelete;
import com.haulmont.cuba.core.global.DeletePolicy;
import java.util.List;
import javax.persistence.Column;
import javax.persistence.OneToMany;
import com.haulmont.cuba.core.entity.StandardEntity;
import com.haulmont.chile.core.annotations.NamePattern;
import javax.persistence.JoinColumn;
import javax.persistence.JoinTable;
import javax.persistence.ManyToMany;
import com.haulmont.cuba.core.entity.annotation.OnDeleteInverse;
import javax.persistence.FetchType;
import javax.persistence.ManyToOne;

@NamePattern("%s|token")
@Table(name = "SUPPLY_QUERIES_POSITION_TOKEN_LINK")
@Entity(name = "supply$QueriesPositionTokenLink")
public class QueriesPositionTokenLink extends StandardEntity {
    private static final long serialVersionUID = 2262454478104776710L;

    @Column(name = "TOKEN", unique = true)
    protected String token;

    @OnDeleteInverse(DeletePolicy.CASCADE)
    @OnDelete(DeletePolicy.UNLINK)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SUPPLIER_ID")
    protected Suppliers supplier;

    @JoinTable(name = "SUPPLY_QUERIES_POSITION_TOKEN_LINK_QUERIES_POSITION_LINK",
        joinColumns = @JoinColumn(name = "QUERIES_POSITION_TOKEN_LINK_ID"),
        inverseJoinColumns = @JoinColumn(name = "QUERIES_POSITION_ID"))
    @ManyToMany
    @OnDelete(DeletePolicy.UNLINK)
    protected List<QueriesPosition> positions;

    public void setSupplier(Suppliers supplier) {
        this.supplier = supplier;
    }

    public Suppliers getSupplier() {
        return supplier;
    }


    public void setToken(String token) {
        this.token = token;
    }

    public String getToken() {
        return token;
    }

    public void setPositions(List<QueriesPosition> positions) {
        this.positions = positions;
    }

    public List<QueriesPosition> getPositions() {
        return positions;
    }


}