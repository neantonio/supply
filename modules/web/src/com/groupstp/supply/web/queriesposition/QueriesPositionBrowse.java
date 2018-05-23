package com.groupstp.supply.web.queriesposition;

import com.groupstp.supply.entity.QueriesPosition;
import com.groupstp.supply.entity.Query;
import com.groupstp.supply.service.WorkflowService;
import com.haulmont.cuba.gui.components.*;

import javax.inject.Inject;
import java.util.Set;

public class QueriesPositionBrowse extends AbstractLookup {

    @Inject
    private GroupTable<QueriesPosition> positionsNomControl;

    @Override
    public void ready() {
        super.ready();
        setupNomControl();
    }

    private void setupNomControl()
    {
        GroupTable<QueriesPosition> p = positionsNomControl;
        p.groupBy(new Object[]{
                p.getColumn("query.urgency").getId(),
                p.getColumn("query.company").getId(),
                p.getColumn("query.division").getId(),
                p.getColumn("query").getId()});
    }

    public void onBtnSetQueryUsefulnessClick() {
        QueriesPosition position = positionsNomControl.getSingleSelected();
        if(position==null)
        {
            showNotification(getMessage("Select position first"), NotificationType.WARNING);
            return;
        }
        Query query = position.getQuery();
    }

    public void onBtnExpandAllClick() {
        positionsNomControl.expandAll();
    }

    public void onBtnCollapseAllClick() {
        positionsNomControl.collapseAll();
    }

    @Inject
    private WorkflowService workflowService;

    @Inject
    private TabSheet tabs;

    /**
     * Для списка выделенных позиций пытается первести их на следующий этап
     */
    public void onBtnDoneClick() throws Exception {
        String errors = "";
        GroupTable<QueriesPosition> grpTab = getOpenedStageTable();
        Set<QueriesPosition> positions = grpTab.getSelected();
        for (QueriesPosition position: positions) {
                workflowService.movePosition(position);
        }
        grpTab.getDatasource().refresh();
    }

    /**
     * Обработчик нажатия кнопки Записать.
     * Записывает изменния таблицы в БД.
     */
    public void onBtnWriteClick() {
        GroupTable<QueriesPosition> tab = getOpenedStageTable();
        tab.getDatasource().commit();
    }

    public String getOpenedStage()
    {
        return tabs.getSelectedTab().getName().replace("tab", "");
    }

    public GroupTable<QueriesPosition> getOpenedStageTable()
    {
        return (GroupTable<QueriesPosition>) tabs.getComponentNN("positions"+getOpenedStage());
    }
}