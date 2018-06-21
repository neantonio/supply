package com.groupstp.supply.web.screens;

import com.google.common.collect.Iterables;
import com.haulmont.addon.dnd.components.DDVerticalLayout;
import com.haulmont.addon.dnd.components.DDVerticalLayoutTargetDetails;
import com.haulmont.addon.dnd.components.DropHandler;
import com.haulmont.addon.dnd.components.LayoutBoundTransferable;
import com.haulmont.addon.dnd.components.acceptcriterion.AcceptCriterion;
import com.haulmont.addon.dnd.components.dragevent.DragAndDropEvent;
import com.haulmont.addon.dnd.components.enums.VerticalDropLocation;
import com.haulmont.cuba.core.global.DevelopmentException;
import com.haulmont.cuba.gui.components.*;
import com.haulmont.cuba.gui.xml.layout.ComponentsFactory;

import javax.inject.Inject;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * окно выбора порядка группировки
 * при вызове param должен содержать запись key=params value=map списков
 * map списков должен содержать запись key=availableItems value = список доступных элементов.
 * также map списков может содержать необязательный параметр key=currentOrder value = список элементов в соответствии с текущим порядком.
 */
public class Choosegrouporder extends AbstractWindow {

    @Inject
    private DDVerticalLayout availableLayout;

    @Inject
    private DDVerticalLayout resultLayout;

    @Inject
    private ComponentsFactory factory;

    private List<Map.Entry<String,Object>> resultOrder;
    private List<Map.Entry<String,Object>> availableItems;

    @Override
    public void init(Map<String, Object> params) {
        resultOrder=new ArrayList<>();
        availableItems=new ArrayList<>();

        Map<String, Object> data= (Map<String, Object>) params.get("params");
        if(data==null) throw  new DevelopmentException("no key='params' in params map ");

        List <Map.Entry<String,Object>>availableItemsIncome= (List<Map.Entry<String, Object>>)data.get("availableItems");
        if(availableItemsIncome==null) throw  new DevelopmentException("no key='availableItems' in map got from param map with key='params'");

        List<Map.Entry<String,Object>> resultOrderIncome= (List<Map.Entry<String, Object>>) data.get("currentOrder");

        if(resultOrderIncome!=null) {
            resultOrderIncome.forEach(item->resultOrder.add( item));
        }
        data.put("currentOrder",resultOrder);

        //в отображение доступных элементов добавляем только те, которых нет в результирующих
        for(Map.Entry availableEntry:availableItemsIncome){
            boolean addCurrent=true;
            for(Map.Entry resultEntry:resultOrder){
                if(availableEntry.getKey().equals(resultEntry.getKey()))  addCurrent=false;

            }
            if(addCurrent)availableItems.add(availableEntry);
        }

        for(Map.Entry entry:availableItems){
            availableLayout.add(createDashboardElement((String) entry.getKey()));
        }

        for(Map.Entry entry:resultOrder){
            resultLayout.add(createDashboardElement((String) entry.getKey()));
        }


        availableLayout.setDropHandler(new DropHandler() {
            @Override
            public void drop(DragAndDropEvent event) {
                handleDrop(event,availableItems,resultOrder);
                // dashboard.setHeightAuto();
            }

            @Override
            public AcceptCriterion getCriterion() {
                return AcceptCriterion.ACCEPT_ALL;
            }
        });

        resultLayout.setDropHandler(new DropHandler() {
            @Override
            public void drop(DragAndDropEvent event) {
                handleDrop(event,resultOrder,availableItems);
                // dashboard.setHeightAuto();
            }

            @Override
            public AcceptCriterion getCriterion() {
                return AcceptCriterion.ACCEPT_ALL;
            }
        });
    }

    /**
     * обработчик перетаскивания.
     * @param event
     * @param ownList список элементов в текущем групбоксе
     * @param otherList список элементов в другом групбоксе
     */
    private void handleDrop(DragAndDropEvent event, List<Map.Entry<String,Object>> ownList,List<Map.Entry<String,Object>> otherList){

        LayoutBoundTransferable t = (LayoutBoundTransferable) event.getTransferable();
        DDVerticalLayoutTargetDetails details = (DDVerticalLayoutTargetDetails) event.getTargetDetails();

        Component sourceLayout = t.getSourceComponent();
        DDVerticalLayout targetLayout = (DDVerticalLayout) details.getTarget();
        Component tComponent = t.getTransferableComponent();

        VerticalDropLocation loc = details.getDropLocation();

        int indexTo = details.getOverIndex();
        int indexFrom = targetLayout.indexOf(tComponent);
        int indexFromSource=((DDVerticalLayout)sourceLayout).indexOf(tComponent);

        if (tComponent == null) {
            return;
        }

        int indexToForList=indexTo;

        //просто логика обрабатывания перетаскивания
        Map.Entry<String,Object> buffer;
        if (sourceLayout == targetLayout) {

            buffer = ownList.get(indexFromSource);
            ownList.remove(buffer);

            if (indexToForList > indexFromSource) {
                indexToForList--;
            }
            if (loc == VerticalDropLocation.MIDDLE || loc == VerticalDropLocation.BOTTOM) {
                indexToForList++;
            }
            ownList.add(indexToForList,buffer);
        }
        else{
            buffer = otherList.get(indexFromSource);
            otherList.remove(buffer);

            if(indexToForList==-1) ownList.add(buffer);
                else ownList.add(indexToForList,buffer);
        }


        if (sourceLayout == targetLayout) {

            if (indexFrom == indexTo) {
                return;
            }
            targetLayout.remove(tComponent);

            if (indexTo > indexFrom) {
                indexTo--;
            }
            if (indexTo == -1) {
                targetLayout.add(tComponent, indexFrom);

            }
        }
        else {

            ((DDVerticalLayout)sourceLayout).remove(tComponent);


            targetLayout.add(tComponent, targetLayout.getOwnComponents().size());

        }
        if (indexTo != -1) {
            if (loc == VerticalDropLocation.MIDDLE || loc == VerticalDropLocation.BOTTOM) {
                indexTo++;
            }
            targetLayout.add(tComponent, indexTo);
        }

    }

    public Component createDashboardElement(String label) {
        Button button = factory.createComponent(Button.class);
        button.setCaption(label);
        button.setWidth("100%");
        return button;
    }

    public void onOk(){
        close("ok");
    }
    public void onCancel(){
        close("cancel");
    }
}