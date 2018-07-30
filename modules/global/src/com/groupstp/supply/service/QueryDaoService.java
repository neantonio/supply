package com.groupstp.supply.service;


import com.groupstp.supply.entity.*;
import com.haulmont.cuba.core.entity.StandardEntity;

import java.util.Collection;
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

    List<QueriesPosition> getQueryPositionsByStage(Stages stage);

    List<QueriesPosition> getAllQueriesPosition();




    StageTerm getStageTermForStage(Stages stage, Urgency urgency);

    QueriesPosition getQueryPositionCopy(QueriesPosition qp);

    List<QueryWorkflowDetail> getAllWorkflowDetails(QueryWorkflow workflow);

    void commitQuery(Query queryItem);

    List<Employee> getAllEmployees();

    StandardEntity saveEntity(StandardEntity entity);

    StandardEntity getEntity(String entityType, String entityUUID);

    String getMetaclassPrefix(String entityType);

    List<SuppliersSuggestion> getSupplierSuggestions(QueriesPosition entity);

    void saveToken(String token, List<QueriesPosition> positionList, Suppliers supplier);

    QueriesPositionTokenLink getTokenLinkForToken(String token);

    List<PositionSupplier> getSupplierPositions(Collection<QueriesPosition> positionCollection);

    List<StandardEntity> getEntityList(String entityType);

    Holiday getHoliday(Date date);

    Settings getSettings(String key);



    PositionSupplier getPositionSupplier(QueriesPosition position, Suppliers supplier);

    List<PositionSupplier> getPositionSuppliersForToken(String token);
}