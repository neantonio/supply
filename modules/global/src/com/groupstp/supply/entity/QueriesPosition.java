package com.groupstp.supply.entity;

import javax.persistence.Entity;
import javax.persistence.Table;
import com.haulmont.cuba.core.entity.StandardEntity;
import javax.persistence.FetchType;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Column;
import javax.validation.constraints.NotNull;
import com.haulmont.chile.core.annotations.Composition;
import com.haulmont.cuba.core.entity.annotation.OnDelete;
import com.haulmont.cuba.core.global.DeletePolicy;
import java.util.List;
import javax.persistence.OneToMany;
import java.util.Date;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;

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

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "MEASURE_UNIT_ID")
    protected MeasureUnits measureUnit;

    @NotNull
    @Column(name = "QUANTITY", nullable = false)
    protected String quantity;

    @Column(name = "ANALOGS_ALLOWED")
    protected Boolean analogsAllowed;

    @Composition
    @OnDelete(DeletePolicy.CASCADE)
    @OneToMany(mappedBy = "queriesPosition")
    protected List<PositionsAnalogs> analogs;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "STORE_ID")
    protected Store store;

    @Column(name = "POSITION_USEFULNESS")
    protected Boolean positionUsefulness;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "POSITION_USEFULNESS_TS")
    protected Date positionUsefulnessTS;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SPEC_NOMENCLATURE_ID")
    protected Nomenclature specNomenclature;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "NOMECLATURE_CHANGE_ID")
    protected Nomenclature nomeclatureChange;

    @Column(name = "ANALOGS_CORRECTION_FLAG")
    protected Boolean analogsCorrectionFlag;

    @Column(name = "NOM_CONTROL_FLAG")
    protected Boolean nomControlFlag;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "NOM_CONTROL_FLAG_TS")
    protected Date nomControlFlagTS;

    public void setStore(Store store) {
        this.store = store;
    }

    public Store getStore() {
        return store;
    }

    public void setPositionUsefulness(Boolean positionUsefulness) {
        this.positionUsefulness = positionUsefulness;
    }

    public Boolean getPositionUsefulness() {
        return positionUsefulness;
    }

    public void setPositionUsefulnessTS(Date positionUsefulnessTS) {
        this.positionUsefulnessTS = positionUsefulnessTS;
    }

    public Date getPositionUsefulnessTS() {
        return positionUsefulnessTS;
    }

    public void setSpecNomenclature(Nomenclature specNomenclature) {
        this.specNomenclature = specNomenclature;
    }

    public Nomenclature getSpecNomenclature() {
        return specNomenclature;
    }

    public void setNomeclatureChange(Nomenclature nomeclatureChange) {
        this.nomeclatureChange = nomeclatureChange;
    }

    public Nomenclature getNomeclatureChange() {
        return nomeclatureChange;
    }

    public void setAnalogsCorrectionFlag(Boolean analogsCorrectionFlag) {
        this.analogsCorrectionFlag = analogsCorrectionFlag;
    }

    public Boolean getAnalogsCorrectionFlag() {
        return analogsCorrectionFlag;
    }

    public void setNomControlFlag(Boolean nomControlFlag) {
        this.nomControlFlag = nomControlFlag;
    }

    public Boolean getNomControlFlag() {
        return nomControlFlag;
    }

    public void setNomControlFlagTS(Date nomControlFlagTS) {
        this.nomControlFlagTS = nomControlFlagTS;
    }

    public Date getNomControlFlagTS() {
        return nomControlFlagTS;
    }


    public void setAnalogs(List<PositionsAnalogs> analogs) {
        this.analogs = analogs;
    }

    public List<PositionsAnalogs> getAnalogs() {
        return analogs;
    }


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