package com.groupstp.supply.entity;

import com.haulmont.chile.core.annotations.Composition;
import com.haulmont.chile.core.annotations.NamePattern;
import com.haulmont.chile.core.annotations.NumberFormat;
import com.haulmont.cuba.core.entity.StandardEntity;
import com.haulmont.cuba.core.entity.annotation.OnDelete;
import com.haulmont.cuba.core.global.DeletePolicy;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import java.util.Date;
import java.util.List;

@NamePattern("%s|number")
@Table(name = "SUPPLY_DELIVERY")
@Entity(name = "supply$Delivery")
public class Delivery extends StandardEntity {
    private static final long serialVersionUID = 3780047380386544178L;

    @Temporal(TemporalType.DATE)
    @NotNull
    @Column(name = "DELIVERY_PLAN", nullable = false)
    protected Date deliveryPlan;

    @NotNull
    @Column(name = "NUMBER_", nullable = false, length = 20)
    protected String number;

    @NumberFormat(pattern = "########.###")
    @NotNull
    @Column(name = "QUANTITY", nullable = false)
    protected Double quantity;

    @Composition
    @OnDelete(DeletePolicy.CASCADE)
    @OneToMany(mappedBy = "delivery")
    protected List<DeliveryLine> deliveryLine;

    @OneToOne(fetch = FetchType.LAZY, mappedBy = "delivery")
    protected QueriesPosition queriesPosition;

    public void setDeliveryLine(List<DeliveryLine> deliveryLine) {
        this.deliveryLine = deliveryLine;
    }

    public List<DeliveryLine> getDeliveryLine() {
        return deliveryLine;
    }


    public void setDeliveryPlan(Date deliveryPlan) {
        this.deliveryPlan = deliveryPlan;
    }

    public Date getDeliveryPlan() {
        return deliveryPlan;
    }


    public void setQueriesPosition(QueriesPosition queriesPosition) {
        this.queriesPosition = queriesPosition;
    }

    public QueriesPosition getQueriesPosition() {
        return queriesPosition;
    }


    public void setNumber(String number) {
        this.number = number;
    }

    public String getNumber() {
        return number;
    }


    public void setQuantity(Double quantity) {
        this.quantity = quantity;
    }

    public Double getQuantity() {
        return quantity;
    }



}