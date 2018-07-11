package com.groupstp.supply.web.queriesposition;

import com.groupstp.supply.entity.PositionsAnalogs;
import com.haulmont.cuba.gui.components.AbstractEditor;
import com.groupstp.supply.entity.QueriesPosition;
import com.haulmont.cuba.gui.components.Table;
import com.haulmont.cuba.gui.data.CollectionDatasource;
import com.haulmont.cuba.gui.data.GroupDatasource;

import javax.inject.Inject;
import java.util.Map;
import java.util.UUID;

public class QueriesPositionEditAnalogs extends AbstractEditor<QueriesPosition> {

    @Inject
    private Table<PositionsAnalogs> analogsTable;

    @Inject
    private CollectionDatasource<PositionsAnalogs, UUID> analogsDs;

    public void onBtnCreateClick() {
        PositionsAnalogs analog = new PositionsAnalogs();
        analog.setQueriesPosition(getItem());
        analogsDs.addItem(analog);
    }
}