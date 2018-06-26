package com.groupstp.supply.service;

import com.groupstp.supply.entity.*;
import com.haulmont.cuba.core.global.DataManager;
import com.haulmont.cuba.core.global.LoadContext;
import org.springframework.stereotype.Service;

import javax.inject.Inject;
import java.util.List;

@Service(QueryDaoService.NAME)
public class QueryDaoServiceBean implements QueryDaoService {

    @Inject
    private DataManager dataManager;

    @Override
    public List<QueriesPosition> getQueriesPositionByQuery(Query query) {
        LoadContext<QueriesPosition> loadContext = LoadContext.create(QueriesPosition.class)
                .setQuery(LoadContext.createQuery("select qp from supply$QueriesPosition qp where qp.query.id = :queryItem")
                        .setParameter("queryItem", query))
                .setView("queriesPosition-full");
        ;

        return dataManager.loadList(loadContext);
    }

    @Override
    public int getTimeForPositionStage(QueriesPosition position) {
        LoadContext<StageTerm> loadContext = LoadContext.create(StageTerm.class)
                .setQuery(LoadContext.createQuery("select st from supply$StageTerm st where st.urgency.id = :urgencyItem and st.stage=:stageItem")
                        .setParameter("urgencyItem",position.getQuery().getUrgency())
                        .setParameter("stageItem",position.getCurrentStage()));
         int result=dataManager.load(loadContext).getTime();
        return result;
    }

    @Override
    public List<QueryPositionMovements> getQueryPositionMovement(QueriesPosition position){
        LoadContext<QueryPositionMovements> loadContext = LoadContext.create(QueryPositionMovements.class)
                .setQuery(LoadContext.createQuery("select  qpm from supply$QueryPositionMovements qpm where qpm.position.id = :positionItem order by qpm.finishTS desc")
                        .setParameter("positionItem",position))
                .setView("queryPositionMovements-view");
        return dataManager.loadList(loadContext);

    }

    @Override
    public List<Query> getAllQueries(){
        LoadContext<Query> loadContext = LoadContext.create(Query.class)
                .setQuery(LoadContext.createQuery("select  q from supply$Query q "))
                .setView("query-view");
        return dataManager.loadList(loadContext);
    }

    @Override
    public List<QueriesPosition> getAllQueriesPosition(){
        LoadContext<QueriesPosition> loadContext = LoadContext.create(QueriesPosition.class)
                .setQuery(LoadContext.createQuery("select  qp from supply$QueriesPosition qp "))
                .setView("queriesPosition-full");
        return dataManager.loadList(loadContext);
    }

    @Override
    public StageTerm getStageTermForStage(Stages stage, Urgency urgency){
        LoadContext<StageTerm> loadContext = LoadContext.create(StageTerm.class)
                .setQuery(LoadContext.createQuery("select  st from supply$StageTerm st where st.urgency.id=:urgencyItem and st.stage=:stageItem ")
                .setParameter("urgencyItem",urgency)
                        .setParameter("stageItem",stage));

        return dataManager.load(loadContext);
    }

    @Override
    public QueriesPosition getQueryPositionCopy(QueriesPosition qp) {
        LoadContext<QueriesPosition> loadContext = LoadContext.create(QueriesPosition.class)
                .setQuery(LoadContext.createQuery("select  qp from supply$QueriesPosition qp where qp.id=:position ")
                .setParameter("position",qp));
        return dataManager.load(loadContext);

    }

    @Override
    public List<QueryWorkflowDetail> getAllWorkflowDetails(QueryWorkflow workflow) {
        LoadContext<QueryWorkflowDetail> loadContext = LoadContext.create(QueryWorkflowDetail.class)
                .setQuery(LoadContext.createQuery("select  qwfd from supply$QueryWorkflowDetail qwfd.workflow.id=:workflowItem ")
                        .setParameter("workflowItem",workflow));
        return dataManager.loadList(loadContext);
    }

    @Override
    public void commitQuery(Query queryItem) {
        dataManager.commit(queryItem);
    }

    @Override
    public List<Employee> getAllEmployees() {
        LoadContext<Employee> loadContext = LoadContext.create(Employee.class)
                .setQuery(LoadContext.createQuery("select  e from supply$Employee e ")).setView("employee-view");

        return dataManager.loadList(loadContext);
    }
}