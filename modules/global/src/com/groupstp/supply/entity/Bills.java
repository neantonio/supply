package com.groupstp.supply.entity;

import javax.persistence.Entity;
import javax.persistence.Table;
import com.haulmont.cuba.core.entity.StandardEntity;
import javax.persistence.Column;
import javax.validation.constraints.NotNull;
import com.haulmont.chile.core.annotations.NumberFormat;
import java.util.Date;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;
import java.util.List;
import javax.persistence.OneToMany;
import javax.persistence.FetchType;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;

@Table(name = "SUPPLY_BILLS")
@Entity(name = "supply$Bills")
public class Bills extends StandardEntity {
    private static final long serialVersionUID = -1875930219029602786L;

    @NotNull
    @Column(name = "NUMBER_", nullable = false, unique = true, length = 20)
    protected String number;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "SUPPLIER_ID")
    protected Suppliers supplier;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "TIME_PAYMENT")
    protected Date timePayment;

    @NumberFormat(pattern = "#########.##")
    @Column(name = "PRICE")
    protected Double price;

    @Column(name = "SUM_CONTROL")
    protected Boolean sumControl;

    @OneToMany(mappedBy = "bills")
    protected List<QueriesPosition> positions;

    public void setSupplier(Suppliers supplier) {
        this.supplier = supplier;
    }

    public Suppliers getSupplier() {
        return supplier;
    }


    public void setPositions(List<QueriesPosition> positions) {
        this.positions = positions;
    }

    public List<QueriesPosition> getPositions() {
        return positions;
    }


    public void setSumControl(Boolean sumControl) {
        this.sumControl = sumControl;
    }

    public Boolean getSumControl() {
        return sumControl;
    }


    public void setTimePayment(Date timePayment) {
        this.timePayment = timePayment;
    }

    public Date getTimePayment() {
        return timePayment;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public Double getPrice() {
        return price;
    }


    public void setNumber(String number) {
        this.number = number;
    }

    public String getNumber() {
        return number;
    }


}