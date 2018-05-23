package com.groupstp.supply.web.nomenclature;

import com.groupstp.supply.entity.Nomenclature;
import com.haulmont.cuba.gui.components.AbstractLookup;
import com.haulmont.cuba.gui.components.Action;
import com.haulmont.cuba.gui.components.Button;
import com.haulmont.cuba.gui.components.TreeTable;
import com.haulmont.cuba.gui.components.actions.CreateAction;
import com.haulmont.cuba.gui.components.actions.EditAction;
import com.haulmont.cuba.gui.data.Datasource;
import com.haulmont.cuba.gui.data.HierarchicalDatasource;

import javax.inject.Inject;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

public class NomenclatureBrowse extends AbstractLookup {
    @Inject
    private HierarchicalDatasource<Nomenclature, UUID> nomenclaturesDs;

    @Inject
    private TreeTable<Nomenclature> nomenclaturesTable;

    @Inject
    private Button newGrp;

    @Inject
    private Button createBtn;

    @Override
    public void init(Map<String, Object> params) {
        super.init(params);
        nomenclaturesDs.addItemChangeListener(new Datasource.ItemChangeListener<Nomenclature>() {
            @Override
            public void itemChanged(Datasource.ItemChangeEvent<Nomenclature> e) {
                Boolean grp = e.getItem().getIsgroup();
                grp = grp==null ? false : true;
                EditAction a = (EditAction) nomenclaturesTable.getAction("edit");
                if(!grp)
                    a.setWindowId("supply$Nomenclature.edit");
                else
                    a.setWindowId("supply$NomenclatureGroup.edit");
            }
        });
    }


    public void onNewGrpClick() {
        createGroupOrElement(true);
    }

    public void onCreateBtnClick() {
        createGroupOrElement(false);
    }


    protected void createGroupOrElement(Boolean group)
    {
        CreateAction a = (CreateAction) nomenclaturesTable.getAction("create");
        a.setWindowId(group ? "supply$NomenclatureGroup.edit" : "supply$Nomenclature.edit");
        Map<String, Object> values = new HashMap<>();
        Nomenclature n = nomenclaturesDs.getItem();
        if(n!=null)
            values.put("parent", n.getIsgroup() ? n : n.getParent());
        values.put("isgroup", group);
        a.setInitialValues(values);
        a.actionPerform(newGrp);
    }

}