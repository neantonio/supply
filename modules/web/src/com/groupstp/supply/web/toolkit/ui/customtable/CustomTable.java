package com.groupstp.supply.web.toolkit.ui.customtable;

import com.vaadin.ui.AbstractJavaScriptComponent;
import com.vaadin.annotations.JavaScript;

@JavaScript({"customtable-connector.js"})
public class CustomTable extends AbstractJavaScriptComponent {
    public CustomTable() {
    }

    @Override
    protected CustomTableState getState() {
        return (CustomTableState) super.getState();
    }
}