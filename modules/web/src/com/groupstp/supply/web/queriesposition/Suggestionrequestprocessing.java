package com.groupstp.supply.web.queriesposition;

import com.groupstp.supply.entity.PositionSupplier;
import com.groupstp.supply.entity.QueriesPosition;
import com.haulmont.cuba.gui.components.AbstractWindow;
import com.haulmont.cuba.gui.components.VBoxLayout;
import com.haulmont.cuba.gui.data.GroupDatasource;

import javax.inject.Inject;
import java.util.Map;
import java.util.UUID;

public class Suggestionrequestprocessing extends AbstractWindow {

    @Inject
    private GroupDatasource<QueriesPosition,UUID> positionsWithoutSupplierDs;

    @Inject
    private GroupDatasource<PositionSupplier,UUID> alreadySendRequest;

    @Inject
    private VBoxLayout withoutSupplierVbox;

    @Inject
    private VBoxLayout repeatedSendVbox;

    @Override
    public void init(Map<String, Object> params) {

    }

    public void onSuppliersClick() {
    }

    public void onCheckAndSendClick() {
    }

    public void onSendToSelectedClick() {
    }

    public void onSendToAllAgainClick() {
    }
}