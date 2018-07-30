package com.groupstp.supply.service;


import com.groupstp.supply.entity.QueriesPosition;
import com.groupstp.supply.entity.QueryPositionMovements;
import com.groupstp.supply.entity.Stages;

import java.util.List;

public interface WorkflowService {
    String NAME = "supply_WorkflowService";

    /**
     * Производит проверку правильности заполнения позиции, согласно условий или скриптом из QueryWorkflowDetail
     * */
    void movePosition(QueriesPosition queryPosition) throws Exception;

    void movePositionTo(QueriesPosition position, Stages stage);

    List<QueryPositionMovements> getQueryPositionMovement(QueriesPosition position);


}