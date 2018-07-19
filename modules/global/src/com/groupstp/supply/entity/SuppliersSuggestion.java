package com.groupstp.supply.entity;

import com.haulmont.chile.core.annotations.NamePattern;
import com.haulmont.chile.core.annotations.NumberFormat;
import com.haulmont.cuba.core.entity.StandardEntity;
import com.haulmont.cuba.core.global.AppBeans;
import com.haulmont.cuba.core.global.Messages;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import com.haulmont.cuba.core.entity.annotation.OnDeleteInverse;
import com.haulmont.cuba.core.global.DeletePolicy;

@NamePattern("#displayString|posSup,quantity,price,term,supAddress")
@Table(name = "SUPPLY_SUPPLIERS_SUGGESTION")
@Entity(name = "supply$SuppliersSuggestion")
public class SuppliersSuggestion extends StandardEntity {
    private static final long serialVersionUID = -6857268609417535796L;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "POS_SUP_ID")
    protected PositionSupplier posSup;

    @Column(name = "MANUFACTURER")
    protected String manufacturer;

    @Column(name = "PAYMENT_DEF")
    protected Integer paymentDef;

    @NotNull
    @NumberFormat(pattern = "#####.###")
    @Column(name = "QUANTITY", nullable = false)
    protected Double quantity;

    @NotNull
    @NumberFormat(pattern = "#########.##")
    @Column(name = "PRICE", nullable = false)
    protected Double price;

    @Column(name = "SUP_ADDRESS")
    protected String supAddress;

    @NotNull
    @NumberFormat(pattern = "##")
    @Column(name = "TERM", nullable = false)
    protected Integer term;

    @OnDeleteInverse(DeletePolicy.DENY)
    @OneToOne(fetch = FetchType.LAZY, mappedBy = "voteResult")
    protected QueriesPosition queriesPosition;

    public Integer getPaymentDef() {
        return paymentDef;
    }

    public void setPaymentDef(Integer paymentDef) {
        this.paymentDef = paymentDef;
    }


    public void setManufacturer(String manufacturer) {
        this.manufacturer = manufacturer;
    }

    public String getManufacturer() {
        return manufacturer;
    }


    public void setQueriesPosition(QueriesPosition queriesPosition) {
        this.queriesPosition = queriesPosition;
    }

    public QueriesPosition getQueriesPosition() {
        return queriesPosition;
    }


    public void setSupAddress(String supAddress) {
        this.supAddress = supAddress;
    }

    public String getSupAddress() {
        return supAddress;
    }

    public void setTerm(Integer term) {
        this.term = term;
    }

    public Integer getTerm() {
        return term;
    }


    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }


    public Double getQuantity() {
        return quantity;
    }

    public void setQuantity(Double quantity) {
        this.quantity = quantity;
    }


    public void setPosSup(PositionSupplier posSup) {
        this.posSup = posSup;
    }

    public PositionSupplier getPosSup() {
        return posSup;
    }

    public String displayString()
    {
        Messages msgs = AppBeans.get(Messages.class);
        String msg = msgs.getMessage( getClass(), "SuppliersSuggestion.displayString");
        msg = String.format(msg, price, term, quantity, supAddress);
        return msg;
    }

}