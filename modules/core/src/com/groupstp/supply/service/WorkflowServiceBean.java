package com.groupstp.supply.service;

import com.groupstp.supply.entity.QueriesPosition;
import com.groupstp.supply.entity.QueryPositionMovements;
import com.groupstp.supply.entity.QueryWorkflowDetail;
import com.groupstp.supply.entity.Stages;
import com.haulmont.cuba.core.global.*;
import groovy.lang.Binding;
import org.slf4j.Logger;
import org.springframework.stereotype.Service;

import javax.inject.Inject;
import java.util.Date;
import java.util.List;

@Service(WorkflowService.NAME)
public class WorkflowServiceBean implements WorkflowService {

    @Inject
    private DataManager dataManager;

    @Inject
    private Scripting scripting;

    @Inject
    private Logger log;

    @Inject
    private UserSessionSource userSessionSource;

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
                found = validatePosition(position, detail);
                if(found)
                    found &= checkConditions(position, detail);
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

    @Inject
    private TimeSource timeSource;

    /**
     * Переводит позицию на этап без каких-либо проверок и условий
     * @param position позиция заявки
     * @param stage этап, на который переводится позиция
     */
    @Override
    public void movePositionTo(QueriesPosition position, Stages stage) {
        //TODO: add finishTS to current position
        String strStage = position.getCurrentStage().name();
        strStage = strStage.substring(0, 1).toLowerCase()+strStage.substring(1);
        if(position.getMetaClass().getProperty(strStage+"Flag")!=null) {
            position.setValue(strStage + "Flag", true);
            position.setValue(strStage + "FlagTS", timeSource.currentTimestamp());
        }
        if(position.getCurrentStage()!=Stages.New) createFinishStageRecord(position);
        position.setCurrentStage(stage);
        dataManager.commit(position);
        createMovementRecord(position, stage);
    }

    /**
     * Возвращает все движения позиции заявки
     * @param position позиция заявки
     */
    @Override
    public List<QueryPositionMovements> getQueryPositionMovement(QueriesPosition position){

        return queryDaoService.getQueryPositionMovement(position);
    }

    @Inject
    QueryDaoService queryDaoService;

    /**
     * @author AntonLomako
     * запись в журнал информации о завершении этапа. извлекается последняя запись с участием позиции и устанавливается finishTS
     * @param position
     */
    private void createFinishStageRecord(QueriesPosition position){
        QueryPositionMovements lastMovement=queryDaoService.getQueryPositionMovement(position).get(0);
        if(lastMovement==null) return;
        lastMovement.setFinishTS(new Date());
        dataManager.commit(lastMovement);
    }

    @Inject
    private Metadata metadata;

    /**
     * Запись в журнал движений позиции
     * @param position позиция
     * @param stage этап
     */
    protected void createMovementRecord(QueriesPosition position, Stages stage)
    {
        QueryPositionMovements movement = metadata.create(QueryPositionMovements.class);
        movement.setPosition(position);
        movement.setStage(stage);
        movement.setUser(userSessionSource.getUserSession().getUser());

        //если позиция на завершающем этапе, то надо поставить ts завершения
        if((stage==Stages.Abortion)||(stage==Stages.Done)) movement.setCreateTs(new Date());
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
        return res.equals(true);
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
     * @param queryPosition - позиция заявки
     * @return QueryWorkflowDetail
     */
    private List<QueryWorkflowDetail> getWorkflowDetailsForPositions(QueriesPosition queryPosition)
    {
        return dataManager.load(QueryWorkflowDetail.class)
                .query("select q from supply$QueryWorkflowDetail q " +
                        "where q.sourceStage=:sourceStage " +
                        "and q.queryWorkflow.id=:queryWorkflow " +
                        "order by q.priority asc")
                .parameter("sourceStage", queryPosition.getCurrentStage())
                .parameter("queryWorkflow", queryPosition.getQuery().getWorkflow())
                .view("queryWorkflowDetail-view")
                .list();
    }


//    private QueriesPosition getQueryPosition(Query query){
//
//    }
}