package com.groupstp.supply.entity;

import javax.persistence.Entity;
import javax.persistence.Table;
import javax.persistence.Column;
import javax.validation.constraints.NotNull;
import com.haulmont.cuba.core.entity.StandardEntity;
import com.haulmont.chile.core.annotations.NamePattern;

import java.lang.reflect.Field;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import javax.persistence.FetchType;
import javax.persistence.JoinColumn;
import javax.persistence.OneToOne;
import java.math.BigDecimal;
import java.util.Date;
import java.util.stream.Collectors;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;
import javax.persistence.Lob;

@NamePattern("%s|key")
@Table(name = "SUPPLY_SETTINGS")
@Entity(name = "supply$Settings")
public class Settings extends StandardEntity {
    private static final long serialVersionUID = -795776409239914344L;

    @NotNull
    @Column(name = "KEY_", nullable = false, unique = true, length = 50)
    protected String key;

    @Lob
    @Column(name = "SAVED_OBJECT")
    protected String savedObject;


























    @Lob
    @Column(name = "SAVED_ENUM")
    protected String savedEnum;

    @Column(name = "TEXT", length = 50)
    protected String text;

    @Column(name = "BOOLEAN_VALUE")
    protected Boolean booleanValue;


    @Column(name = "BIG_DECIMAL_VALUE")
    protected BigDecimal bigDecimalValue;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "DATE_TIME_VALUE")
    protected Date dateTimeValue;

    @Temporal(TemporalType.DATE)
    @Column(name = "DATE_VALUE")
    protected Date dateValue;

    @Column(name = "DOUBLE_VALUE")
    protected Double doubleValue;

    @Column(name = "INTEGER_VALUE")
    protected Integer integerValue;

    @Column(name = "LONG_VALUE")
    protected Long longValue;

    @Temporal(TemporalType.TIME)
    @Column(name = "TIME_VALUE")
    protected Date timeValue;










    public void setSavedEnum(String savedEnum) {
        this.savedEnum = savedEnum;
    }

    public String getSavedEnum() {
        return savedEnum;
    }


    public void setSavedObject(String savedObject) {
        this.savedObject = savedObject;
    }

    public String getSavedObject() {
        return savedObject;
    }




































































    public void setBooleanValue(Boolean booleanValue) {
        this.booleanValue = booleanValue;
    }

    public Boolean getBooleanValue() {
        return booleanValue;
    }

    public void setBigDecimalValue(BigDecimal bigDecimalValue) {
        this.bigDecimalValue = bigDecimalValue;
    }

    public BigDecimal getBigDecimalValue() {
        return bigDecimalValue;
    }

    public void setDateTimeValue(Date dateTimeValue) {
        this.dateTimeValue = dateTimeValue;
    }

    public Date getDateTimeValue() {
        return dateTimeValue;
    }

    public void setDateValue(Date dateValue) {
        this.dateValue = dateValue;
    }

    public Date getDateValue() {
        return dateValue;
    }

    public void setDoubleValue(Double doubleValue) {
        this.doubleValue = doubleValue;
    }

    public Double getDoubleValue() {
        return doubleValue;
    }

    public void setIntegerValue(Integer integerValue) {
        this.integerValue = integerValue;
    }

    public Integer getIntegerValue() {
        return integerValue;
    }

    public void setLongValue(Long longValue) {
        this.longValue = longValue;
    }

    public Long getLongValue() {
        return longValue;
    }

    public void setTimeValue(Date timeValue) {
        this.timeValue = timeValue;
    }

    public Date getTimeValue() {
        return timeValue;
    }


    public void setText(String text) {
        this.text = text;
    }

    public String getText() {
        return text;
    }








    public void setKey(String key) {
        this.key = key;
    }

    public String getKey() {
        return key;
    }




}