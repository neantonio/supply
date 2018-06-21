package com.groupstp.supply.service;


import com.groupstp.supply.entity.QueriesPosition;
import com.groupstp.supply.entity.QueryWorkflowDetail;
import com.groupstp.supply.entity.Stages;
import org.eclipse.persistence.jpa.jpql.parser.QueryPosition;

import java.util.List;

public interface WorkflowService {
    String NAME = "supply_WorkflowService";

    /**
     * Производит проверку правильности заполнения позиции, согласно условий или скриптом из QueryWorkflowDetail
     * */
    public void movePosition(QueriesPosition queryPosition) throws Exception;

    void movePositionTo(QueriesPosition position, Stages stage);


}