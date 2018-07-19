package com.groupstp.supply.web.positionsupplier;

import com.groupstp.supply.entity.PositionSupplier;
import com.groupstp.supply.entity.QueriesPosition;
import com.groupstp.supply.entity.Suppliers;
import com.haulmont.cuba.core.entity.KeyValueEntity;
import com.haulmont.cuba.core.global.DataManager;
import com.haulmont.cuba.core.global.Metadata;
import com.haulmont.cuba.gui.WindowManager;
import com.haulmont.cuba.gui.components.AbstractLookup;
import com.haulmont.cuba.gui.components.CheckBox;
import com.haulmont.cuba.gui.components.Component;
import com.haulmont.cuba.gui.components.Table;
import com.haulmont.cuba.gui.data.CollectionDatasource;
import com.haulmont.cuba.gui.xml.layout.ComponentsFactory;

import javax.inject.Inject;
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
    private HashMap<QueriesPosition, HashMap<Suppliers, Boolean>> datamatrix = new HashMap<>();


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

    @Inject
    private Metadata metadata;

    /**
     * Добавляет поставщика supplier как колонку таблицы
     * @param supplier - поставщик
     */

    private void addSupplier(Suppliers supplier) {
        if(supplier==null)
            return;
        if(!suppliers.contains(supplier)) {
            suppliers.add(supplier);
            tab.addGeneratedColumn(supplier.getId().toString(), new Table.ColumnGenerator<KeyValueEntity>() {
                @Override
                public Component generateCell(KeyValueEntity entity) {
                    CheckBox box = (CheckBox) componentsFactory.createComponent(CheckBox.NAME);
                    QueriesPosition position = entity.getValue("position");
                    box.setValue(datamatrix.get(position).get(supplier));
                    box.setDebugId(position.getId().toString()+supplier.getId().toString());
                    box.addValueChangeListener(e -> {
                        PositionSupplier ps = PositionSupplier.getPositionSupplier(position, supplier);
                        if(ps==null)
                        {
                            ps = metadata.create(PositionSupplier.class);
                            ps.setPosition(position);
                            ps.setSupplier(supplier);
                        }
                        ps.setSelected((Boolean) e.getValue());
                        datamatrix.get(position).put(supplier,(Boolean) e.getValue());
                        dataManager.commit(ps);
                    });
                    return box;
                }
            });
        }
//        tab.addGeneratedColumn(supplier.getId().toString(), entity -> {
//                CheckBox box = (CheckBox) componentsFactory.createComponent(CheckBox.NAME);
//                //box.setValue(existed);
//                box.setDebugId(supplier.getId().toString());
//        });
        tab.setColumnCaption(supplier.getId().toString(), supplier.getName());
    }

    private void showSuppliers(Set<QueriesPosition> positions) {
        List<PositionSupplier> suppliers = dataManager.load(PositionSupplier.class)
                .query("select e from supply$PositionSupplier e\n" +
                "where e.selected=true AND \n" +
                "e.position in :positions\n")
                .parameter("positions", positions)
                .view("positionSupplier-view")
                .list();
        positions.forEach(p -> {
            if(!datamatrix.containsKey(p))
                datamatrix.put(p, new HashMap<>());
        });
        suppliers.forEach(ps -> {
            datamatrix.get(ps.getPosition()).put(ps.getSupplier(), ps.getSelected());
            addSupplier(ps.getSupplier());
        });
    }

    public void onBtnMessageClick() {
        sendQueries();
    }

    public void sendQueries() {
        showNotification("TODO!!");
    }
}