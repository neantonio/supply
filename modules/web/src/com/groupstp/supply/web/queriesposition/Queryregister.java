package com.groupstp.supply.web.queriesposition;

import com.groupstp.supply.entity.QueriesPosition;
import com.groupstp.supply.entity.QueryPositionMovements;
import com.groupstp.supply.entity.Stages;
import com.groupstp.supply.service.QueryDaoService;
import com.groupstp.supply.service.WorkflowService;
import com.haulmont.cuba.gui.WindowManager;
import com.haulmont.cuba.gui.components.*;
import com.haulmont.cuba.gui.data.CollectionDatasource;
import com.haulmont.cuba.gui.xml.layout.ComponentsFactory;
import com.haulmont.cuba.security.entity.User;
import com.haulmont.cuba.web.gui.components.WebGroupTable;

import javax.inject.Inject;
import java.util.*;

/**
 * @author AntonLomako
 * реейст позиций
 */
public class Queryregister extends AbstractWindow {

    @Inject
    private WebGroupTable<QueriesPosition> positionsTable;

    @Inject
    QueryPositionRegisterDs cqueriesPositionRegisterDs;

    @Inject
    CollectionDatasource queriesPositionsDs;

    @Inject
    Button archiveFilterButton;

    @Inject
    Button authorFilterButton;

    @Inject
    Button contactFilterButton;

    @Inject
    Filter positionFilter;

    @Inject
    private LookupPickerField nomSearch;

    @Inject
    private QueryDaoService queryDaoService;

    @Inject
    private WorkflowService workflowService;

    @Inject
    private ComponentsFactory factory;

    List<Object> currentGroupOrderItems=new ArrayList<>();
    List<Object> availableGroupOrderItems=new ArrayList<>();

    Map<Object,String> availableGroupOrderItemsDescription=new HashMap<>();

    @Override
    public void init(Map<String, Object> params) {

        //передаем стандартный датасорс в кастомный т.к. инджектироваться он не хочет
        cqueriesPositionRegisterDs.setQueriesPositionDs(queriesPositionsDs);

        Date today=new Date();
        //колонка со всплывающим окном, содержащим историю перемещений
        positionsTable.addGeneratedColumn("История перемещений",queriesPosition -> {

            List<QueryPositionMovements> queryPositionMovementsList = queryDaoService.getQueryPositionMovement(queriesPosition);

            if (queryPositionMovementsList.size()>0) {
            PopupView popup=(PopupView) factory.createComponent(PopupView.NAME);
            popup.setMinimizedValue("история");
            VBoxLayout Vlayout=(VBoxLayout) factory.createComponent(VBoxLayout.NAME);

            for(QueryPositionMovements movement:queryPositionMovementsList ){

                HBoxLayout Hlayout=(HBoxLayout) factory.createComponent(HBoxLayout.NAME);

                //извлекаем время завершения из журнала, если его нет, то этап длится до сих пор
                Label finishDateLabel= (Label) factory.createComponent(Label.NAME);
                Label durationLabel= (Label) factory.createComponent(Label.NAME);
                long hourDuration=0;
                if(movement.getFinishTS()!=null){
                    finishDateLabel.setValue(messages.getMainMessage("date_finish")+": "+String.format("%td.%tm.%ty",movement.getFinishTS(),movement.getFinishTS(),movement.getFinishTS()));
                    hourDuration=(movement.getFinishTS().getTime()-movement.getCreateTs().getTime());
                }
                else{
                    hourDuration=(today.getTime()-movement.getCreateTs().getTime());
                }

                //значение продолжительности выводится часах с разделением на дни
                hourDuration=hourDuration/1000/60/60;
                String durationStringValue;
                if(hourDuration>24){
                    durationStringValue=String.format("%dд %dч",hourDuration%24,Math.round(hourDuration-hourDuration%24*24));
                } else{
                    durationStringValue=String.format("%dч",hourDuration);
                }
                durationLabel.setValue(messages.getMainMessage("duration")+": "+durationStringValue);


                Label beginDateLabel= (Label) factory.createComponent(Label.NAME);
                beginDateLabel.setValue(messages.getMainMessage("date_begin")+": "+String.format("%td.%tm.%ty",movement.getCreateTs(),movement.getCreateTs(),movement.getCreateTs()));

                Label userLabel= (Label) factory.createComponent(Label.NAME);
                userLabel.setValue(messages.getMainMessage("user")+": "+movement.getUser().getName());

                Label stageLabel= (Label) factory.createComponent(Label.NAME);
                stageLabel.setValue(messages.getMainMessage("stage")+": "+movement.getStage());

                Hlayout.add(stageLabel);
                Hlayout.add(userLabel);
                Hlayout.add(beginDateLabel);
                if(movement.getFinishTS()!=null){Hlayout.add(finishDateLabel);}
                Hlayout.add(durationLabel);
                Hlayout.setSpacing(true);
                Vlayout.add(Hlayout);

            }
                popup.setPopupContent(Vlayout);
                return popup;
            }
            return null;

        });

        List<String> columnIds=Arrays.asList(
               "currentStage",
                "query",
                "query.contact",
                "store",
               "query.division",
                "query.company",
                "query.origin",
                "updateTs",
                "analogsAllowed"
        );
        List <Table.Column> c=positionsTable.getColumns();

        // доступные элементы для группировки с их описанием
        for(String id:columnIds){
            Table.Column column=positionsTable.getColumn(id);
            availableGroupOrderItems.add(column.getId());
            availableGroupOrderItemsDescription.put(column.getId(),column.getCaption());
        }

        //текущий порядок группировки
        currentGroupOrderItems.add(availableGroupOrderItems.get(1));
        currentGroupOrderItems.add(availableGroupOrderItems.get(5));
        currentGroupOrderItems.add(availableGroupOrderItems.get(4));
        currentGroupOrderItems.add(availableGroupOrderItems.get(2));

    }

    @Override
    public void ready() {
        makeGroup();
    }

    private void makeGroup() {
        positionsTable.groupBy(currentGroupOrderItems.toArray());

    }

    /**
     * переключение фильтрации архивных позиций
     */
    public void onArchiveFlagChange(){
        cqueriesPositionRegisterDs.toggleArchiveFilter();
        if(cqueriesPositionRegisterDs.isArchiveFilterEnabler()){
            archiveFilterButton.setCaption(messages.getMainMessage("show_archive"));
        }
        else{
            archiveFilterButton.setCaption(messages.getMainMessage("hide_archive"));
        }
    }
    public void onContactFlagChange(){
        cqueriesPositionRegisterDs.toggleContactFilter();
        if(!cqueriesPositionRegisterDs.isUserContactFilterEnabled()){
            contactFilterButton.setCaption(messages.getMainMessage("show_i_contact"));
        }
        else{
            contactFilterButton.setCaption(messages.getMainMessage("cancel_i_contact"));
        }
    }

    public void onAuthorFlagChange(){
        cqueriesPositionRegisterDs.toggleAuthorFilter();
        if(!cqueriesPositionRegisterDs.isUserAuthorFilterEnabled()){
            authorFilterButton.setCaption(messages.getMainMessage("show_i_author"));
        }
        else{
            authorFilterButton.setCaption(messages.getMainMessage("cancel_i_author"));
        }
    }

    /**
     * отмеена позиции
     */
    public void onCancelPosition(){
        Set<QueriesPosition> queryPositions=positionsTable.getSelected();
        if(queryPositions.size()>0){
            queryPositions.forEach(qp->{
                //в текущей сущности устанавливаем флаг для корректного отображения в таблице
                qp.setCurrentStage(Stages.Abortion);
                //нужно получить исходник т.к для группировки по ассчитываемым полям использовались не отображенные поля сущности
                workflowService.movePositionTo(queryDaoService.getQueryPositionCopy(qp),Stages.Abortion);
            });
            cqueriesPositionRegisterDs.refresh();
        }
        else{
            showNotification(messages.getMainMessage("Select_position_first"), NotificationType.WARNING_HTML);
        }


    }

    /**
     * отправка писем по всем выделенным позиция. создается окно для ввода темы и содержания. если ничего не выбрано выводится уведомление
     */
    public void onSendEmail(){

        Set<QueriesPosition> selectedQueriesPositions=positionsTable.getSelected();
        if(selectedQueriesPositions.size()>0){
            List<String> addresses=new ArrayList<>();
            Map<String,Object> params=new HashMap<>();
            selectedQueriesPositions.forEach(item->{
               User user= item.getQuery().getContact();
                if(user!=null) {
                    addresses.add(user.getEmail());
                }
            });
            params.put("receivers",addresses);
            openWindow("SendEmail", WindowManager.OpenType.DIALOG,params);
        }
        else showNotification(messages.getMainMessage("Select_position_first"),NotificationType.WARNING);

    }


    public void onChangeGroupOrder(){
        createGroupOrderDialog(currentGroupOrderItems,availableGroupOrderItems,availableGroupOrderItemsDescription,map->{
        int i=0;
        List<Map.Entry<String,Object>> entries= (List<Map.Entry<String, Object>>) map.get("currentOrder");
        Object[] obj =new Object[entries.size()];

        currentGroupOrderItems.clear();;

        for(Map.Entry ent:entries){
            obj[i]=ent.getValue();
            i++;
            currentGroupOrderItems.add(ent.getValue());
        }
        positionsTable.groupBy(obj);
    });
    }


    /**
     * создает окно с перетаскиваемыми элементыми. при завершении выполняет SomeAction с параметром Map, в котором будет запись currentOrder - результирующий порядок
     *
     */
    public void createGroupOrderDialog(List<Object> currentOrder, List<Object> availableOrderItems, Map<Object,String> itemDescription, SomeAction okAction){

        List<Map.Entry> availableItems=new ArrayList<>();
        List<Map.Entry> currentOrderEntry=new ArrayList<>();

        for(Object orderItem:availableOrderItems){
            availableItems.add(new AbstractMap.SimpleEntry<String,Object>(itemDescription.get(orderItem),orderItem));
        }

        for(Object orderItem:currentOrder){
            currentOrderEntry.add(new AbstractMap.SimpleEntry<String,Object>(itemDescription.get(orderItem),orderItem));
        }

        Map<String,Object> map=new HashMap<>();
        Map<String,Object> param=new HashMap<>();
        map.put("availableItems",availableItems);
        map.put("currentOrder",currentOrderEntry);
        param.put("params",map);

        openWindow("chooseGroupOrder", WindowManager.OpenType.DIALOG,param)
                .addCloseListener(data->{
                    if(data.equals("ok"))okAction.execute(map);
                });

    }

    interface SomeAction{
        void execute(Map map);
    }


}