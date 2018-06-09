package com.groupstp.supply.web.positionsupplier;

import com.groupstp.supply.entity.*;
import com.haulmont.cuba.core.entity.Entity;
import com.haulmont.cuba.core.entity.KeyValueEntity;
import com.haulmont.cuba.core.global.AppBeans;
import com.haulmont.cuba.core.global.DataManager;
import com.haulmont.cuba.core.global.LoadContext;
import com.haulmont.cuba.core.global.Metadata;
import com.haulmont.cuba.gui.WindowManager;
import com.haulmont.cuba.gui.app.security.group.browse.GroupBrowser;
import com.haulmont.cuba.gui.components.*;
import com.haulmont.cuba.gui.data.CollectionDatasource;
import com.haulmont.cuba.gui.data.GroupDatasource;
import com.haulmont.cuba.gui.data.impl.CustomValueCollectionDatasource;
import com.haulmont.cuba.gui.xml.layout.ComponentsFactory;

import javax.inject.Inject;
import java.security.Key;
import java.util.*;

//public class PositionSuppliersDatasource extends CustomValueCollectionDatasource{
//
//    @Inject
//    private DataManager dataManager;
//
//    /**
//     * Callback method to be implemented in subclasses.
//     *
//     * @param params datasource parameters, as described in {@link CollectionDatasource#refresh(Map)}
//     * @return collection of entities to populate the datasource
//     */
//    @Override
//    protected Collection<KeyValueEntity> getEntities(Map<String, Object> params) {
//        Set<QueriesPosition> positions = (Set<QueriesPosition>) params.get("positions");
//        HashMap<PositionSupplier, KeyValueEntity> hash= new HashMap<PositionSupplier, KeyValueEntity>();
//
//        LoadContext<PositionSupplier> ctx = LoadContext.create(PositionSupplier.class).
//                setQuery(LoadContext.createQuery("select e from supply$PositionSupplier e\n" +
//                        "e.position in :positions\n").
//                        setParameter("positions", positions));
//        ctx.setView("positionSupplier-view");
//        List<PositionSupplier> suppliers = dataManager.loadList(ctx);
//        for (PositionSupplier ps: suppliers) {
//            KeyValueEntity e = hash.get(ps);
//            if(e==null)
//                e = new KeyValueEntity();
//            e.se
//        }
//    }
//}

public class PositionSupplierBrowse extends AbstractLookup {

    @Inject
    private Table<KeyValueEntity> tab;

    @Inject
    private ComponentsFactory componentsFactory;

    private List<Suppliers> suppliers  = new LinkedList<>();
    private HashMap<QueriesPosition, List<Suppliers>> datamatrix;


    @Inject
    private CollectionDatasource<KeyValueEntity, Object> ds;

    @Inject
    private DataManager dataManager;


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
        showPositions(positions);
        showSuppliers(positions);
        ds.setAllowCommit(false);
    }

    /**
     * Создаёт и добавляет позиции, которых нет в таблице
     * @param positions - позиции для добавления
     */
    private void showPositions(Set<QueriesPosition> positions)
    {
        for (QueriesPosition position: positions) {
            KeyValueEntity e = new KeyValueEntity();
            e.setValue("position", position);
            ds.addItem(e);
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
    }


    /**
     * Добавляет поставщика supplier как клонку таблицы
     * @param supplier - поставщик
     */
    private void addSupplier(Suppliers supplier) { addSupplier(supplier, false); }

    @Inject
    private Metadata metadata;

    private void addSupplier(Suppliers supplier, boolean existed) {
        if(supplier==null)
            return;
        if(suppliers.contains(supplier))
            return;
        tab.addGeneratedColumn(supplier.getId().toString(), entity -> {
                CheckBox box = (CheckBox) componentsFactory.createComponent(CheckBox.NAME);
                box.setValue(existed);
                box.setDebugId(supplier.getId().toString());
                QueriesPosition position = entity.getValue("position");
                box.addValueChangeListener(e -> {
                    System.out.println();
                    PositionSupplier ps = PositionSupplier.getPositionSupplier(position, supplier);
                    if(ps==null)
                    {
                        ps = metadata.create(PositionSupplier.class);
                        ps.setPosition(position);
                        ps.setSupplier(supplier);
                    }
                    ps.setSelected((Boolean) e.getValue());
                    dataManager.commit(ps);
                });
                return box;
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
            addSupplier(ps.getSupplier(), true);
        }
    }

    public void onBtnMessageClick() {
        sendQueries();
    }

    public void sendQueries() {
        showNotification("TODO!!");
    }
}