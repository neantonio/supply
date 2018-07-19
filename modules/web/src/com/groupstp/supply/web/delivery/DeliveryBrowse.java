package com.groupstp.supply.web.delivery;

import com.groupstp.supply.entity.Delivery;
import com.groupstp.supply.entity.QueriesPosition;
import com.haulmont.cuba.core.global.DataManager;
import com.haulmont.cuba.core.global.LoadContext;
import com.haulmont.cuba.gui.components.AbstractLookup;
import com.haulmont.cuba.gui.components.Button;
import com.haulmont.cuba.gui.components.GroupTable;

import javax.inject.Inject;
import java.util.List;
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
        if (position != null) {
            buttonAddDelivery.setVisible(true);
            positionFromSupAndAnalisStage = position.iterator().next();
        }
    }

    public void onBtnAddClick() {
        Delivery delivery = deliveriesTable.getSingleSelected();
        if (delivery == null) {
            showNotification(getMessage("Select delivery first"), NotificationType.WARNING);
            return;
        } else {

            LoadContext<QueriesPosition> ctx = LoadContext.create(QueriesPosition.class)
                    .setQuery(LoadContext.createQuery("select q from supply$QueriesPosition q where q.id=:position")
                            .setParameter("position", positionFromSupAndAnalisStage.getId()))
                    .setView("queriesPosition-SupSelection");

            List<QueriesPosition> queriesPositionList = dataManager.loadList(ctx);
            QueriesPosition queriesPosition = queriesPositionList.size() > 0 ? queriesPositionList.get(0) : null;
            if (queriesPosition == null) {
                showNotification(getMessage("Позиция не найдена"), NotificationType.WARNING);
                return;
            } else if (delivery.equals(queriesPosition.getDelivery())) {
                close("");
                return;
            }
            queriesPosition.setDelivery(delivery);
            dataManager.commit(queriesPosition);
        }
        close("");
    }

}