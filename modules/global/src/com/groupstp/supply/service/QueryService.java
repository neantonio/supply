package com.groupstp.supply.service;


import com.groupstp.supply.entity.*;

import java.util.Date;
import java.util.List;

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
}