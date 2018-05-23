package com.groupstp.supply.service;


import com.groupstp.supply.entity.QueriesPosition;
import org.eclipse.persistence.jpa.jpql.parser.QueryPosition;

public interface WorkflowService {
    String NAME = "supply_WorkflowService";

    /**
     * Производит проверку правильности заполнения позиции, согласно условий или скриптом из QueryWorkflowDetail
     * */
    public void movePosition(QueriesPosition queryPosition) throws Exception;

}