package com.groupstp.supply.entity;

import com.haulmont.chile.core.annotations.MetaClass;
import com.haulmont.chile.core.annotations.MetaProperty;
import com.haulmont.chile.core.annotations.NamePattern;
import com.haulmont.cuba.core.entity.BaseUuidEntity;

import java.util.Date;


/**
 * @author AlexandrMiroshkin
 * Not persistent класс
 * Элемент таблицы платежей
 */

@NamePattern("%s|id")
@MetaClass(name = "supply$PaymentTableItem")
public class PaymentTableItem extends BaseUuidEntity {
    private static final long serialVersionUID = 6328734404801975977L;

    @MetaProperty
    protected Query query;

    @MetaProperty
    protected String position;

    @MetaProperty
    protected Bills bills;

    @MetaProperty
    protected Double firstDecade;

    @MetaProperty
    protected Double secondDecade;

    @MetaProperty
    protected Double thirdDecade;

    @MetaProperty
    protected Date timePayment;

    @MetaProperty
    protected Double price;


    public void setPosition(String position) {
        this.position = position;
    }

    public String getPosition() {
        return position;
    }


    public Date getTimePayment() {
        return timePayment;
    }

    public void setFirstDecade(Double firstDecade) {
        this.firstDecade = firstDecade;
    }

    public Double getFirstDecade() {
        return firstDecade;
    }

    public void setSecondDecade(Double secondDecade) {
        this.secondDecade = secondDecade;
    }

    public Double getSecondDecade() {
        return secondDecade;
    }

    public Double getThirdDecade() {
        return thirdDecade;
    }

    public void setThirdDecade(Double thirdDecade) {
        this.thirdDecade = thirdDecade;
    }

    public Date getPayDate() {
        return timePayment;
    }

    public void setPayDate(Date payDate) {
        this.timePayment = payDate;
    }

    public Query getQuery() {
        return query;
    }

    public Bills getBills() {
        return bills;
    }

    public void setQuery(Query query) {
        this.query = query;
    }

    public void setBills(Bills bills) {
        this.bills = bills;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }
}