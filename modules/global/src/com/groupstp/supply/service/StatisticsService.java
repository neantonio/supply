package com.groupstp.supply.service;


import com.groupstp.supply.entity.QueriesPosition;
import com.groupstp.supply.entity.QueryPositionMovements;

import java.util.Date;
import java.util.List;

public interface StatisticsService {
    String NAME = "supply_StatisticsService";

    long getTimeOfPositionProcessing(QueriesPosition position);
    long getTimeOfPositionProcessing(List<QueryPositionMovements> positionMovementsList);
    long getStageDuration(QueryPositionMovements movement,Date now);
    long getStageDuration(QueryPositionMovements movement);
    int getReturnsValueForPosition(QueriesPosition position);
    int getReturnsValueForPosition(List<QueryPositionMovements> positionMovementsList);
    double getPriceChangeOfNMP(QueriesPosition position);
    double getPriceCompareWithKPI(QueriesPosition position);
    int getTimeCompareWithKPI(QueriesPosition position);

}