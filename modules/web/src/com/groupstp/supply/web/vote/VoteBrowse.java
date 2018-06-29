package com.groupstp.supply.web.vote;

import com.haulmont.cuba.core.global.Metadata;
import com.haulmont.cuba.core.global.TimeSource;
import com.haulmont.cuba.gui.components.*;

import com.groupstp.supply.entity.QueriesPosition;
import com.groupstp.supply.entity.SuppliersSuggestion;
import com.groupstp.supply.entity.Vote;
import com.haulmont.cuba.core.global.DataManager;
import com.haulmont.cuba.core.global.LoadContext;
import com.haulmont.cuba.gui.components.actions.BaseAction;
import com.haulmont.cuba.gui.data.GroupDatasource;
import com.haulmont.cuba.gui.xml.layout.ComponentsFactory;
import com.haulmont.cuba.security.global.UserSession;

import javax.inject.Inject;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

public class VoteBrowse extends AbstractLookup {

    @Inject
    private DataManager dataManager;
    @Inject
    private GroupDatasource<Vote, UUID> votesDs;

    @Inject
    private GroupTable<Vote> tab;

    @Inject
    private TimeSource timeSource;

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
        createVoteButtons();
    }

    @Inject
    private ComponentsFactory componentsFactory;

    private  BaseAction unvote;
    private  BaseAction vote;

    /**
     * Генератор колонки с кнопками голосования/отмены голосвания
     */
    private void createVoteButtons() {
        tab.addGeneratedColumn("btn", entity -> {
            Button btn = componentsFactory.createComponent(Button.class);
            btn.setId(entity.getId().toString());
            unvote = new BaseAction("unvote"){
                @Override
                public void actionPerform(Component component) {
                    entity.setVoteTS(null);
                    dataManager.commit(entity);
                    btn.setAction(vote);
                }
            };
            vote = new BaseAction("vote"){
                @Override
                public void actionPerform(Component component) {
                    removeCurrentVoice();
                    entity.setVoteTS(timeSource.currentTimestamp());
                    //TODO: set user's voice weight
                    entity.setWeight(1);
                    dataManager.commit(entity);
                    btn.setAction(unvote);
                }
            };

            unvote.setCaption(getMessage("Cancel vote"));
            vote.setCaption(getMessage("Vote"));

            if(entity.getVoteTS()!=null) {
                btn.setAction(unvote);
            }
            else {
                btn.setAction(vote);
            }
            return btn;
        });
    }

    @Inject
    private UserSession userSession;

    /**
     * Создаёт таблицы голосов
     * @param positions позиции заявки, для которых создаются голоса
     */
    private void addValues(Set<QueriesPosition> positions) {
        LoadContext<SuppliersSuggestion> ctx = LoadContext.create(SuppliersSuggestion.class).
                setQuery(LoadContext.createQuery("select ss from supply$SuppliersSuggestion ss where "+
                        "ss.posSup in (select ps from supply$PositionSupplier ps where ps.position in :positions) " +
                        "AND ss NOT IN(select v.suggestion from supply$Vote v)")
                        .setParameter("positions", positions)).setView("suppliersSuggestion-view");
        List<SuppliersSuggestion> ssList = dataManager.loadList(ctx);
        for (SuppliersSuggestion ss : ssList) {
            addItem(ss);
        }
    }

    @Inject
    private Metadata metadata;

    private void addItem(SuppliersSuggestion ss)
    {
        Vote v = metadata.create(Vote.class);
        v.setPosition(ss.getPosSup().getPosition());
        v.setSuggestion(ss);
        v.setEmp(userSession.getCurrentOrSubstitutedUser());
        votesDs.addItem(v);
    }


    public void onBtnCloseClick() {
        this.close("", true);
    }

    public void removeCurrentVoice() {
        for (Vote v:votesDs.getItems())
        {
            if(v.getVoteTS()!=null) {
                v.setVoteTS(null);
                dataManager.commit(v);
                Button btn = (Button) getComponentNN(v.getId().toString());
                btn.setAction(vote);
            }
        }
    }
}