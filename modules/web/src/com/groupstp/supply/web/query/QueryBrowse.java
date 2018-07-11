package com.groupstp.supply.web.query;

import com.groupstp.supply.entity.Analogs;
import com.groupstp.supply.entity.Nomenclature;
import com.groupstp.supply.entity.Query;
import com.groupstp.supply.service.QueryService;
import com.groupstp.supply.service.WorkflowService;
import com.haulmont.cuba.gui.WindowManager;
import com.haulmont.cuba.gui.components.*;
import com.haulmont.cuba.gui.components.actions.BaseAction;
import com.haulmont.cuba.gui.data.GroupDatasource;
import com.haulmont.cuba.gui.xml.layout.ComponentsFactory;

import javax.inject.Inject;
import java.util.*;

public class QueryBrowse extends AbstractLookup {

    @Inject
    GroupDatasource<Query, UUID> queriesDs;

    @Inject
    private Table<Query> queriesTable;

    @Inject
    private WorkflowService workflowService;

    @Inject
    private QueryService queryService;

    @Inject
    private ComponentsFactory factory;


    @Inject
    GroupDatasource<Query, UUID> queryDs;



    @Override
    public void init(Map<String, Object> params) {

        //всплывающее окно, в котором для каждой позиции отображаются аналоги, если они есть
        queriesTable.addGeneratedColumn("Analogs",entity1 -> {

            List<Nomenclature> nomenclatures = queryService.getQueryNomenclature(entity1);
            boolean hasAnalog=false;
            for(Nomenclature nomenclature:nomenclatures){
                if(nomenclature.getAnalogs().size()>0) hasAnalog=true;
            }
            if (hasAnalog) {

                PopupView popup=(PopupView) factory.createComponent(PopupView.NAME);
                popup.setMinimizedValue("аналоги");
                VBoxLayout layout=(VBoxLayout) factory.createComponent(VBoxLayout.NAME);

                int i=0;
                for(Nomenclature nomenclature:nomenclatures){

                    if(nomenclature.getAnalogs().size()>0){
                        PopupButton pButton=(PopupButton)factory.createComponent(PopupButton.NAME);
                        pButton.setCaption(nomenclature.getName());

                        for(Analogs analog:nomenclature.getAnalogs()){
                            pButton.addAction(new BaseAction(analog.getAnalog().getName()){
                                @Override
                                public void actionPerform(Component component) {
                                    openEditor(analog.getAnalog(), WindowManager.OpenType.DIALOG);
                                }
                            });
                            i++;
                        }
                        layout.add(pButton);
                    }
                }
                popup.setPopupContent(layout);

                return popup;
            }
            return null;

        });

        //раскрашивание строк в соответсвии со статусрм заявки
        queriesTable.setStyleProvider((entity, property) -> {

            if (property == null) {

                switch (queryService.getQueryStatus(entity)) {
                    case DONE:
                        return "done-query";
                    case IN_WORK:
                        return "in-work-query";
                    case NEW_ITEM:
                        return "new-query";
                    case OVERDUE:
                        return "overdue-query";
                    default:
                        return null;
                }

            } else if (property.equals("grade")) {
         }
            return null;
        });
    }

    /**
     * запрос подтвержения и отправка выбранных позиций в работу
     */
    public void onPassToWork(){
        Set<Query> selectedQueries = queriesTable.getSelected();
        if(selectedQueries.size()>0){


            makeConfirmDialog(messages.getMessage(MessageEnum.QUERY),messages.getMessage(MessageEnum.PASS_TO_WORK)+"?",()->{
                Set<Query> selectedQueries1 = queriesTable.getSelected();
                List<Query> selectedQueryList=new ArrayList<>();
                selectedQueries1.forEach(item->{
                    selectedQueryList.add(item);
                });
                queryService.beginQueryProcessing(selectedQueryList);
                queriesDs.refresh();
                queriesTable.repaint();
            });
        }
        else{
            showNotification(messages.getMessage(MessageEnum.SELECT_POSITION), NotificationType.WARNING_HTML);
        }

    }

    /**
     * создание окна подтверждения действия
     * @param header заголовок
     * @param content содержание(вопрос)
     * @param action действие, при нажатии ОК. лямбда без параметров
     */
    private void makeConfirmDialog(String header,String content,SomeAction action){
        String capitalHeader= header.substring(0, 1).toUpperCase() + header.substring(1);
        String capitalContent= content.substring(0, 1).toUpperCase() + content.substring(1);
        showOptionDialog(
                capitalHeader,
                capitalContent ,
                MessageType.CONFIRMATION,
                new Action[] {
                        new DialogAction(DialogAction.Type.YES) {
                            @Override
                            public void actionPerform(Component component) {
                                action.call();
                            }
                        },
                        new DialogAction(DialogAction.Type.NO)
                }
        );
    }

    interface SomeAction{
        void call();
    }
}

