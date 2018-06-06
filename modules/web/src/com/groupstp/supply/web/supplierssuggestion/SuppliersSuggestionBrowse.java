package com.groupstp.supply.web.supplierssuggestion;

import com.groupstp.supply.entity.PositionSupplier;
import com.groupstp.supply.entity.QueriesPosition;
import com.groupstp.supply.entity.SuppliersSuggestion;
import com.haulmont.cuba.core.global.DataManager;
import com.haulmont.cuba.core.global.LoadContext;
import com.haulmont.cuba.gui.WindowManager;
import com.haulmont.cuba.gui.components.AbstractLookup;
import com.haulmont.cuba.gui.components.GroupTable;
import com.haulmont.cuba.gui.data.GroupDatasource;

import javax.inject.Inject;
import javax.print.attribute.standard.DialogTypeSelection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import com.haulmont.cuba.gui.components.Component;

public class SuppliersSuggestionBrowse extends AbstractLookup {
    @Inject
    private DataManager dataManager;
    @Inject
    private GroupDatasource<SuppliersSuggestion, UUID> suppliersSuggestionsDs;

    @Inject
    private GroupTable<SuppliersSuggestion> tab;

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

    /**
     * Создаёт предложения для поставщиков
     * @param positions
     */
    private void addValues(Set<QueriesPosition> positions) {
        LoadContext<PositionSupplier> ctx = LoadContext.create(PositionSupplier.class).
                setQuery(LoadContext.createQuery("select ps from supply$PositionSupplier ps where ps.position in :positions")
                .setParameter("positions", positions)).setView("positionSupplier-view");
        List<PositionSupplier> psList = dataManager.loadList(ctx);
        ctx = LoadContext.create(PositionSupplier.class).
                setQuery(LoadContext.createQuery("select ss.posSup from supply$SuppliersSuggestion ss"));
        List<PositionSupplier> positionList = dataManager.loadList(ctx);
        for (PositionSupplier ps : psList) {
            if(positionList.contains(ps))
                continue;
            SuppliersSuggestion ss = new SuppliersSuggestion();
            ss.setPosSup(ps);
            ss.setQuantity(ps.getPosition().getQuantity());
            ss.setPrice(0.);
            ss.setTerm(0);
            dataManager.commit(ss);
            suppliersSuggestionsDs.addItem(ss);
        }

    }

    /**
     * Добавляет предложение. используя в текущую выбранную позицию-поставшик
     */
    public void onCreateBtnClick() {
        SuppliersSuggestion ss = tab.getSingleSelected();
        if(ss==null)
        {
            showNotification(getMessage("Select position first"), NotificationType.WARNING);
            return;
        }
        PositionSupplier ps = tab.getSingleSelected().getPosSup();
        ss = new SuppliersSuggestion();
        ss.setPosSup(ps);
        suppliersSuggestionsDs.addItem(ss);
    }

    /**
     * Заносит изменения в таблице в БД
     * @param source
     */
    public void onCommit(Component source) {
        suppliersSuggestionsDs.commit();
    }
}