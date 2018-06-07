package com.groupstp.supply.web.positionsupplier;

import com.groupstp.supply.entity.*;
import com.haulmont.cuba.core.entity.Entity;
import com.haulmont.cuba.core.global.AppBeans;
import com.haulmont.cuba.core.global.DataManager;
import com.haulmont.cuba.core.global.LoadContext;
import com.haulmont.cuba.gui.WindowManager;
import com.haulmont.cuba.gui.app.security.group.browse.GroupBrowser;
import com.haulmont.cuba.gui.components.*;
import com.haulmont.cuba.gui.data.GroupDatasource;
import com.haulmont.cuba.gui.xml.layout.ComponentsFactory;

import javax.inject.Inject;
import java.util.*;

public class PositionSupplierBrowse extends AbstractLookup {

    @Inject
    private Table<PositionSupplier> tab;

    /**
     * Called by the framework after creation of all components and before showing the screen.
     * <br> Override this method and put initialization logic here.
     *
     * @param params parameters passed from caller's code, usually from
     *               {@link #openWindow(String, WindowManager.OpenType)} and similar methods, or set in
     *               {@code screens.xml} for this registered screen
     */
    @Override
    public void init(Map<String, Object> params) {
        super.init(params);
        Set<QueriesPosition> positions = (Set<QueriesPosition>) params.get("positions");
        addValues(positions);
        showSuppliers(positions);
    }

    @Inject
    private GroupDatasource<PositionSupplier, UUID> positionSuppliersDs;

    @Inject
    private DataManager dataManager;

    /**
     * Дообавляет позиции, которых нет в таблице
     * @param positions - позиции для добавления
     */
    private void addValues(Set<QueriesPosition> positions)
    {
        LoadContext<QueriesPosition> ctx = LoadContext.create(QueriesPosition.class).
                setQuery(LoadContext.createQuery("select ps.position from supply$PositionSupplier ps"));
        List<QueriesPosition> positionList = dataManager.loadList(ctx);
        for (QueriesPosition position: positions) {
            if(positionList.contains(position))
                continue;
            PositionSupplier ps = new PositionSupplier();
            ps.setPosition(position);
            dataManager.commit(ps);
            positionSuppliersDs.addItem(ps);
        }
    }

    /**
     * Обработка нажатия на кнопку добавить поставщика
     */
    public void onBtnAddClick() {
        openLookup(Suppliers.class, items -> {
            for (Object s: items) {
                addSupplier((Suppliers) s);
            }
        }, WindowManager.OpenType.DIALOG);
     //   addSuplier();
    }

    @Inject
    private ComponentsFactory componentsFactory;

    private List<Suppliers> suppliers  = new LinkedList<>();
    private HashMap<QueriesPosition, List<Suppliers>> datamatrix;

    private void addSupplier(Suppliers supplier) {
        if(supplier==null)
            return;
        if(suppliers.contains(supplier))
            return;
        tab.addGeneratedColumn(supplier.getId().toString(), new Table.ColumnGenerator<PositionSupplier>() {
            @Override
            public Component generateCell(PositionSupplier entity) {
                CheckBox box = (CheckBox) componentsFactory.createComponent(CheckBox.NAME);
                box.setDebugId(supplier.getId().toString());
                box.addValueChangeListener(e -> {
                    PositionSupplier ps = PositionSupplier.getPositionSupplier(entity.getPosition(), supplier);
                    if(ps==null)
                    {
                        ps = new PositionSupplier();
                        ps.setPosition(entity.getPosition());
                        ps.setSupplier(supplier);
                    }
                    ps.setSelected((Boolean)e.getValue());
                    dataManager.commit(ps);
                });
                return box;
            }
        });
        tab.setColumnCaption(supplier.getId().toString(), supplier.getName());
    }

    private void showSuppliers(Set<QueriesPosition> positions) {
        LoadContext<PositionSupplier> ctx = LoadContext.create(PositionSupplier.class).
                setQuery(LoadContext.createQuery("select e from supply$PositionSupplier e\n" +
                        "where e.selected=true AND \n" +
                        "e.position in :positions\n").
                        setParameter("positions", positions));
        ctx.setView("positionSupplier-view");
        List<PositionSupplier> suppliers = dataManager.loadList(ctx);
        for (PositionSupplier ps: suppliers) {
            addSupplier(ps.getSupplier());
        }
    }

    public void onBtnMessageClick() {
        sendQueries();
    }

    public void sendQueries() {
        showNotification("TODO!!");
    }
}