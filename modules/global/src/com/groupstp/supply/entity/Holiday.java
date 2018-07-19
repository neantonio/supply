package com.groupstp.supply.entity;

import javax.persistence.Entity;
import javax.persistence.Table;
import java.util.Date;
import javax.persistence.Column;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;
import javax.validation.constraints.NotNull;
import com.haulmont.cuba.core.entity.StandardEntity;
import com.haulmont.chile.core.annotations.NamePattern;

@NamePattern("%s|day")
@Table(name = "SUPPLY_HOLIDAY")
@Entity(name = "supply$Holiday")
public class Holiday extends StandardEntity {
    private static final long serialVersionUID = -6943356798328246235L;

    @Temporal(TemporalType.DATE)
    @NotNull
    @Column(name = "DAY_", nullable = false, unique = true)
    protected Date day;

    @NotNull
    @Column(name = "WORKING_HOURS", nullable = false)
    protected Integer workingHours;

    public void setDay(Date day) {
        this.day = day;
    }

    public Date getDay() {
        return day;
    }

    public void setWorkingHours(Integer workingHours) {
        this.workingHours = workingHours;
    }

    public Integer getWorkingHours() {
        return workingHours;
    }


}