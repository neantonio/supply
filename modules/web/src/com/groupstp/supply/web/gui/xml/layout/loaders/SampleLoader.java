package com.groupstp.supply.web.gui.xml.layout.loaders;

import com.groupstp.supply.web.gui.components.Sample;
import com.haulmont.cuba.gui.xml.layout.loaders.AbstractComponentLoader;

public class SampleLoader extends AbstractComponentLoader<Sample> {
    @Override
    public void createComponent() {
        resultComponent = factory.createComponent(Sample.class);
        loadId(resultComponent, element);
    }

    @Override
    public void loadComponent() {
    }
}
