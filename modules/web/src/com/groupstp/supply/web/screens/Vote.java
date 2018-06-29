package com.groupstp.supply.web.screens;

import com.groupstp.supply.entity.QueriesPosition;
import com.groupstp.supply.entity.SuppliersSuggestion;
import com.haulmont.cuba.core.global.DataManager;
import com.haulmont.cuba.core.global.LoadContext;
import com.haulmont.cuba.gui.WindowManager;
import com.haulmont.cuba.gui.components.AbstractWindow;
import com.haulmont.cuba.gui.components.Accordion;
import com.haulmont.cuba.gui.components.OptionsGroup;
import com.haulmont.cuba.gui.xml.layout.ComponentsFactory;

import javax.inject.Inject;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class Vote extends AbstractWindow {
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
    }

    @Inject
    private Accordion positions;

    @Inject
    private ComponentsFactory componentsFactory;

    @Inject
    private DataManager dataManager;

    private void showPositions(Set<QueriesPosition> qp) {
            LoadContext<SuppliersSuggestion> ctx = LoadContext.create(SuppliersSuggestion.class).
                    setQuery(LoadContext.createQuery("select ss from supply$SuppliersSuggestion ss where "+
                            "ss.posSup in (select ps from supply$PositionSupplier ps where ps.position in :positions)")
                            .setParameter("positions", qp)).setView("suppliersSuggestion-view");
            List<SuppliersSuggestion> ssList = dataManager.loadList(ctx);
            for (SuppliersSuggestion ss : ssList) {
                QueriesPosition p = ss.getPosSup().getPosition();
                OptionsGroup grp = null;
                if(positions.getTab(p.getInstanceName().toString())!=null)
                    grp = (OptionsGroup) positions.getTabComponent(p.getInstanceName().toString());
                if(grp==null) {
                    grp = componentsFactory.createComponent(OptionsGroup.class);
                    grp.setHeightAuto();
                    Accordion.Tab tab = positions.addTab(p.getInstanceName().toString(), grp);
                    tab.setCaption(p.getInstanceName().toString());
                }
                List<SuppliersSuggestion> l = grp.getOptionsList();
                if(l==null)
                    l = new ArrayList<>();
                l.add(ss);
                grp.setOptionsList(l);
            }
    }

}