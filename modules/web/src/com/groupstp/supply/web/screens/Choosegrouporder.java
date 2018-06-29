package com.groupstp.supply.web.screens;

import com.haulmont.addon.dnd.components.DDVerticalLayout;
import com.haulmont.addon.dnd.components.DDVerticalLayoutTargetDetails;
import com.haulmont.addon.dnd.components.DropHandler;
import com.haulmont.addon.dnd.components.LayoutBoundTransferable;
import com.haulmont.addon.dnd.components.acceptcriterion.AcceptCriterion;
import com.haulmont.addon.dnd.components.dragevent.DragAndDropEvent;
import com.haulmont.addon.dnd.components.enums.VerticalDropLocation;
import com.haulmont.cuba.core.global.DevelopmentException;
import com.haulmont.cuba.gui.components.AbstractWindow;
import com.haulmont.cuba.gui.components.Button;
import com.haulmont.cuba.gui.components.Component;
import com.haulmont.cuba.gui.components.HBoxLayout;
import com.haulmont.cuba.gui.components.actions.BaseAction;
import com.haulmont.cuba.gui.xml.layout.ComponentsFactory;

import javax.inject.Inject;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * @author AntonLomako
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
            availableLayout.add(createDashboardElement((String) entry.getKey(),resultOrder,availableItems,availableLayout,resultLayout,entry));

        }

        for(Map.Entry entry:resultOrder){
            resultLayout.add(createDashboardElement((String) entry.getKey(),availableItems,resultOrder,resultLayout,availableLayout,entry));

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

        processItemMovement(ownList,otherList,indexFromSource,indexFrom,indexTo,loc,sourceLayout,targetLayout,tComponent);

    }

    /**
     * просто логика обрабатывания перетаскивания
     */
    private void processItemMovement(List<Map.Entry<String,Object>> ownList,List<Map.Entry<String,Object>> otherList,
                                       int indexFromSource,int indexFrom, int indexTo,VerticalDropLocation loc,
                                       Component sourceLayout,DDVerticalLayout targetLayout,Component tComponent){


        int indexToForList=indexTo;
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

    /**
     * создается две кнопки. одна с названием, другая перемещает элемент в противоположный список
     * @param label
     * @return созданный горизонтальный layout
     */
    public Component createDashboardElement(String label,
                                            List<Map.Entry<String,Object>> ownList,
                                            List<Map.Entry<String,Object>> otherList,
                                            Component sourceLayout,DDVerticalLayout targetLayout,
                                            Map.Entry entry
                                            ) {
        HBoxLayout hBoxLayout=factory.createComponent(HBoxLayout.class);

        Button button = factory.createComponent(Button.class);
        button.setCaption(label);
        button.setWidth("100%");

        Button removeButton = factory.createComponent(Button.class);
        removeButton.setIcon("font-icon:EXCHANGE");
        removeButton.setDisableOnClick(true);
        removeButton.setAction(new BaseAction("") {
                                    List list1=null;
                                    List list2=null;
                                    DDVerticalLayout l1=null;
                                    DDVerticalLayout l2=null;
                                   @Override
                                   public void actionPerform(Component component) {
                                       if(list1==null){
                                           list1=ownList;
                                           list2=otherList;
                                           l1= (DDVerticalLayout) sourceLayout;
                                           l2=targetLayout;
                                       }
                                       else{
                                           List temp=list1; list1=list2; list2=temp;
                                           DDVerticalLayout tempL=l1;l1=l2;l2=tempL;
                                       }

                                       processItemMovement(list1,list2,list2.indexOf(entry),list2.size()-1,
                                               list1.size(),null,l1,l2,hBoxLayout);
                                       removeButton.setEnabled(true);
                                   }
                               });


        hBoxLayout.add(button);
        hBoxLayout.add(removeButton);
        hBoxLayout.setSpacing(true);
        hBoxLayout.expand(button);
        hBoxLayout.setWidth("100%");

        return hBoxLayout;
    }

    public void onOk(){
        close("ok");
    }
    public void onCancel(){
        close("cancel");
    }
}