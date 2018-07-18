package com.groupstp.supply.web.screens;

import com.groupstp.supply.entity.QueriesPosition;
import com.groupstp.supply.entity.SuppliersSuggestion;
import com.groupstp.supply.entity.Vote;
import com.haulmont.cuba.core.global.DataManager;
import com.haulmont.cuba.core.global.LoadContext;
import com.haulmont.cuba.core.global.Metadata;
import com.haulmont.cuba.core.global.TimeSource;
import com.haulmont.cuba.gui.WindowManager;
import com.haulmont.cuba.gui.components.AbstractWindow;
import com.haulmont.cuba.gui.components.Accordion;
import com.haulmont.cuba.gui.components.OptionsGroup;
import com.haulmont.cuba.gui.xml.layout.ComponentsFactory;
import com.haulmont.cuba.security.global.UserSession;

import javax.inject.Inject;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class VoteDialog extends AbstractWindow {
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
                            .setParameter("positions", qp)
                    ).setView("suppliersSuggestion-view");
            List<SuppliersSuggestion> ssList = dataManager.loadList(ctx);
            for (SuppliersSuggestion ss : ssList) {
                QueriesPosition p = ss.getPosSup().getPosition();
                OptionsGroup grp = null;
                if(positions.getTab(p.getInstanceName())!=null)
                    grp = (OptionsGroup) positions.getTabComponent(p.getInstanceName());
                if(grp==null) {
                    grp = componentsFactory.createComponent(OptionsGroup.class);
                    grp.addValueChangeListener(e -> doVote((SuppliersSuggestion)e.getValue()));
                    Accordion.Tab tab = positions.addTab(p.getInstanceName(), grp);
                    tab.setCaption(p.getInstanceName());
                }
                List<SuppliersSuggestion> l = grp.getOptionsList();
                if(l==null)
                    l = new ArrayList<>();
                l.add(ss);
                grp.setOptionsList(l);
            }



            LoadContext<Vote> vctx = LoadContext.create(Vote.class)
                    .setQuery(LoadContext.createQuery("select v from supply$Vote v where v.position.id in :positions and v.emp.id=:user")
                            .setParameter("positions", qp)
                            .setParameter("user", userSession.getUser()))
                    .setView("vote-view");
            List<Vote> votes = dataManager.loadList(vctx);
            for(Vote v:votes)
            {
                OptionsGroup grp = (OptionsGroup) positions.getTabComponent(v.getPosition().getInstanceName());
                grp.setValue(v.getSuggestion());
            }
    }

    @Inject
    private TimeSource timeSource;

    @Inject
    private UserSession userSession;

    @Inject
    private Metadata metadata;

    private void doVote(SuppliersSuggestion value) {
        LoadContext<Vote> ctx = LoadContext.create(Vote.class)
                .setQuery(LoadContext.createQuery("select v from supply$Vote v where v.position.id=:position and v.emp.id = :userId")
                    .setParameter("position", value.getPosSup().getPosition())
                    .setParameter("userId", userSession.getUser()))
                .setView("vote-view");
        List<Vote> votes = dataManager.loadList(ctx);
        Vote vote = votes.size()>0 ? votes.get(0) : null;
        QueriesPosition position=value.getPosSup().getPosition();
        if(vote==null)
        {
            vote = metadata.create(Vote.class);
            //TODO: user weight
            vote.setWeight(1);
            vote.setEmp(userSession.getUser());
            vote.setPosition(value.getPosSup().getPosition());
        }

        else if(value.equals(vote.getSuggestion())) {
            return;
        }
        position.setVoteResult(value);
        dataManager.commit(position);

        vote.setVoteTS(timeSource.currentTimestamp());
        vote.setSuggestion(value);
        dataManager.commit(vote);
    }

}