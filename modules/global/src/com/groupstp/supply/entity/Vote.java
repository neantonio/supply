package com.groupstp.supply.entity;

import javax.persistence.Entity;
import javax.persistence.Table;
import com.haulmont.cuba.core.entity.StandardEntity;
import com.haulmont.chile.core.annotations.NumberFormat;
import com.haulmont.cuba.security.entity.User;
import java.util.Date;
import javax.persistence.Column;
import javax.persistence.FetchType;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;
import com.haulmont.chile.core.annotations.NamePattern;

@NamePattern("%s %s %s %s|position,suggestion,weight,voteTS")
@Table(name = "SUPPLY_VOTE")
@Entity(name = "supply$Vote")
public class Vote extends StandardEntity {
    private static final long serialVersionUID = 137139076960567227L;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "POSITION_ID")
    protected QueriesPosition position;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "EMP_ID")
    protected User emp;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SUGGESTION_ID")
    protected SuppliersSuggestion suggestion;

    @NumberFormat(pattern = "#")
    @Column(name = "WEIGHT")
    protected Integer weight;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "VOTE_TS")
    protected Date voteTS;

    public void setPosition(QueriesPosition position) {
        this.position = position;
    }

    public QueriesPosition getPosition() {
        return position;
    }

    public void setEmp(User emp) {
        this.emp = emp;
    }

    public User getEmp() {
        return emp;
    }

    public void setSuggestion(SuppliersSuggestion suggestion) {
        this.suggestion = suggestion;
    }

    public SuppliersSuggestion getSuggestion() {
        return suggestion;
    }

    public void setWeight(Integer weight) {
        this.weight = weight;
    }

    public Integer getWeight() {
        return weight;
    }

    public void setVoteTS(Date voteTS) {
        this.voteTS = voteTS;
    }

    public Date getVoteTS() {
        return voteTS;
    }


}