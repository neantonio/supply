package com.groupstp.supply.service;


import com.groupstp.supply.entity.*;


import java.util.List;

public interface QueryDaoService {
    String NAME = "supply_QueryDaoService";

    List<QueriesPosition> getQueriesPositionByQuery(Query query);

    int getTimeForPositionStage(QueriesPosition position);

    List<QueryPositionMovements> getQueryPositionMovement(QueriesPosition position);

    List<Query> getAllQueries();

    List<QueriesPosition> getAllQueriesPosition();




    StageTerm getStageTermForStage(Stages stage, Urgency urgency);

    QueriesPosition getQueryPositionCopy(QueriesPosition qp);

    List<QueryWorkflowDetail> getAllWorkflowDetails(QueryWorkflow workflow);
}