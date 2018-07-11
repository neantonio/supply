package com.groupstp.supply.service;

import com.groupstp.supply.entity.QueriesPosition;
import com.haulmont.cuba.core.global.DataManager;
import com.haulmont.cuba.core.global.LoadContext;
import org.springframework.stereotype.Service;

import javax.inject.Inject;
import java.util.Date;
import java.util.List;

@Service(PaymentTableService.NAME)
public class PaymentTableServiceBean implements PaymentTableService {
    @Inject
    private DataManager dataManager;

    @Override
    public List<QueriesPosition> getItems(Date start, Date end) {
        LoadContext<QueriesPosition> loadContext = LoadContext.create(QueriesPosition.class)
                .setQuery(LoadContext.createQuery("select b from supply$QueriesPosition b where b.bills.timePayment between :start and :end ")
                        .setParameter("start",start).setParameter("end",end))
                        .setView("queriesPosition-payment-table");

        return dataManager.loadList(loadContext);
    }

}