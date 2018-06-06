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
import com.haulmont.chile.core.annotations.NamePattern;
import java.math.BigDecimal;
import com.haulmont.chile.core.annotations.NumberFormat;

@NamePattern("%s|nomenclature")
@Table(name = "SUPPLY_QUERIES_POSITION")
@Entity(name = "supply$QueriesPosition")
public class QueriesPosition extends StandardEntity {
    private static final long serialVersionUID = 2816298219119304612L;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "QUERY_ID")
    protected Query query;

    @Column(name = "STORE_CONTROL_FLAG")
    protected Boolean storeControlFlag;

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

    @NumberFormat(pattern = "########.###")
    @NotNull
    @Column(name = "QUANTITY", nullable = false)
    protected Double quantity;

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

    @Column(name="IN_STORE")
    protected Boolean inStore;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "STORE_CONTROL_FLAG_TS")
    protected Date storeControlFlagTS;

    @Column(name = "SUPPLY_WORKOUT_TYPE")
    protected String supplyWorkoutType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "POSITION_ID")
    protected QueriesPosition position;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SRC_STORE_ID")
    protected Store srcStore;

    @Column(name = "SUP_SELECTION_FLAG")
    protected Boolean supSelectionFlag;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "SUP_SELECTION_FLAG_TS")
    protected Date supSelectionFlagTS;

    @Column(name = "ANALYSIS_RESULT")
    protected String analysisResult;

    @Column(name = "ANALYSIS_FLAG")
    protected Boolean analysisFlag;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "ANALYSIS_FLAG_TS")
    protected Date analysisFlagTS;

    @Column(name = "PRICE_REDUCE")
    protected Boolean priceReduce;

    @Column(name = "MINIMAL_PRICE")
    protected Double minimalPrice;

    public Double getQuantity() {
        return quantity;
    }

    public void setQuantity(Double quantity) {
        this.quantity = quantity;
    }


    public void setPriceReduce(Boolean priceReduce) {
        this.priceReduce = priceReduce;
    }

    public Boolean getPriceReduce() {
        return priceReduce;
    }

    public void setMinimalPrice(Double minimalPrice) {
        this.minimalPrice = minimalPrice;
    }

    public Double getMinimalPrice() {
        return minimalPrice;
    }


    public void setAnalysisResult(AnalysisResult analysisResult) {
        this.analysisResult = analysisResult == null ? null : analysisResult.getId();
    }

    public AnalysisResult getAnalysisResult() {
        return analysisResult == null ? null : AnalysisResult.fromId(analysisResult);
    }

    public void setAnalysisFlag(Boolean analysisFlag) {
        this.analysisFlag = analysisFlag;
    }

    public Boolean getAnalysisFlag() {
        return analysisFlag;
    }

    public void setAnalysisFlagTS(Date analysisFlagTS) {
        this.analysisFlagTS = analysisFlagTS;
    }

    public Date getAnalysisFlagTS() {
        return analysisFlagTS;
    }


    public void setSupSelectionFlag(Boolean supSelectionFlag) {
        this.supSelectionFlag = supSelectionFlag;
    }

    public Boolean getSupSelectionFlag() {
        return supSelectionFlag;
    }

    public void setSupSelectionFlagTS(Date supSelectionFlagTS) {
        this.supSelectionFlagTS = supSelectionFlagTS;
    }

    public Date getSupSelectionFlagTS() {
        return supSelectionFlagTS;
    }


    public void setStoreControlFlagTS(Date storeControlFlagTS) {
        this.storeControlFlagTS = storeControlFlagTS;
    }

    public Date getStoreControlFlagTS() {
        return storeControlFlagTS;
    }



    public Store getSrcStore() {
        return srcStore;
    }

    public void setSrcStore(Store srcStore) {
        this.srcStore = srcStore;
    }


    public SupplyWorkoutType getSupplyWorkoutType() {
        return supplyWorkoutType == null ? null : SupplyWorkoutType.fromId(supplyWorkoutType);
    }

    public void setSupplyWorkoutType(SupplyWorkoutType supplyWorkoutType) {
        this.supplyWorkoutType = supplyWorkoutType == null ? null : supplyWorkoutType.getId();
    }



    public void setStoreControlFlag(Boolean storeControlFlag) {
        this.storeControlFlag = storeControlFlag;
    }

    public Boolean getStoreControlFlag() {
        return storeControlFlag;
    }

    public void setPosition(QueriesPosition position) {
        this.position = position;
    }

    public QueriesPosition getPosition() {
        return position;
    }


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

    public Boolean getInStore() { return inStore; }

    public void setInStore(Boolean inStore) { this.inStore = inStore; }

}