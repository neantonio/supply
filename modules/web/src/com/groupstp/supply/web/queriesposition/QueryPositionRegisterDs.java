package com.groupstp.supply.web.queriesposition;

import com.groupstp.supply.entity.QueriesPosition;
import com.groupstp.supply.entity.StageTerm;
import com.groupstp.supply.entity.Stages;
import com.groupstp.supply.service.QueryDaoService;
import com.groupstp.supply.service.QueryService;
import com.haulmont.cuba.core.global.AppBeans;
import com.haulmont.cuba.core.global.Messages;
import com.haulmont.cuba.core.global.UserSessionSource;
import com.haulmont.cuba.gui.data.CollectionDatasource;
import com.haulmont.cuba.gui.data.impl.CustomGroupDatasource;
import com.haulmont.cuba.security.entity.User;

import javax.inject.Inject;
import java.util.*;

/**
 * @author AntonLomako
 * Нужен для того чтобы передать в сущности лямбду, генерирующую их информаттивное имя, отображаемое при группировке.
 * стандартный датасорс используется для фильтрации
 * для группировки по полю планируемая дата исполнения используется поле updateTs
 * для группировки по полю текущий этап просрочен используется поле флаг analogAllowed
 * при сохранении сущности обратно в базу необходимо получать ее исходную копию, т.к. поля были изменены
 */
public class QueryPositionRegisterDs extends CustomGroupDatasource<QueriesPosition, UUID> {

    @Inject
    private QueryDaoService queryDaoService= AppBeans.get(QueryDaoService.NAME);

    @Inject
    private QueryService queryService=AppBeans.get(QueryService.NAME);




    private
    CollectionDatasource queriesPositionDs;


    @Inject
    private Messages messages=AppBeans.get(Messages.NAME);



    private  boolean archiveFilterEnabler=false;
    private  boolean userAuthorFilterEnabled =false;
    private boolean userContactFilterEnabled =false;

    @Override
    protected Collection<QueriesPosition> getEntities(Map<String, Object> params) {

        Collection <QueriesPosition>queriesPositions;
        Collection<StageTerm> stageTerms;
        List <QueriesPosition> resultQueriesPositions=new ArrayList<>();

        queriesPositions=queriesPositionDs==null? queryDaoService.getAllQueriesPosition(): queriesPositionDs.getItems();


        Date today=new Date();
        queriesPositions.forEach(position->{

            if(isArchiveFilterEnabler()){
                if(!((position.getCurrentStage()== Stages.Abortion)||(position.getCurrentStage()==Stages.Done))){
                    resultQueriesPositions.add(position);
                }
                else{
                    return;
                }
            }
            if(isUserAuthorFilterEnabled()){
                User u = AppBeans.get(UserSessionSource.class).getUserSession().getUser();
                if(u.getLogin().equals(position.getQuery().getCreatedBy())){
                    resultQueriesPositions.add(position);
                }
                else{
                    return;
                }
            }
            //// TODO: 22.06.2018 проверить имена 
            if(isUserContactFilterEnabled()){
                User u = AppBeans.get(UserSessionSource.class).getUserSession().getUser();
                if(position.getQuery().getContact()==null) return;
                if(u.getLogin().equals(position.getQuery().getContact().getName())){
                    resultQueriesPositions.add(position);
                }
                else{
                    return;
                }
            }

            resultQueriesPositions.add(position);


                    position.setNameCallback(qp->{
                        String result="";
                        switch (qp.getPositionType()){
                           case specification:result=messages.getMainMessage("specification")+": "+qp.getSpecification(); break;
                           case nomenclature:result=messages.getMainMessage("nomenclature")+": "+qp.getNomenclature().getName(); break;
                        }

                        result=result+"\n";
                        if(qp.getNomenclature()!=null) result=result+messages.getMainMessage("nomenclature")+": "+qp.getNomenclature().getName()+"\n";
                        if(qp.getCurrentStage()!=null) result=result+messages.getMainMessage("stage")+": "+qp.getCurrentStage()+"\n";
                        result=result+messages.getMainMessage("executionTime")+": "+queryService.getExecutionTimeForQueriesPosition(qp,false);
                        return result;
                    });
                    position.getQuery().setNameCallback(q->{
                        String result="";

                        if(q.getContact()!=null) result=result+ messages.getMainMessage("consumer")+": "+q.getContact().getName()+"\n";
                        if(q.getStore()!=null)       result=result+ messages.getMainMessage("store")+": "+q.getStore().getName()+"\n";
                        if(q.getUrgency()!=null) result=result+messages.getMainMessage("urgency")+": "+q.getUrgency().getName();

                        return result;

                    });

//            position.setAnalogsAllowed(queryService.getStageExecutionTimeForQueriesPosition(position).getTime()<today.getTime());
//            position.setUpdateTs(queryService.getExecutionTimeForQueriesPosition(position,false));
            }


        );

        return resultQueriesPositions;
    }



    public void setQueriesPositionDs(CollectionDatasource queriesPositionDs) {
        if(this.queriesPositionDs!=null) return;
        this.queriesPositionDs = queriesPositionDs;
        queriesPositionDs.refresh();
        queriesPositionDs.addCollectionChangeListener(event->{
            refresh();
        });

    }

    public void toggleArchiveFilter(){
        archiveFilterEnabler=!isArchiveFilterEnabler();
        refresh();

//        LogicalCondition andCondition = new LogicalCondition("", LogicalOp.AND);
//        Clause clause=new Clause("", "((e.currentStage not in :component$filterWithoutId.currentStage31383) or (e.currentStage is null)) \n" +"      \n" +"    ", null, null, null);
//        clause.setName("currentStage");
//        clause.getConditions().add(new Condition() {
//            @Override
//            public List<Condition> getConditions() {
//                return null;
//            }
//
//            @Override
//            public void setConditions(List<Condition> conditions) {
//
//            }
//
//            @Override
//            public Set<ParameterInfo> getParameters() {
//                ParameterInfo = new ParameterInfo();
//                return null;
//            }
//
//            @Override
//            public Set<String> getJoins() {
//                return null;
//            }
//        });
//        andCondition.getConditions().add(clause);
//        //queriesPositionDs.getQueryFilter().getParameters().add(new ParameterInfo())
//        QueryFilter queryFilter = new QueryFilter(andCondition);
//        if(queriesPositionDs!=null) queriesPositionDs.setQueryFilter(queryFilter);
//
//        queriesPositionDs.refresh();
//        refresh();

    }

    public boolean isArchiveFilterEnabler() {
        return archiveFilterEnabler;
    }

    public boolean isUserAuthorFilterEnabled() {
        return userAuthorFilterEnabled;
    }

    public void setUserAuthorFilterEnabled(boolean userAuthorFilterEnabled) {
        this.userAuthorFilterEnabled = userAuthorFilterEnabled;
    }

    public boolean isUserContactFilterEnabled() {
        return userContactFilterEnabled;
    }

    public void setUserContactFilterEnabled(boolean userContactFilterEnabled) {
        this.userContactFilterEnabled = userContactFilterEnabled;
    }

    public void toggleContactFilter() {
        userContactFilterEnabled=!userContactFilterEnabled;
        refresh();
    }

    public void toggleAuthorFilter() {
        userAuthorFilterEnabled=!userAuthorFilterEnabled;
        refresh();
    }
}
