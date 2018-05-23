package com.groupstp.supply.service;

import com.groupstp.supply.entity.*;
import com.haulmont.cuba.core.global.DataManager;
import com.haulmont.cuba.core.global.LoadContext;
import com.haulmont.cuba.core.global.Scripting;
import com.haulmont.cuba.core.global.UserSessionSource;
import groovy.lang.Binding;
import org.eclipse.persistence.jpa.jpql.parser.DateTime;
import org.eclipse.persistence.jpa.jpql.parser.QueryPosition;
import org.eclipse.persistence.sessions.Session;
import org.slf4j.Logger;
import org.springframework.stereotype.Service;

import javax.inject.Inject;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;

@Service(WorkflowService.NAME)
public class WorkflowServiceBean implements WorkflowService {

    @Inject
    private DataManager dataManager;

    @Inject
    private Scripting scripting;

    @Inject
    private Logger log;

    /**
     * Производит проверку заполнения и перемещает позицию на этап, согласно условий {@link QueryWorkflowDetail}
     * @param position - позиция заявки
     */
    @Override
    public void movePosition(QueriesPosition position) throws Exception {
        List<QueryWorkflowDetail> details = getWorkflowDetailsForPositions(position);
        String errors = "\n";
        Boolean found = false;
        for (QueryWorkflowDetail detail:details)
        {
            try
            {
                found = validatePosition(position, detail) && checkConditions(position, detail);
            }
            catch (Exception e)
            {
                errors+=detail.getDestStage().name()+":"+e.getMessage()+"\n";
            }
            if (found)
            {
                movePositionTo(position, detail.getDestStage());
                break;
            }
        }
        if(!found)
            throw new Exception(errors);
    }

    public void movePositionTo(QueriesPosition position, Stages stage) {
        position.setNomControlFlag(true);
        position.setNomControlFlagTS(new Date());
        position.setCurrentStage(stage);
        dataManager.commit(position);
        createMovementRecord(position, stage);
    }

    @Inject
    private UserSessionSource userSessionSource;

    protected void createMovementRecord(QueriesPosition position, Stages stage)
    {
        QueryPositionMovements movement = new QueryPositionMovements();
        movement.setPosition(position);
        movement.setStage(stage);
        movement.setUser(userSessionSource.getUserSession().getUser());
        dataManager.commit(movement);
    }

    private boolean runScript(QueriesPosition position, String script) throws Exception {
        Binding binding = new Binding();
        binding.setVariable("position", position);
        script="import com.groupstp.supply.entity.* \n"+script;
        scripting.clearCache();
        Object res = scripting.evaluateGroovy(script, binding);
        if(res instanceof String)
            throw new Exception((String) res);
        return true;
    }

    private boolean checkConditions(QueriesPosition position, QueryWorkflowDetail detail) throws Exception {
        return  runScript(position, detail.getScript());
    }

    /**
     * Производит проверку правильности заполнения позиции, согласно условий или скриптом из QueryWorkflowDetail
     * @param position позиция заявки
     * @param detail проверки и условия перехода , элемент {@link QueryWorkflowDetail}
     * @return правильность заполнения
     */
    private boolean validatePosition(QueriesPosition position, QueryWorkflowDetail detail) throws Exception {
        return runScript(position, detail.getValidationScript());
    }

    /**
     * Возвращает для позиции queryPosition список вариантов движения заявки
     * @param queryPosition
     * @return QueryWorkflowDetail
     */
    private List<QueryWorkflowDetail> getWorkflowDetailsForPositions(QueriesPosition queryPosition)
    {
        LoadContext<QueryWorkflowDetail> ctx = LoadContext.create(QueryWorkflowDetail.class).setQuery(
                LoadContext.createQuery("select q from supply$QueryWorkflowDetail q where q.sourceStage=:sourceStage order by q.priority asc")
                .setParameter("sourceStage", queryPosition.getCurrentStage()));
        return  dataManager.loadList(ctx);
    }
}