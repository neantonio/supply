package com.groupstp.supply.web.supplierssuggestion;

import com.groupstp.supply.entity.PositionSupplier;
import com.groupstp.supply.entity.QueriesPosition;
import com.groupstp.supply.entity.SuppliersSuggestion;
import com.haulmont.cuba.core.global.DataManager;
import com.haulmont.cuba.core.global.LoadContext;
import com.haulmont.cuba.core.global.Metadata;
import com.haulmont.cuba.gui.WindowManager;
import com.haulmont.cuba.gui.components.AbstractLookup;
import com.haulmont.cuba.gui.components.Button;
import com.haulmont.cuba.gui.components.Component;
import com.haulmont.cuba.gui.components.GroupTable;
import com.haulmont.cuba.gui.data.GroupDatasource;

import javax.inject.Inject;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

public class SuppliersSuggestionBrowse extends AbstractLookup {
    @Inject
    private DataManager dataManager;
    @Inject
    private GroupDatasource<SuppliersSuggestion, UUID> suppliersSuggestionsDs;

    @Inject
    private GroupTable<SuppliersSuggestion> tab;

    @Inject
    private Button btnCommit;

    private boolean addingMode=true;

    /**
     * Вызывается после полной инициализации и отображения
     */
    @Override
    public void ready() {
        super.ready();
        tab.expandAll();
    }

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
    }

    @Inject
    private Metadata metadata;

    /**
     * Создаёт предложения поставщиков
     * @param positions - список позиций заявок, для которых создаются предложения поставщиков
     */
    private void addValues(Set<QueriesPosition> positions) {

        //выбрать поставщиков позиции от которых нет предложения
        LoadContext<PositionSupplier> ctx = LoadContext.create(PositionSupplier.class).
                setQuery(LoadContext.createQuery("select ps from supply$PositionSupplier ps where ps.position in :positions " +
                        "AND ps NOT IN (select ss.posSup from  supply$SuppliersSuggestion ss) ")
                .setParameter("positions", positions)).setView("positionSupplier-view");
        List<PositionSupplier> psList = dataManager.loadList(ctx);
        for (PositionSupplier ps : psList) {
            SuppliersSuggestion ss = metadata.create(SuppliersSuggestion.class);
            ss.setPosSup(ps);
            ss.setQuantity(ps.getPosition().getQuantity());
            ss.setPrice(0.);
            ss.setTerm(0);
            //dataManager.commit(ss);
            suppliersSuggestionsDs.addItem(ss);
        }

    }

    /**
     * Добавляет предложение поставщика, используя поставщика текущей выбранной позиции
     */
    public void onCreateBtnClick() {
        SuppliersSuggestion ss = tab.getSingleSelected();
        if(ss==null)
        {
            showNotification(getMessage("Select position first"), NotificationType.WARNING);
            return;
        }
        PositionSupplier ps = tab.getSingleSelected().getPosSup();
        ss = metadata.create(SuppliersSuggestion.class);
        ss.setPosSup(ps);
        suppliersSuggestionsDs.addItem(ss);
    }

    /**
     * Заносит изменения в таблице в БД
     * @param source компонент, вызвавший действие
     */
    public void onCommit(Component source) {

        suppliersSuggestionsDs.commit();

    }

    
}