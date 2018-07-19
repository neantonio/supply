package com.groupstp.supply.service;


import com.groupstp.supply.entity.Nomenclature;
import com.groupstp.supply.entity.QueriesPosition;
import com.groupstp.supply.entity.Query;
import com.groupstp.supply.entity.QueryStatus;

import java.time.LocalTime;
import java.util.Date;
import java.util.List;
/**
 * @author AntonLomako
 */
public interface QueryService {
    String NAME = "supply_QueryService";


    List<Nomenclature> getAnalogsOfPosition(QueriesPosition position);

    List<Nomenclature> getQueryNomenclature(Query query);

    QueryStatus getQueryStatus(Query query);

    long getPassedTimeFromStageBegin(QueriesPosition position);

    List<QueriesPosition> beginQueryProcessing(List<Query> queries);

    List<QueriesPosition> beginQueryProcessing(Query query);

    Date getExecutionTimeForQueriesPosition(QueriesPosition queriesPosition, boolean addHours);

    Date getStageExecutionTimeForQueriesPosition(QueriesPosition position);

    long getWorkTime(Date startDate, Date endDate, LocalTime startTimeWork, LocalTime endTimeWork, LocalTime lunchTime, int lunchDuration);
}