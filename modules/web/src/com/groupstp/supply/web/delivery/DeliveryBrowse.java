package com.groupstp.supply.web.delivery;

import com.groupstp.supply.entity.Delivery;
import com.groupstp.supply.entity.QueriesPosition;
import com.haulmont.cuba.core.global.DataManager;
import com.haulmont.cuba.gui.components.AbstractLookup;
import com.haulmont.cuba.gui.components.Button;
import com.haulmont.cuba.gui.components.GroupTable;

import javax.inject.Inject;
import java.util.Map;
import java.util.Set;

public class DeliveryBrowse extends AbstractLookup {
    @Inject
    private DataManager dataManager;

    @Inject
    private GroupTable<Delivery> deliveriesTable;

    @Inject
    private Button buttonAddDelivery;

    private QueriesPosition positionFromSupAndAnalisStage;

    @Override
    public void init(Map<String, Object> params) {
        super.init(params);
        Set<QueriesPosition> position = (Set<QueriesPosition>) params.get("position");
        if (position!=null) {
            buttonAddDelivery.setVisible(true);
            positionFromSupAndAnalisStage = position.iterator().next();
        }
    }

    public void onBtnAddClick() {
        Delivery delivery = deliveriesTable.getSingleSelected();
        if(delivery==null)
        {
            showNotification(getMessage("Select delivery first"), NotificationType.WARNING);
            return;
        } else {
            positionFromSupAndAnalisStage.setDelivery(delivery);
            dataManager.commit(positionFromSupAndAnalisStage);
        }
    }

}