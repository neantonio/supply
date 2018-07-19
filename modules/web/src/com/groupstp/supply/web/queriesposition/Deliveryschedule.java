package com.groupstp.supply.web.queriesposition;

import com.groupstp.supply.entity.Delivery;
import com.groupstp.supply.entity.DeliveryLine;
import com.groupstp.supply.entity.QueriesPosition;
import com.haulmont.cuba.gui.components.AbstractWindow;
import com.haulmont.cuba.gui.components.GroupTable;
import com.haulmont.cuba.gui.components.Label;
import com.haulmont.cuba.gui.data.CollectionDatasource;
import com.haulmont.cuba.gui.data.GroupDatasource;
import com.haulmont.cuba.gui.xml.layout.ComponentsFactory;

import javax.inject.Inject;
import java.time.LocalDate;
import java.time.Month;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

/**
 * @author Andrey Kolosov
 */
public class Deliveryschedule extends AbstractWindow {

    @Inject
    private GroupTable<QueriesPosition> queriesPositionsTable;

    @Inject
    protected ComponentsFactory componentsFactory;

    private Set<String> columnAllSet = new HashSet<>();

    private Map<Month, String> monthStringMap = new LinkedHashMap<>();

    @Inject
    private GroupDatasource<QueriesPosition, UUID> queriesPositionsDs;

    private boolean collapsedColumns = true;

    @Override
    public void init(Map<String, Object> params) {

        /**
         * По умолчанию таблица разворачивается по всем группировкам
         */
        queriesPositionsDs.addCollectionChangeListener(e -> {
            if (e.getOperation().equals(CollectionDatasource.Operation.REFRESH)) {
                queriesPositionsTable.expandAll();
            }
        });

        /**
         * Заполнение мапы на соответствие месяца и его русскому названию
         */
        monthStringMap.put(Month.JANUARY, "Янв");
        monthStringMap.put(Month.FEBRUARY, "Фев");
        monthStringMap.put(Month.MARCH, "Мар");
        monthStringMap.put(Month.APRIL, "Апр");
        monthStringMap.put(Month.MAY, "Май");
        monthStringMap.put(Month.JUNE, "Июн");
        monthStringMap.put(Month.JULY, "Июл");
        monthStringMap.put(Month.AUGUST, "Авг");
        monthStringMap.put(Month.SEPTEMBER, "Сен");
        monthStringMap.put(Month.OCTOBER, "Окт");
        monthStringMap.put(Month.NOVEMBER, "Ноя");
        monthStringMap.put(Month.DECEMBER, "Дек");

        /**
         * добавление генерируемых колонок
         */

        LocalDate today = LocalDate.now();
        List<Integer> yearList = Arrays.asList(today.getYear(), today.getYear() + 1);
        yearList.forEach(year -> {
            monthStringMap.forEach((k, month) -> {
                LocalDate dayForColumn = today.withMonth(k.getValue()).withYear(year);

                String nameFirstColumn = "01-10 "+month+" "+year;
                queriesPositionsTable.addGeneratedColumn(nameFirstColumn, entity ->
                        addGenColumn(dayForColumn.withDayOfMonth(1), dayForColumn.withDayOfMonth(10), entity));
                columnAllSet.add(nameFirstColumn);

                String nameSecondColumn = "11-20 "+month+" "+year;
                queriesPositionsTable.addGeneratedColumn(nameSecondColumn, entity ->
                        addGenColumn(dayForColumn.withDayOfMonth(11), dayForColumn.withDayOfMonth(20), entity));
                columnAllSet.add(nameSecondColumn);

                String nameThirdColumn = "21-" + dayForColumn.with(TemporalAdjusters.lastDayOfMonth()).getDayOfMonth()+" "+month+" "+year;
                queriesPositionsTable.addGeneratedColumn(nameThirdColumn, entity ->
                        addGenColumn(dayForColumn.withDayOfMonth(21), dayForColumn.with(TemporalAdjusters.lastDayOfMonth()), entity));
                columnAllSet.add(nameThirdColumn);

            });
        });

        onBtnHideNullColumnDelivery();
    }

    /**
     * метод генерации ячейки
     * подсчитыает сколько груза прибудет в промежуток между startDate и endDate
     *
     * @param startDate первый день временного интервала доставки
     * @param endDate   последний день временного интервала доставки
     * @param entity    позиция
     * @return возращение ячейки с расчитаным значением
     */
    private Label addGenColumn(LocalDate startDate, LocalDate endDate, QueriesPosition entity) {
        Label field = (Label) componentsFactory.createComponent(Label.NAME);
        if (entity.getDelivery() == null) {
            return null;
        }
        List<DeliveryLine> deliveryLineList = entity.getDelivery().getDeliveryLine();
        Double sum = deliveryLineList.stream().filter(e -> {
            LocalDate date = new java.sql.Date(e.getDeliveryDay().getTime()).toLocalDate();
            return (date.isAfter(startDate) || date.isEqual(startDate)) && (date.isBefore(endDate) || date.isEqual(endDate));
        }).mapToDouble(DeliveryLine::getQuantity).sum();
        if (sum == 0) {
            return null;
        }
        field.setValue(sum);
        return field;
    }

    /**
     * Разворачивание таблицы
     */
    public void onBtnExpandAllClick() {
        queriesPositionsTable.expandAll();
    }

    /**
     * Сворачивание таблицы
     */
    public void onBtnCollapseAllClick() {
        queriesPositionsTable.collapseAll();
    }

    /**
     * Скрыть пустые столбцы
     */
    public void onBtnHideNullColumnDelivery() {
        columnAllSet.forEach(e -> {
            queriesPositionsTable.setColumnCollapsed(e, true);
        });
        showNotNullColumn();
        collapsedColumns = true;
    }

    /**
     * Показать все столбцы
     */
    public void onBtnShowNullColumnDelivery() {
        columnAllSet.forEach(e -> {
            queriesPositionsTable.setColumnCollapsed(e, false);
        });
        collapsedColumns = false;
    }

    /**
     * Показать столбцы с информацией
     */
    public void showNotNullColumn() {
        Collection<QueriesPosition> queriesPositionList = queriesPositionsDs.getItems();

        for (QueriesPosition q : queriesPositionList) {
            Delivery delivery = q.getDelivery();
            if (delivery == null) {
                continue;
            }
            List<DeliveryLine> deliveryLines = delivery.getDeliveryLine();

            if (deliveryLines == null) {
                continue;
            }
            for (DeliveryLine d : deliveryLines) {
                LocalDate date = new java.sql.Date(d.getDeliveryDay().getTime()).toLocalDate();
                String nameColumn = monthStringMap.get(date.getMonth())+" "+date.getYear();
                if (date.getDayOfMonth() < 11) {
                    nameColumn ="01-10 "+nameColumn;
                }
                if (date.getDayOfMonth() >= 11 && date.getDayOfMonth() < 21) {
                    nameColumn = "11-20 "+nameColumn;
                }
                if (date.getDayOfMonth() >= 21) {
                    nameColumn = "21-" + date.with(TemporalAdjusters.lastDayOfMonth()).getDayOfMonth()+" "+nameColumn;
                }
                queriesPositionsTable.getColumn(nameColumn).setCollapsed(false);

            }
        }

    }

    /**
     * Обновить
     */
    public void onBtnRefresh() {
        queriesPositionsDs.refresh();
        if (collapsedColumns) {
            onBtnHideNullColumnDelivery();
        } /*else {
            onBtnShowNullColumnDelivery();
        }*/
    }
}