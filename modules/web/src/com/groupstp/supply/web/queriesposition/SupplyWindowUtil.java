package com.groupstp.supply.web.queriesposition;

import com.groupstp.supply.entity.QueriesPosition;
import com.groupstp.supply.entity.QueryPositionStageData;
import com.groupstp.supply.service.StageDataService;
import com.haulmont.chile.core.model.MetaClass;
import com.haulmont.chile.core.model.Session;
import com.haulmont.cuba.core.entity.StandardEntity;
import com.haulmont.cuba.core.global.DevelopmentException;
import com.haulmont.cuba.core.global.Messages;
import com.haulmont.cuba.core.global.Metadata;
import com.haulmont.cuba.gui.WindowManager;
import com.haulmont.cuba.gui.components.*;
import com.haulmont.cuba.gui.components.actions.BaseAction;
import com.haulmont.cuba.gui.xml.layout.ComponentsFactory;
import com.haulmont.cuba.web.gui.components.WebDateField;
import com.haulmont.cuba.web.gui.components.WebPickerField;
import com.haulmont.cuba.web.gui.components.WebTextField;

import java.util.*;

/**
 * Created by 79167 on 05.07.2018.
 */
public class SupplyWindowUtil {

    private AbstractWindow window;
    private Messages messages;
    private ComponentsFactory componentsFactory;
    private Metadata metadata;

    private Map<GroupTable,List<Object>> availableOrderItemsMap=new HashMap<>();
    private Map<GroupTable,List<Object>> currentOrderItemsMap=new HashMap<>();
    private Map<GroupTable,Map<Object,String>> orderItemDescriptionsMap=new HashMap<>();

    private Map<Class,String> errorStyleMap=new HashMap<>();

    public SupplyWindowUtil(AbstractWindow window,
                            Messages messages,
                            ComponentsFactory componentsFactory,
                            Metadata metadata){
        this.window=window;
        this.messages=messages;
        this.componentsFactory=componentsFactory;
        this.metadata=metadata;

        errorStyleMap.put(WebDateField.class,"v-datefield-error");
        errorStyleMap.put(WebTextField.class,"v-textfield-error");
        errorStyleMap.put(WebPickerField.class,"c-pickerfield-error");
    }

    /**
     * создание окна подтверждения действия
     * @param header заголовок
     * @param content содержание(вопрос)
     * @param action действие, при нажатии ОК. лямбда без параметров
     */
    public void makeConfirmDialog(String header,String content,SomeDialogAction action){
        String capitalHeader= header.substring(0, 1).toUpperCase() + header.substring(1);
        String capitalContent= content.substring(0, 1).toUpperCase() + content.substring(1);
        window.showOptionDialog(
                capitalHeader,
                capitalContent ,
                Frame.MessageType.CONFIRMATION,
                new Action[] {
                        new DialogAction(DialogAction.Type.YES) {
                            @Override
                            public void actionPerform(Component component) {
                                action.call();
                            }
                        },
                        new DialogAction(DialogAction.Type.NO)
                }
        );
    }

    public void initOrderingForTable(GroupTable table,
                                     List<Object> availableOrderItems,
                                     List<Object> initialOrderItems,
                                     Map<Object,String> orderItemDescriptions){
        availableOrderItemsMap.put(table,availableOrderItems);
        currentOrderItemsMap.put(table,initialOrderItems);
        orderItemDescriptionsMap.put(table,orderItemDescriptions);

    }

    public void showOrderDialogForTable(GroupTable table){

        List<Object> availableItems=availableOrderItemsMap.get(table);
        List<Object> currentItems=currentOrderItemsMap.get(table);
        Map<Object,String> orderItemDescriptions=orderItemDescriptionsMap.get(table);

        if((availableItems==null)||(currentItems==null)||(orderItemDescriptions==null)){
            throw new DevelopmentException("showOrderDialog invoke before call initOrderingForTable");
        }
        
        createOrderDialog(messages.getMainMessage("group_order"),
                          messages.getMainMessage("available_items"),
                          messages.getMainMessage("current_order"),
                          currentItems,
                          availableItems,orderItemDescriptions,
                            map->{
                                int i=0;
                                List<Map.Entry<String,Object>> entries= (List<Map.Entry<String, Object>>) map.get("currentOrder");
                                Object[] obj =new Object[entries.size()];

                                currentItems.clear();;

                                for(Map.Entry ent:entries){
                                    obj[i]=ent.getValue();
                                    i++;
                                    currentItems.add(ent.getValue());
                                }
                                table.groupBy(obj);
                            });
    }



    public Component createEditableComponentForStageDataItem(QueryPositionStageData stageData,
                                                     String fieldType,
                                                     String fieldName,
                                                     String metadataPrefix,
                                                     boolean editable,
                                                     boolean requiredValidation,
                                                     QueriesPosition requiredFor,
                                                     StageDataService stageDataService,
                                                     SomeDialogAction refreshCallback){
        Component result=null;
        switch (fieldType){
            case "Date": {
                result=componentsFactory.createComponent(DateField.NAME);
                DateField dateField=(DateField)result;
                dateField.setValue(stageDataService.getDateData(stageData,fieldName));
                dateField.addValueChangeListener(value->{
                    QueryPositionStageData data=stageDataService.setData(stageData,fieldName,(Date)value.getValue());
                    //если при валидации поле было отмечено, то убираем стиль ошибки
                    dateField.removeStyleName(errorStyleMap.get(dateField.getClass()));
                });

                dateField.setResolution(DateField.Resolution.DAY);
                break;
            }
            case "String": {
                result=componentsFactory.createComponent(TextField.NAME);
                TextField textField=(TextField) result;
                textField.setValue(stageDataService.getStringData(stageData,fieldName));
                textField.addValueChangeListener(value->{
                    QueryPositionStageData data=stageDataService.setData(stageData,fieldName,(String)value.getValue());
                    textField.removeStyleName(errorStyleMap.get(textField.getClass()));
                });

                break;
            }
            case "Boolean": {
                result=componentsFactory.createComponent(CheckBox.NAME);
                CheckBox checkBox=(CheckBox)result;
                checkBox.setValue(stageDataService.getBooleanData(stageData,fieldName));
                checkBox.addValueChangeListener(value->{
                    QueryPositionStageData data=stageDataService.setData(stageData,fieldName,(Boolean) value.getValue());
                });

                break;
            }
            default:
                try {
                    //для энумов - выпадающий список, для объектнных полей pickerField
                    if(Class.forName("com.groupstp.supply.entity."+fieldType).isEnum()){
                        result=componentsFactory.createComponent(PopupButton.NAME);
                        PopupButton popupButton=(PopupButton) result;
                        popupButton.setCaption(stageDataService.getStringData(stageData,fieldName));
                        popupButton.setWidth("100%");

                        VBoxLayout layout=(VBoxLayout)componentsFactory.createComponent(VBoxLayout.NAME);

                        Arrays.asList(Class.forName("com.groupstp.supply.entity."+fieldType).getEnumConstants()).forEach(item->{
                            Button button=(Button)componentsFactory.createComponent(Button.NAME);
                            button.setCaption(item.toString());
                            button.setWidth("100%");
                            button.setAction(new BaseAction("") {
                                @Override
                                public void actionPerform(Component component) {
                                    QueryPositionStageData data=stageDataService.setData(stageData,fieldName,item.toString());
                                   refreshCallback.call();
                                }
                            });
                            layout.add(button);
                        });
                        popupButton.setPopupContent(layout);
                    }
                    else{
                        result=componentsFactory.createComponent(PickerField.NAME);
                        PickerField pickerField=(PickerField)result;
                        pickerField.addLookupAction();

                        Session session = metadata.getSession();
                        MetaClass metaClass1 = session.getClassNN(metadataPrefix);
                        pickerField.setMetaClass(metaClass1);


                        pickerField.setValue(stageDataService.getEntityData(stageData,fieldName));
                        pickerField.addValueChangeListener(value->{
                            QueryPositionStageData data=stageDataService.setData(stageData,fieldName,(StandardEntity) value.getValue());
                            pickerField.removeStyleName(errorStyleMap.get(pickerField.getClass()));
                        });

                    }
                } catch (ClassNotFoundException e) {
                    e.printStackTrace();
                }
        }
        return result;
    }

    public Component createPresentationComponentForStageDataItem(QueryPositionStageData stageData,
                                                             String fieldType,
                                                             String fieldName,
                                                             StageDataService stageDataService){
        Component result=null;
        switch (fieldType){
            case "Date": {
                result=componentsFactory.createComponent(Label.NAME);
                Label label=(Label)result;
                label.setValue(stageDataService.getDateData(stageData,fieldName));
                break;
            }
            case "String": {
                result=componentsFactory.createComponent(Label.NAME);
                Label label=(Label)result;
                label.setValue(stageDataService.getStringData(stageData,fieldName));
                break;
            }
            case "Boolean": {
                result=componentsFactory.createComponent(CheckBox.NAME);
                CheckBox checkBox=(CheckBox)result;
                checkBox.setEditable(false);
                checkBox.setValue(stageDataService.getBooleanData(stageData,fieldName));
                break;
            }
            default:
                result=componentsFactory.createComponent(Label.NAME);
                Label label=(Label)result;
                try {
                    if(Class.forName("com.groupstp.supply.entity."+fieldType).isEnum()){
                        label.setValue(stageDataService.getStringData(stageData,fieldName));
                    }
                    else{
                        StandardEntity entity1=stageDataService.getEntityData(stageData,fieldName);
                        label.setValue(entity1);
                    }

                    //если класс не грузится то отображаем как сущность
                } catch (ClassNotFoundException e) {
                    StandardEntity entity1=stageDataService.getEntityData(stageData,fieldName);
                    label.setValue(entity1);
                }
        }
        return result;
    }

    public Collection<QueriesPosition> validatePositionsAndGetCorrectItems(Collection<QueriesPosition> positions){
        return null;
    }

    //создает окно с перетаскиваемыми элементыми. при завершении выполняет SomeAction с параметром Map, в котором будет запись currentOrder - результирующий порядок
    private void createOrderDialog(String header,
                                  String leftGroupHeader,
                                  String rightGroupHeader,
                                  List<Object> currentOrder,
                                  List<Object> availableOrderItems,
                                  Map<Object,String> itemDescription,
                                  SomeAction okAction){

        List<Map.Entry> availableItems=new ArrayList<>();
        List<Map.Entry> currentOrderEntry=new ArrayList<>();

        for(Object orderItem:availableOrderItems){
            availableItems.add(new AbstractMap.SimpleEntry<String,Object>(itemDescription.get(orderItem),orderItem));
        }

        for(Object orderItem:currentOrder){
            currentOrderEntry.add(new AbstractMap.SimpleEntry<String,Object>(itemDescription.get(orderItem),orderItem));
        }

        Map<String,Object> map=new HashMap<>();
        Map<String,Object> param=new HashMap<>();
        map.put("availableItems",availableItems);
        map.put("currentOrder",currentOrderEntry);
        map.put("leftGroupHeader",leftGroupHeader);
        map.put("rightGroupHeader",rightGroupHeader);
        map.put("header",header);
        param.put("params",map);

        window.openWindow("chooseGroupOrder", WindowManager.OpenType.DIALOG,param)
                .addCloseListener(data->{
                    if(data.equals("ok"))okAction.execute(map);
                });

    }

    public interface SomeDialogAction{
        void call();
    }

    public interface SomeAction{
        void execute(Map map);
    }
}
