package com.groupstp.supply.entity;

import com.haulmont.chile.core.annotations.NamePattern;
import com.haulmont.chile.core.annotations.NumberFormat;
import com.haulmont.cuba.core.entity.FileDescriptor;
import com.haulmont.cuba.core.entity.StandardEntity;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import com.haulmont.chile.core.annotations.NumberFormat;
import java.util.Date;
import java.util.List;
import com.haulmont.chile.core.annotations.NamePattern;

@NamePattern("%s|number")
@Table(name = "SUPPLY_BILLS")
@Entity(name = "supply$Bills")
public class Bills extends StandardEntity {
    private static final long serialVersionUID = -1875930219029602786L;

    @NotNull
    @Column(name = "NUMBER_", nullable = false, unique = true, length = 20)
    protected String number;

    @Column(name = "PRICE")
    protected Double price;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "COMPANY_ID")
    protected Company company;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "SUPPLIER_ID")
    protected Suppliers supplier;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "TIME_PAYMENT")
    protected Date timePayment;

    @NumberFormat(pattern = "#########.##")
    @Column(name = "AMOUNT")
    protected Double amount;

    @Column(name = "SUM_CONTROL")
    protected Boolean sumControl;

    @OneToMany(mappedBy = "bills")
    protected List<QueriesPosition> positions;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "IMAGE_BILL_ID")
    protected FileDescriptor imageBill;

    public void setPrice(Double price) {
        this.price = price;
    }

    public Double getPrice() {
        return price;
    }


    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public Double getAmount() {
        return amount;
    }

    public void setImageBill(FileDescriptor imageBill) {
        this.imageBill = imageBill;
    }

    public FileDescriptor getImageBill() {
        return imageBill;
    }

    public void setCompany(Company company) {
        this.company = company;
    }

    public Company getCompany() {
        return company;
    }

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

    public void setNumber(String number) {
        this.number = number;
    }

    public String getNumber() {
        return number;
    }


}