package com.groupstp.supply.service;

import com.groupstp.supply.entity.*;
import com.haulmont.cuba.core.EntityManager;
import com.haulmont.cuba.core.Transaction;
import com.haulmont.cuba.core.entity.StandardEntity;
import com.haulmont.cuba.core.global.DataManager;
import com.haulmont.cuba.core.global.LoadContext;
import com.haulmont.cuba.core.global.Metadata;
import org.springframework.stereotype.Service;

import javax.inject.Inject;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

/**
 * @author AntonLomako
 * получает сущности из базы
 */
@Service(QueryDaoService.NAME)
public class QueryDaoServiceBean implements QueryDaoService {

    private static final int STANDARD_DURATION = 72;

    @Inject
    private DataManager dataManager;

    @Inject
    private Metadata metadata;

    @Inject
    private com.haulmont.cuba.core.Persistence persistence;

    @Override
    public List<QueriesPosition> getQueriesPositionByQuery(Query query) {
        LoadContext<QueriesPosition> loadContext = LoadContext.create(QueriesPosition.class)
                .setQuery(LoadContext.createQuery("select qp from supply$QueriesPosition qp where qp.query.id = :queryItem")
                        .setParameter("queryItem", query))
                .setView("full");
        ;

        return dataManager.loadList(loadContext);
    }

    @Override
    public int getTimeForPositionStage(QueriesPosition position) {
        LoadContext<StageTerm> loadContext = LoadContext.create(StageTerm.class)
                .setQuery(LoadContext.createQuery("select st from supply$StageTerm st where st.urgency.id = :urgencyItem and st.stage=:stageItem")
                        .setParameter("urgencyItem",position.getQuery().getUrgency())
                        .setParameter("stageItem",position.getCurrentStage()));
        int result=STANDARD_DURATION;
        try {
            result = dataManager.load(loadContext).getTime();
        }
        catch (Exception e){}
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
    public List<QueriesPosition> getQueryPositionsByStage(Stages stage){
        LoadContext<QueriesPosition> loadContext = LoadContext.create(QueriesPosition.class)
                .setQuery(LoadContext.createQuery("select  qp from supply$QueriesPosition qp where qp.currentStage=:stageItem")
                        .setParameter("stageItem",stage))
                .setView("full");
        return dataManager.loadList(loadContext);
    }

    @Override
    public List<QueriesPosition> getAllQueriesPosition(){
        LoadContext<QueriesPosition> loadContext = LoadContext.create(QueriesPosition.class)
                .setQuery(LoadContext.createQuery("select  qp from supply$QueriesPosition qp "))
                .setView("full");
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

    @Override
    public StandardEntity saveEntity(StandardEntity entity) {
        StandardEntity result;
        Transaction tx = persistence.createTransaction();
        EntityManager em = persistence.getEntityManager();
        result=em.merge(entity);
        tx.commit();
        return result;
    }

    @Override
    public StandardEntity getEntity(String entityType, String entityUUID) {
        if((entityType==null)||(entityUUID==null))return null;

        Transaction tx = persistence.createTransaction();
        EntityManager em = persistence.getEntityManager();
        Object en=em.createQuery(
                "SELECT e FROM "+getMetaclassPrefix(entityType)+entityType+" e where e.id=:id")
                .setParameter("id",UUID.fromString(entityUUID))
                .getSingleResult();


        tx.commit();

        return (StandardEntity)en;
    }

    @Override
    public String getMetaclassPrefix(String entityType) {
        //// TODO: 04.07.2018  сделать более подробно
       if(entityType.equals("User")) return "sec$";
        else return "supply$";
    }

    @Override
    public List<SuppliersSuggestion> getSupplierSuggestions(QueriesPosition entity) {
        LoadContext<SuppliersSuggestion> loadContext = LoadContext.create(SuppliersSuggestion.class)
                .setQuery(LoadContext.createQuery("select ss from supply$SuppliersSuggestion ss where\n" +
                        "ss.posSup in (select ps from supply$PositionSupplier ps where ps.position.id=:idItem)")
                .setParameter("idItem",entity.getId()));

        return dataManager.loadList(loadContext);
    }

    @Override
    public void saveToken(String token, List<QueriesPosition> positionList) {
        QueriesPositionTokenLink tokenLink=metadata.create(QueriesPositionTokenLink.class);
        tokenLink.setPositions(positionList);
        tokenLink.setToken(token);
        dataManager.commit(tokenLink);
    }

    @Override
    public Collection<QueriesPosition> loadPositionsForToken(String token) {
        LoadContext<QueriesPositionTokenLink> loadContext = LoadContext.create(QueriesPositionTokenLink.class)
                .setQuery(LoadContext.createQuery("select qptl from supply$QueriesPositionTokenLink qptl where\n" +
                        "qptl.token =:tokenItem")
                        .setParameter("tokenItem",token))
                .setView("queriesPositionTokenLink-full");
        QueriesPositionTokenLink result=dataManager.load(loadContext);
        if(result==null) return null;
        return result.getPositions();
    }

    @Override
    public List<PositionSupplier> getSupplierPositions(Collection<QueriesPosition> positionCollection) {
        LoadContext<PositionSupplier> loadContext = LoadContext.create(PositionSupplier.class)
                .setQuery(LoadContext.createQuery("select ps from supply$PositionSupplier ps where\n" +
                        "ps.position in :positionItems")
                        .setParameter("positionItems",positionCollection))
                .setView("positionSupplier-full");

        return dataManager.loadList(loadContext);
    }
}