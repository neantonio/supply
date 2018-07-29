package com.groupstp.supply.service;


import com.groupstp.supply.entity.*;
import com.haulmont.cuba.core.entity.StandardEntity;

import java.util.Date;
import java.util.List;
/**
 * @author AntonLomako
 */
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

    void commitQuery(Query queryItem);

    List<Employee> getAllEmployees();

    StandardEntity saveEntity(StandardEntity entity);

    StandardEntity getEntity(String entityType, String entityUUID);

    String getMetaclassPrefix(String entityType);

    List<StandardEntity> getEntityList(String entityType);

    Holiday getHoliday(Date date);

    Settings getSettings(String key);


}