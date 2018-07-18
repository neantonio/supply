package com.groupstp.supply.entity;

import com.haulmont.chile.core.annotations.NumberFormat;
import com.haulmont.cuba.core.entity.StandardEntity;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import java.util.Date;

@Table(name = "SUPPLY_DELIVERY_LINE")
@Entity(name = "supply$DeliveryLine")
public class DeliveryLine extends StandardEntity {
    private static final long serialVersionUID = 3917748063260470058L;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DELIVERY_ID")
    protected Delivery delivery;

    @NumberFormat(pattern = "#######.###")
    @NotNull
    @Column(name = "QUANTITY", nullable = false)
    protected Double quantity;

    @Temporal(TemporalType.DATE)
    @NotNull
    @Column(name = "DELIVERY_DAY", nullable = false)
    protected Date deliveryDay;

    public void setQuantity(Double quantity) {
        this.quantity = quantity;
    }

    public Double getQuantity() {
        return quantity;
    }

    public void setDeliveryDay(Date deliveryDay) {
        this.deliveryDay = deliveryDay;
    }

    public Date getDeliveryDay() {
        return deliveryDay;
    }


    public void setDelivery(Delivery delivery) {
        this.delivery = delivery;
    }

    public Delivery getDelivery() {
        return delivery;
    }


}