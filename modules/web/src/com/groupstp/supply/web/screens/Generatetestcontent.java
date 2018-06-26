package com.groupstp.supply.web.screens;

import com.google.common.collect.Iterables;
import com.groupstp.supply.entity.QueriesPosition;
import com.groupstp.supply.entity.Query;
import com.groupstp.supply.entity.QueryStatus;
import com.groupstp.supply.service.DataBaseTestContentService;
import com.groupstp.supply.service.QueryService;
import com.haulmont.addon.dnd.components.DDVerticalLayout;
import com.haulmont.addon.dnd.components.DDVerticalLayoutTargetDetails;
import com.haulmont.addon.dnd.components.DropHandler;
import com.haulmont.addon.dnd.components.LayoutBoundTransferable;
import com.haulmont.addon.dnd.components.acceptcriterion.AcceptCriterion;
import com.haulmont.addon.dnd.components.dragevent.DragAndDropEvent;
import com.haulmont.addon.dnd.components.enums.VerticalDropLocation;
import com.haulmont.cuba.gui.WindowManager;
import com.haulmont.cuba.gui.components.*;
import com.haulmont.cuba.gui.components.actions.BaseAction;
import com.haulmont.cuba.gui.xml.layout.ComponentsFactory;

import javax.inject.Inject;
import java.util.*;

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