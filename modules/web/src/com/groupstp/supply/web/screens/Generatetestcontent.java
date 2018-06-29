package com.groupstp.supply.web.screens;

import com.groupstp.supply.entity.QueriesPosition;
import com.groupstp.supply.entity.Query;
import com.groupstp.supply.service.DataBaseTestContentService;
import com.groupstp.supply.service.QueryService;
import com.haulmont.cuba.gui.WindowManager;
import com.haulmont.cuba.gui.components.AbstractWindow;
import com.haulmont.cuba.gui.components.GroupTable;

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
    private GroupTable<Query> query;

    @Inject
    private GroupTable<QueriesPosition> queryPosition;

    public void onModal(){
        List<String> items= Arrays.asList("1","2","3","4","5","6","7");
        Map<String,Object> map=new HashMap<>();
        map.put("items",items);
        openWindow("chooseGroupOrder", WindowManager.OpenType.DIALOG,map);
    }

    public void onCreateCompany(){
        testContentService.createEntities();
    }
    public void onBusiness(){
        testContentService.beginBusinessProcess();
    }


}