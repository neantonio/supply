package com.groupstp.supply.service;


import com.groupstp.supply.entity.QueriesPosition;
import com.groupstp.supply.entity.Stages;

public interface WorkflowService {
    String NAME = "supply_WorkflowService";

    /**
     * Производит проверку правильности заполнения позиции, согласно условий или скриптом из QueryWorkflowDetail
     * */
    public void movePosition(QueriesPosition queryPosition) throws Exception;

    void movePositionTo(QueriesPosition position, Stages stage);


}