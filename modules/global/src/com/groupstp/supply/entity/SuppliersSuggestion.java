package com.groupstp.supply.entity;

import com.haulmont.chile.core.annotations.NamePattern;
import com.haulmont.chile.core.annotations.NumberFormat;
import com.haulmont.cuba.core.entity.StandardEntity;
import com.haulmont.cuba.core.global.AppBeans;
import com.haulmont.cuba.core.global.Messages;

import javax.persistence.*;
import javax.validation.constraints.NotNull;

@NamePattern("#displayString|posSup,quantity,price,term,supAddress")
@Table(name = "SUPPLY_SUPPLIERS_SUGGESTION")
@Entity(name = "supply$SuppliersSuggestion")
public class SuppliersSuggestion extends StandardEntity {
    private static final long serialVersionUID = -6857268609417535796L;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "POS_SUP_ID")
    protected PositionSupplier posSup;

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
        String msg = msgs.getMessage(getClass(), "Price: %10.2f; Term: %d; Quantity: %d; Address: %s");
        msg = msgs.formatMessage(getClass(), msg, price, term, quantity, supAddress);
        return msg;
    }

}