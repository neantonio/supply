package com.groupstp.supply.web.gui.components;

import com.haulmont.cuba.web.gui.components.WebAbstractComponent;

public class WebSample extends WebAbstractComponent<com.groupstp.supply.web.toolkit.ui.customtable.CustomTable> implements Sample {
    public WebSample() {
        this.component = new com.groupstp.supply.web.toolkit.ui.customtable.CustomTable();
    }
}