package com.groupstp.supply.service;


import com.groupstp.supply.entity.QueriesPosition;
import com.groupstp.supply.entity.QueryPositionStageData;
import com.haulmont.cuba.core.entity.StandardEntity;

import java.util.Collection;
import java.util.Date;
import java.util.Map;

/**
 * @author AntonLomako
 */
public interface StageDataService {
    String NAME = "supply_StageDataService";

    //методы добавления данных. для каждого типа своя обработка
    QueryPositionStageData setData(QueryPositionStageData stageData,String dataName,String data);
    QueryPositionStageData setData(QueryPositionStageData stageData,String dataName,Date data);
    QueryPositionStageData setData(QueryPositionStageData stageData,String dataName,Integer data);
    QueryPositionStageData setData(QueryPositionStageData stageData,String dataName,Double data);
    QueryPositionStageData setData(QueryPositionStageData stageData,String dataName,StandardEntity data);
    QueryPositionStageData setData(QueryPositionStageData stageData,String dataName,Boolean data);

    //когда известен тип данных
    String getStringData(QueryPositionStageData stageData,String dataName);
    Date getDateData(QueryPositionStageData stageData,String dataName);
    Double getDoubleData(QueryPositionStageData stageData,String dataName);
    Integer getIntegerData(QueryPositionStageData stageData,String dataName);
    Boolean getBooleanData(QueryPositionStageData stageData,String dataName);
    StandardEntity getEntityData(QueryPositionStageData stageData,String dataName);

   // Object getData(QueryPositionStageData stageData,String dataName);

    QueryPositionStageData getOrCreateStageDataForPositionFromCollectionAndDescription(
            Collection<QueryPositionStageData> items,
            QueriesPosition entity,
            Map<String, String> stageDataItemsDescription);
}