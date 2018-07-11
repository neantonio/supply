package com.groupstp.supply.web.paymenttable;

import com.groupstp.supply.entity.PaymentTableItem;
import com.groupstp.supply.entity.QueriesPosition;
import com.groupstp.supply.service.PaymentTableService;
import com.groupstp.supply.utils.DateTimeUtils;
import com.haulmont.cuba.core.global.AppBeans;
import com.haulmont.cuba.gui.data.impl.CustomGroupDatasource;

import javax.inject.Inject;
import java.util.*;

/**
 * @author AlexandrMiroshkin
 * Datasource элементов таблицы платежей.
 */
public class PaymentGroupTableDs extends CustomGroupDatasource<PaymentTableItem,UUID> {

    @Inject
    private PaymentTableService paymentTableService = AppBeans.get(PaymentTableService.NAME);

    private Date currentDate;


    @Override
    protected Collection<PaymentTableItem> getEntities(Map<String, Object> params) {
        if(currentDate == null)
            currentDate = new Date();

        List<QueriesPosition> dbItems = paymentTableService.getItems(DateTimeUtils.getFirstDayOfMonth(currentDate),
                DateTimeUtils.getLastDayOfMonth(currentDate));

        return convertToPayment(dbItems);
    }

    private Collection<PaymentTableItem> convertToPayment(Collection<QueriesPosition> dbItems){
        List<PaymentTableItem> resultItems = new ArrayList<>();
        dbItems.forEach(position->{
               PaymentTableItem item = new PaymentTableItem();
               item.setId(position.getUuid());
               item.setBills(position.getBills());
               item.setQuery(position.getQuery());
               item.setPayDate(position.getBills().getTimePayment());
               item.setPrice(position.getBills().getPrice());
               item.setPosition(position.getNomenclature().getName());
               fillDecade(item);
               resultItems.add(item);
        });

       return resultItems;
    }


    private void fillDecade(PaymentTableItem item){
        if(item.getPayDate() != null){
            Calendar cal = Calendar.getInstance();
            cal.setTime(item.getPayDate());
            int day= cal.get(Calendar.DAY_OF_MONTH);

            if(day < 11)
                item.setFirstDecade(item.getPrice());

            else if (day < 20)
                item.setSecondDecade(item.getPrice());
            else
                item.setThirdDecade(item.getPrice());

        }
    }

    public void setCurrentDate(Date currentDate) {
        this.currentDate = currentDate;
    }

}
