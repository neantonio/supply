package com.groupstp.supply.web.screens;

import com.groupstp.supply.entity.QueriesPosition;
import com.groupstp.supply.entity.Query;
import com.groupstp.supply.service.DataBaseTestContentService;
import com.groupstp.supply.service.QueryService;
import com.groupstp.supply.service.TaskService;
import com.haulmont.cuba.gui.WindowManager;
import com.haulmont.cuba.gui.components.*;
import com.haulmont.cuba.gui.data.CollectionDatasource;

import javax.inject.Inject;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * @author AntonLomako
 * окно с кнопками для темтов
 */
public class Generatetestcontent extends AbstractWindow {

    @Inject
    DataBaseTestContentService testContentService;

    @Inject
    QueryService queryService;

    @Inject
    TaskService taskService;

    @Inject
    private GroupTable<Query> query;

    @Inject
    private GroupTable<QueriesPosition> queryPosition;

    @Inject
    private TextField fileName;

    @Inject
    private CollectionDatasource queriesDs;

    public void onModal(){
        List<String> items= Arrays.asList("1","2","3","4","5","6","7");
        Map<String,Object> map=new HashMap<>();
        map.put("items",items);
        openWindow("chooseGroupOrder", WindowManager.OpenType.DIALOG,map);
    }

    public void onCreateCompany(){
        queriesDs.refresh();
        if(queriesDs.getItems().size()>0)   {
            showNotification("в базе что-то есть. сначала нужно очистить базу",NotificationType.HUMANIZED);
        }
        else {
            if ((fileName.getRawValue() == null) || fileName.getRawValue().equals(""))
                showNotification("нужно указать путь к файлу pricetin.xls", NotificationType.HUMANIZED);
            else testContentService.createEntities(fileName.getRawValue());
        }
    }
    public void onClear(){
        String capitalHeader= "очиска бд";
        String capitalContent= "Очистить бд полностью?";
        showOptionDialog(
                capitalHeader,
                capitalContent ,
                MessageType.CONFIRMATION,

                new Action[] {
                        new DialogAction(DialogAction.Type.YES) {
                            @Override
                            public void actionPerform(Component component) {
                                testContentService.clearDataBase();

                            }
                        },
                        new DialogAction(DialogAction.Type.NO)
                }
        );
    }
    public void onBusiness(){
        testContentService.beginBusinessProcess();
    }





    public void onBeginNotifyClick() {
        taskService.beginEmailNotificationOnAnalysisTimeRunningOut();
    }

    public void onStopNotifyClick() {
        taskService.stopEmailNotificationOnAnalysisTimeRunningOut();
    }
}