package com.groupstp.supply.entity;

import com.haulmont.chile.core.annotations.Composition;
import com.haulmont.chile.core.annotations.NamePattern;
import com.haulmont.chile.core.annotations.NumberFormat;
import com.haulmont.cuba.core.entity.StandardEntity;
import com.haulmont.cuba.core.entity.annotation.OnDelete;
import com.haulmont.cuba.core.global.DeletePolicy;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import java.util.Date;
import java.util.List;

@NamePattern("#getQueriesPositionName|nomenclature")
@Table(name = "SUPPLY_QUERIES_POSITION", uniqueConstraints = {
    @UniqueConstraint(name = "IDX_SUPPLY_QUERIES_POSITION_UNQ", columnNames = {"EXT_ID"})
})
@Entity(name = "supply$QueriesPosition")
public class QueriesPosition extends StandardEntity {
    private static final long serialVersionUID = 2816298219119304612L;


    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "QUERY_ID")
    protected Query query;

    @Column(name = "BILLS_FLAG")
    protected Boolean billsFlag;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MEASURE_UNIT_ID")
    protected MeasureUnits measureUnit;

    @NumberFormat(pattern = "########.###")
    @NotNull
    @Column(name = "QUANTITY", nullable = false)
    protected Double quantity;

    @Column(name = "ANALOGS_ALLOWED")
    protected Boolean analogsAllowed;

    @Column(name = "COMMENT_", length = 1000)
    protected String comment;

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

    @NumberFormat(pattern = "########.##")
    @Column(name = "START_MINIMAL_PRICE")
    protected Double startMinimalPrice;

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

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "BILLS_FLAG_TS")
    protected Date billsFlagTS;

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

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "VOTE_RESULT_ID")
    protected SuppliersSuggestion voteResult;


    @Column(name = "BILL_QUERY")
    protected Boolean billQuery;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "BILLS_ID")
    protected Bills bills;

    @JoinColumn(name = "DELIVERY_ID")
    @OneToOne(fetch = FetchType.LAZY)
    protected Delivery delivery;

    @Column(name = "EXT_ID")
    protected String extId;

    public void setNameCallback(QueriesPositionNameCallback nameCallback) {
        this.nameCallback = nameCallback;
    }


    public QueriesPositionNameCallback getNameCallback() {
        return nameCallback;
    }

    public interface QueriesPositionNameCallback{
        String makeName(QueriesPosition query);
    }

    /**
     *
     *
     * генерация имени возможна с использованием nameCallback.
     * это нужно для информативного отображения сущности при группировке по ней
     * @return
     */
    @Transient
    protected transient QueriesPositionNameCallback nameCallback=null;

    public void setExtId(String extId) {
        this.extId = extId;
    }

    public String getExtId() {
        return extId;
    }


    public void setComment(String comment) {
        this.comment = comment;
    }

    public String getComment() {
        return comment;
    }


    public void setDelivery(Delivery delivery) {
        this.delivery = delivery;
    }

    public Delivery getDelivery() {
        return delivery;
    }

    public void setBillsFlag(Boolean billsFlag) {
        this.billsFlag = billsFlag;
    }

    public Boolean getBillsFlag() {
        return billsFlag;
    }

    public void setBillsFlagTS(Date billsFlagTS) {
        this.billsFlagTS = billsFlagTS;
    }

    public Date getBillsFlagTS() {
        return billsFlagTS;
    }



    public String getQueriesPositionName()    {
        if(getNameCallback() ==null) {
            if(nomenclature!=null)return nomenclature.getName();
            else if(specification!=null) return specification;
            else return getUuid().toString();
        }
        else return getNameCallback().makeName(this);
    }

    public void setBills(Bills bills) {
        this.bills = bills;
    }

    public Bills getBills() {
        return bills;
    }

    public void setBillQuery(Boolean billQuery) {
        this.billQuery = billQuery;
    }

    public Boolean getBillQuery() {
        return billQuery;
    }


    public void setVoteResult(SuppliersSuggestion voteResult) {
        this.voteResult = voteResult;
    }

    public SuppliersSuggestion getVoteResult() {
        return voteResult;
    }


    public void setStartMinimalPrice(Double startMinimalPrice) {
        this.startMinimalPrice = startMinimalPrice;
    }

    public Double getStartMinimalPrice() {
        return startMinimalPrice;
    }


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