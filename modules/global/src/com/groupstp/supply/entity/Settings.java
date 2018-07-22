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

@NamePattern("%s|key")
@Table(name = "SUPPLY_SETTINGS")
@Entity(name = "supply$Settings")
public class Settings extends StandardEntity {
    private static final long serialVersionUID = -795776409239914344L;

    @NotNull
    @Column(name = "KEY_", nullable = false, unique = true, length = 50)
    protected String key;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MEASURE_UNITS_ID")
    protected MeasureUnits measureUnits;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PROCURATION_ID")
    protected Procuration procuration;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "QUERIES_POSITION_ID")
    protected QueriesPosition queriesPosition;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "QUERY_ID")
    protected Query query;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "QUERY_POSITION_MOVEMENTS_ID")
    protected QueryPositionMovements queryPositionMovements;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "QUERY_POSITION_STAGE_DATA_ID")
    protected QueryPositionStageData queryPositionStageData;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "QUERY_POSITION_STAGE_DATA_ITEM_ID")
    protected QueryPositionStageDataItem queryPositionStageDataItem;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "QUERY_WORKFLOW_ID")
    protected QueryWorkflow queryWorkflow;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "QUERY_WORKFLOW_DETAIL_ID")
    protected QueryWorkflowDetail queryWorkflowDetail;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "STAGE_TERM_ID")
    protected StageTerm stageTerm;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "STORE_ID")
    protected Store store;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SUPPLIERS_SUGGESTION_ID")
    protected SuppliersSuggestion suppliersSuggestion;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "URGENCY_ID")
    protected Urgency urgency;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "VOTE_ID")
    protected Vote vote;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "NOMENCLATURE_ID")
    protected Nomenclature nomenclature;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "POSITION_SUPPLIER_ID")
    protected PositionSupplier positionSupplier;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "POSITIONS_ANALOGS_ID")
    protected PositionsAnalogs positionsAnalogs;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ANALOGS_ID")
    protected Analogs analogs;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "BILLS_ID")
    protected Bills bills;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DELIVERY_ID")
    protected Delivery delivery;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DELIVERY_LINE_ID")
    protected DeliveryLine deliveryLine;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "EMPLOYEE_ID")
    protected Employee employee;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "HOLIDAY_ID")
    protected Holiday holiday;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "COMPANY_ID")
    protected Company company;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SUPPLIERS_ID")
    protected Suppliers suppliers;

    @Column(name = "TEXT", length = 50)
    protected String text;

    @Column(name = "BOOLEAN_VALUE")
    protected Boolean booleanValue;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DIVISION_ID")
    protected Division division;

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

    @Column(name = "ANALYSIS_RESULT")
    protected String analysisResult;

    @Column(name = "CARGO_STATE")
    protected String cargoState;

    @Column(name = "CAUSES")
    protected String causes;

    @Column(name = "ORIGIN")
    protected String origin;

    @Column(name = "PERIDIOCITIES")
    protected String peridiocities;

    @Column(name = "POSITION_TYPE")
    protected String positionType;

    @Column(name = "QUERY_STATUS")
    protected String queryStatus;

    @Column(name = "STAGES")
    protected String stages;

    @Column(name = "SUPPLY_WORKOUT_TYPE")
    protected String supplyWorkoutType;

    public void setMeasureUnits(MeasureUnits measureUnits) {
        this.measureUnits = measureUnits;
    }

    public MeasureUnits getMeasureUnits() {
        return measureUnits;
    }

    public void setProcuration(Procuration procuration) {
        this.procuration = procuration;
    }

    public Procuration getProcuration() {
        return procuration;
    }

    public void setQueriesPosition(QueriesPosition queriesPosition) {
        this.queriesPosition = queriesPosition;
    }

    public QueriesPosition getQueriesPosition() {
        return queriesPosition;
    }

    public void setQuery(Query query) {
        this.query = query;
    }

    public Query getQuery() {
        return query;
    }

    public void setQueryPositionMovements(QueryPositionMovements queryPositionMovements) {
        this.queryPositionMovements = queryPositionMovements;
    }

    public QueryPositionMovements getQueryPositionMovements() {
        return queryPositionMovements;
    }

    public void setQueryPositionStageData(QueryPositionStageData queryPositionStageData) {
        this.queryPositionStageData = queryPositionStageData;
    }

    public QueryPositionStageData getQueryPositionStageData() {
        return queryPositionStageData;
    }

    public void setQueryPositionStageDataItem(QueryPositionStageDataItem queryPositionStageDataItem) {
        this.queryPositionStageDataItem = queryPositionStageDataItem;
    }

    public QueryPositionStageDataItem getQueryPositionStageDataItem() {
        return queryPositionStageDataItem;
    }

    public void setQueryWorkflow(QueryWorkflow queryWorkflow) {
        this.queryWorkflow = queryWorkflow;
    }

    public QueryWorkflow getQueryWorkflow() {
        return queryWorkflow;
    }

    public void setQueryWorkflowDetail(QueryWorkflowDetail queryWorkflowDetail) {
        this.queryWorkflowDetail = queryWorkflowDetail;
    }

    public QueryWorkflowDetail getQueryWorkflowDetail() {
        return queryWorkflowDetail;
    }

    public void setStageTerm(StageTerm stageTerm) {
        this.stageTerm = stageTerm;
    }

    public StageTerm getStageTerm() {
        return stageTerm;
    }

    public void setStore(Store store) {
        this.store = store;
    }

    public Store getStore() {
        return store;
    }

    public void setSuppliersSuggestion(SuppliersSuggestion suppliersSuggestion) {
        this.suppliersSuggestion = suppliersSuggestion;
    }

    public SuppliersSuggestion getSuppliersSuggestion() {
        return suppliersSuggestion;
    }

    public void setUrgency(Urgency urgency) {
        this.urgency = urgency;
    }

    public Urgency getUrgency() {
        return urgency;
    }

    public void setVote(Vote vote) {
        this.vote = vote;
    }

    public Vote getVote() {
        return vote;
    }

    public void setNomenclature(Nomenclature nomenclature) {
        this.nomenclature = nomenclature;
    }

    public Nomenclature getNomenclature() {
        return nomenclature;
    }

    public void setPositionSupplier(PositionSupplier positionSupplier) {
        this.positionSupplier = positionSupplier;
    }

    public PositionSupplier getPositionSupplier() {
        return positionSupplier;
    }

    public void setPositionsAnalogs(PositionsAnalogs positionsAnalogs) {
        this.positionsAnalogs = positionsAnalogs;
    }

    public PositionsAnalogs getPositionsAnalogs() {
        return positionsAnalogs;
    }

    public void setAnalysisResult(AnalysisResult analysisResult) {
        this.analysisResult = analysisResult == null ? null : analysisResult.getId();
    }

    public AnalysisResult getAnalysisResult() {
        return analysisResult == null ? null : AnalysisResult.fromId(analysisResult);
    }

    public void setCargoState(CargoState cargoState) {
        this.cargoState = cargoState == null ? null : cargoState.getId();
    }

    public CargoState getCargoState() {
        return cargoState == null ? null : CargoState.fromId(cargoState);
    }

    public void setCauses(Causes causes) {
        this.causes = causes == null ? null : causes.getId();
    }

    public Causes getCauses() {
        return causes == null ? null : Causes.fromId(causes);
    }

    public void setOrigin(Origin origin) {
        this.origin = origin == null ? null : origin.getId();
    }

    public Origin getOrigin() {
        return origin == null ? null : Origin.fromId(origin);
    }

    public void setPeridiocities(Peridiocities peridiocities) {
        this.peridiocities = peridiocities == null ? null : peridiocities.getId();
    }

    public Peridiocities getPeridiocities() {
        return peridiocities == null ? null : Peridiocities.fromId(peridiocities);
    }

    public void setPositionType(PositionType positionType) {
        this.positionType = positionType == null ? null : positionType.getId();
    }

    public PositionType getPositionType() {
        return positionType == null ? null : PositionType.fromId(positionType);
    }

    public void setQueryStatus(QueryStatus queryStatus) {
        this.queryStatus = queryStatus == null ? null : queryStatus.getId();
    }

    public QueryStatus getQueryStatus() {
        return queryStatus == null ? null : QueryStatus.fromId(queryStatus);
    }

    public void setStages(Stages stages) {
        this.stages = stages == null ? null : stages.getId();
    }

    public Stages getStages() {
        return stages == null ? null : Stages.fromId(stages);
    }

    public void setSupplyWorkoutType(SupplyWorkoutType supplyWorkoutType) {
        this.supplyWorkoutType = supplyWorkoutType == null ? null : supplyWorkoutType.getId();
    }

    public SupplyWorkoutType getSupplyWorkoutType() {
        return supplyWorkoutType == null ? null : SupplyWorkoutType.fromId(supplyWorkoutType);
    }


    public void setAnalogs(Analogs analogs) {
        this.analogs = analogs;
    }

    public Analogs getAnalogs() {
        return analogs;
    }

    public void setBills(Bills bills) {
        this.bills = bills;
    }

    public Bills getBills() {
        return bills;
    }

    public void setDelivery(Delivery delivery) {
        this.delivery = delivery;
    }

    public Delivery getDelivery() {
        return delivery;
    }

    public void setDeliveryLine(DeliveryLine deliveryLine) {
        this.deliveryLine = deliveryLine;
    }

    public DeliveryLine getDeliveryLine() {
        return deliveryLine;
    }

    public void setEmployee(Employee employee) {
        this.employee = employee;
    }

    public Employee getEmployee() {
        return employee;
    }

    public void setHoliday(Holiday holiday) {
        this.holiday = holiday;
    }

    public Holiday getHoliday() {
        return holiday;
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

    public void setDivision(Division division) {
        this.division = division;
    }

    public Division getDivision() {
        return division;
    }


    public void setSuppliers(Suppliers suppliers) {
        this.suppliers = suppliers;
    }

    public Suppliers getSuppliers() {
        return suppliers;
    }

    public void setCompany(Company company) {
        this.company = company;
    }

    public Company getCompany() {
        return company;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getKey() {
        return key;
    }

    public Object OneValue() {

        List<java.lang.reflect.Field> fieldList = Arrays.asList(this.getClass().getDeclaredFields());

        List<Field> fieldFilterList = fieldList.stream()
                .filter(field -> {
                            String name = field.getName();
                            Object value = null;
                            try {
                                field.setAccessible(true);
                                value = field.get(this);
                            } catch (IllegalAccessException e) {
                                e.printStackTrace();
                            }
                            return (value != null && !name.contains("_persistence_") && !name.equals("serialVersionUID"));
                        }
                )
                .collect(Collectors.toList());

        Field fieldValue = fieldFilterList.get(1);

        Object o = null;
        try {
            o = fieldValue.get(this);
        } catch (IllegalAccessException e) {
            e.printStackTrace();
        }

        return o;
    }


}