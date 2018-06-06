package com.groupstp.supply.entity;

import javax.persistence.Entity;
import javax.persistence.Table;
import java.util.Date;
import javax.persistence.Column;
import javax.persistence.Lob;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;
import javax.validation.constraints.NotNull;
import com.haulmont.chile.core.annotations.MetaProperty;
import javax.persistence.Transient;
import com.haulmont.cuba.core.entity.StandardEntity;
import com.haulmont.chile.core.annotations.NamePattern;
import javax.persistence.FetchType;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import com.haulmont.cuba.core.entity.annotation.Lookup;
import com.haulmont.cuba.core.entity.annotation.LookupType;
import com.haulmont.cuba.security.entity.User;
import com.haulmont.cuba.core.entity.annotation.OnDelete;
import com.haulmont.cuba.core.global.DeletePolicy;
import java.util.List;
import javax.persistence.OneToMany;

@NamePattern("#getQueryName|number,timeCreation")
@Table(name = "SUPPLY_QUERY")
@Entity(name = "supply$Query")
public class Query extends StandardEntity {
    private static final long serialVersionUID = -4851885001969302872L;

    @Column(name = "IN_WORK")
    protected Boolean inWork;

    @NotNull
    @Column(name = "NUMBER_", nullable = false, unique = true, length = 20)
    protected String number;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "TIME_CREATION")
    protected Date timeCreation;

    @Lob
    @Column(name = "COMMENT_")
    protected String comment;

    @NotNull
    @Lookup(type = LookupType.DROPDOWN, actions = {"lookup", "open", "clear"})
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "URGENCY_ID")
    protected Urgency urgency;

    @Lookup(type = LookupType.DROPDOWN, actions = {"lookup", "open", "clear"})
    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "WORKFLOW_ID")
    protected QueryWorkflow workflow;

    @NotNull
    @Column(name = "ORIGIN", nullable = false)
    protected String origin;

    @NotNull
    @Column(name = "CAUSE", nullable = false)
    protected String cause;

    @NotNull
    @Column(name = "PERIDIOCITY", nullable = false)
    protected String peridiocity;

    @Column(name = "WHOLE_QUERY_WORKOUT")
    protected Boolean wholeQueryWorkout;

    @Lookup(type = LookupType.DROPDOWN, actions = {"lookup", "open", "clear"})
    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "COMPANY_ID")
    protected Company company;

    @Lookup(type = LookupType.DROPDOWN, actions = {"lookup", "open", "clear"})
    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "DIVISION_ID")
    protected Division division;

    @Lookup(type = LookupType.DROPDOWN, actions = {"lookup", "open", "clear"})
    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "STORE_ID")
    protected Store store;

    @Lookup(type = LookupType.DROPDOWN, actions = {"lookup", "clear"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CONTACT_ID")
    protected User contact;

    @OnDelete(DeletePolicy.CASCADE)
    @OneToMany(mappedBy = "query")
    protected List<QueriesPosition> positions;

    public void setInWork(Boolean inWork) {
        this.inWork = inWork;
    }

    public Boolean getInWork() {
        return inWork;
    }


    public void setPositions(List<QueriesPosition> positions) {
        this.positions = positions;
    }

    public List<QueriesPosition> getPositions() {
        return positions;
    }


    public void setContact(User contact) {
        this.contact = contact;
    }

    public User getContact() {
        return contact;
    }


    public void setStore(Store store) {
        this.store = store;
    }

    public Store getStore() {
        return store;
    }


    public void setWholeQueryWorkout(Boolean wholeQueryWorkout) {
        this.wholeQueryWorkout = wholeQueryWorkout;
    }

    public Boolean getWholeQueryWorkout() {
        return wholeQueryWorkout;
    }

    public void setCompany(Company company) {
        this.company = company;
    }

    public Company getCompany() {
        return company;
    }

    public void setDivision(Division division) {
        this.division = division;
    }

    public Division getDivision() {
        return division;
    }


    public Peridiocities getPeridiocity() {
        return peridiocity == null ? null : Peridiocities.fromId(peridiocity);
    }

    public void setPeridiocity(Peridiocities peridiocity) {
        this.peridiocity = peridiocity == null ? null : peridiocity.getId();
    }



    public Causes getCause() {
        return cause == null ? null : Causes.fromId(cause);
    }

    public void setCause(Causes cause) {
        this.cause = cause == null ? null : cause.getId();
    }



    public Origin getOrigin() {
        return origin == null ? null : Origin.fromId(origin);
    }

    public void setOrigin(Origin origin) {
        this.origin = origin == null ? null : origin.getId();
    }



    public void setWorkflow(QueryWorkflow workflow) {
        this.workflow = workflow;
    }

    public QueryWorkflow getWorkflow() {
        return workflow;
    }


    public void setUrgency(Urgency urgency) {
        this.urgency = urgency;
    }

    public Urgency getUrgency() {
        return urgency;
    }


    public void setNumber(String number) {
        this.number = number;
    }

    public String getNumber() {
        return number;
    }

    public void setTimeCreation(Date timeCreation) {
        this.timeCreation = timeCreation;
    }

    public Date getTimeCreation() {
        return timeCreation;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public String getComment() {
        return comment;
    }

    public String getQueryName()
    {
        String name = number.toString();
        try{
            name = String.format("%s %td.%tm.%ty", number, timeCreation,timeCreation,timeCreation);
        }
        catch (Exception e)
        {
            System.console().printf(e.getMessage());
        }
        return name;
    }
}