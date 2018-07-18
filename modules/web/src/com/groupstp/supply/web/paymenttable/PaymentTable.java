package com.groupstp.supply.web.paymenttable;

import com.groupstp.supply.entity.PaymentTableItem;
import com.haulmont.cuba.gui.components.AbstractLookup;
import com.haulmont.cuba.gui.components.Component;
import com.haulmont.cuba.gui.components.GroupTable;
import com.haulmont.cuba.gui.components.Label;
import com.haulmont.cuba.gui.data.CollectionDatasource;
import com.haulmont.cuba.gui.xml.layout.ComponentsFactory;
import org.apache.commons.lang.time.DateUtils;

import javax.inject.Inject;
import javax.inject.Named;
import java.util.Calendar;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

/**
 * @author AlexandrMiroshkin
 * Таблица платежей
 */

public class PaymentTable extends AbstractLookup {

    @Named("paymentTableDs")
    private CollectionDatasource<PaymentTableItem,UUID> paymentTableDs;

    @Named("paymentTable")
    private GroupTable<PaymentTableItem> paymentTable;

    @Named("paymentGroupTableDs")
    private PaymentGroupTableDs paymentGroupTableDs;

    @Named("centerMonthTitle")
    private Label centerMonthTitle;

    @Named("rightMonthTitle")
    private Label rightMonthTitle;

    @Inject
    private ComponentsFactory factory;

    private Date currentSelectedDate;

    @Override
    public void init(Map<String, Object> params) {
        super.init(params);

        //Set current date
        currentSelectedDate = new Date();

        setMonthLabels();

        paymentTable.setColumnReorderingAllowed(false);

    }


    private void setMonthLabels(){
        Calendar cal = Calendar.getInstance();
        cal.setTime(currentSelectedDate);
        String monthName = getMonthForInt(cal.get(Calendar.MONTH));
        int year = cal.get(Calendar.YEAR);
        centerMonthTitle.setValue(String.format(monthName));
        rightMonthTitle.setValue(String.format("%s %d",monthName,year));

    }

    private void selectMoth(int amount){
        currentSelectedDate = DateUtils.addMonths(currentSelectedDate, amount);
        paymentGroupTableDs.setCurrentDate(currentSelectedDate);
        paymentGroupTableDs.refresh();
        setMonthLabels();
    }


    public void selectNextMonth(Component source) {
        selectMoth(1);
    }


    public void selectPrevMonth(Component source) {
        selectMoth(-1);
    }


    private String getMonthForInt(int num) {
        String month = "wrong";

        switch(num){

            case 0:
                return "Январь";
            case 1:
                return "Февраль";
            case 2:
                return "Март";
            case 3:
                return "Апрель";
            case 4:
                return "Май";
            case 5:
                return "Июнь";
            case 6:
                return "Июль";
            case 7:
                return "Август";
            case 8:
                return "Сентябрь";
            case 9:
                return "Октябрь";
            case 10:
                return "Ноябрь";
            case 11:
                return "Декабрь";

            default:
                return month;

        }

    }




}