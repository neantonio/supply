package com.groupstp.supply.entity;

import javax.persistence.Entity;
import javax.persistence.Table;
import com.haulmont.cuba.core.entity.StandardEntity;
import javax.persistence.FetchType;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Column;
import javax.validation.constraints.NotNull;

@Table(name = "SUPPLY_QUERIES_POSITION")
@Entity(name = "supply$QueriesPosition")
public class QueriesPosition extends StandardEntity {
    private static final long serialVersionUID = 2816298219119304612L;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "QUERY_ID")
    protected Query query;

    @NotNull
    @Column(name = "CURRENT_STAGE", nullable = false)
    protected String currentStage;

    @NotNull
    @Column(name = "POSITION_TYPE", nullable = false)
    protected String positionType;

    @Column(name = "NUMBER_ARTICLE", length = 25)
    protected String numberArticle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "NOMENCLATURE_ID")
    protected Nomenclature nomenclature;

    @Column(name = "SPECIFICATION")
    protected String specification;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MEASURE_UNIT_ID")
    protected MeasureUnits measureUnit;

    @NotNull
    @Column(name = "QUANTITY", nullable = false)
    protected String quantity;

    @Column(name = "ANALOGS_ALLOWED")
    protected Boolean analogsAllowed;

    public void setNomenclature(Nomenclature nomenclature) {
        this.nomenclature = nomenclature;
    }

    public Nomenclature getNomenclature() {
        return nomenclature;
    }

    public void setSpecification(String specification) {
        this.specification = specification;
    }

    public String getSpecification() {
        return specification;
    }

    public void setMeasureUnit(MeasureUnits measureUnit) {
        this.measureUnit = measureUnit;
    }

    public MeasureUnits getMeasureUnit() {
        return measureUnit;
    }

    public void setQuantity(String quantity) {
        this.quantity = quantity;
    }

    public String getQuantity() {
        return quantity;
    }

    public void setAnalogsAllowed(Boolean analogsAllowed) {
        this.analogsAllowed = analogsAllowed;
    }

    public Boolean getAnalogsAllowed() {
        return analogsAllowed;
    }


    public void setPositionType(PositionType positionType) {
        this.positionType = positionType == null ? null : positionType.getId();
    }

    public PositionType getPositionType() {
        return positionType == null ? null : PositionType.fromId(positionType);
    }

    public void setNumberArticle(String numberArticle) {
        this.numberArticle = numberArticle;
    }

    public String getNumberArticle() {
        return numberArticle;
    }


    public void setCurrentStage(Stages currentStage) {
        this.currentStage = currentStage == null ? null : currentStage.getId();
    }

    public Stages getCurrentStage() {
        return currentStage == null ? null : Stages.fromId(currentStage);
    }


    public void setQuery(Query query) {
        this.query = query;
    }

    public Query getQuery() {
        return query;
    }


}