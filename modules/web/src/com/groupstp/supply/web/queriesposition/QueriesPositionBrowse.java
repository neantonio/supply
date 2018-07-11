package com.groupstp.supply.web.queriesposition;

import com.groupstp.supply.entity.*;
import com.groupstp.supply.service.*;
import com.haulmont.bali.util.ParamsMap;
import com.haulmont.chile.core.model.MetaClass;
import com.haulmont.chile.core.model.MetaProperty;
import com.haulmont.chile.core.model.Session;
import com.haulmont.cuba.core.app.EmailService;
import com.haulmont.cuba.core.entity.Entity;
import com.haulmont.cuba.core.entity.FileDescriptor;
import com.haulmont.cuba.core.entity.StandardEntity;
import com.haulmont.cuba.core.global.*;
import com.haulmont.cuba.gui.WindowManager;
import com.haulmont.cuba.gui.components.*;
import com.haulmont.cuba.gui.components.actions.BaseAction;
import com.haulmont.cuba.gui.data.CollectionDatasource;
import com.haulmont.cuba.gui.data.DataSupplier;
import com.haulmont.cuba.gui.data.GroupDatasource;
import com.haulmont.cuba.gui.export.ExportDisplay;
import com.haulmont.cuba.gui.export.ExportFormat;
import com.haulmont.cuba.gui.upload.FileUploadingAPI;
import com.haulmont.cuba.gui.xml.layout.ComponentsFactory;
import com.haulmont.cuba.gui.xml.layout.loaders.PickerFieldLoader;
import com.haulmont.cuba.web.gui.components.WebDateField;
import com.haulmont.cuba.web.gui.components.WebPickerField;
import com.haulmont.cuba.web.gui.components.WebTextField;
import com.vaadin.event.ItemClickEvent;
import com.vaadin.ui.ListSelect;
import com.vaadin.ui.Notification;
import org.dom4j.Element;

import javax.annotation.Nullable;
import javax.inject.Inject;
import java.util.*;
import java.util.stream.Collectors;

public class QueriesPositionBrowse extends AbstractLookup {

//    @Inject
//    private DataBaseTestContentService dataBaseTestContentService;

    @Inject
    private DataManager dataManager;

    @Inject
    private GroupDatasource<QueriesPosition, UUID> dsNomControl;

    @Inject
    private GroupDatasource<QueriesPosition, UUID> dsStoreControl;

    @Inject
    private GroupDatasource<QueriesPosition, UUID> dsLogistic;

    @Inject
    private CollectionDatasource<QueryPositionStageData, UUID> dsLogisticStageData;

    @Inject
    private Button nextCargoState;

    @Inject
    private Button previousCargoState;

    @Inject
    private GroupBoxLayout cargoStateGroupBox;

    @Inject
    private VBoxLayout cargoStateGroupBoxTotalLayout;

    @Inject
    private GroupTable<QueriesPosition> positionsNomControl;

    @Inject
    private GroupTable<QueriesPosition> positionsStoreControl;

    @Inject
    private GroupTable<QueriesPosition> positionsSupSelection;

    @Inject
    private GroupTable<QueriesPosition> positionsLogistic;

    @Inject
    private WorkflowService workflowService;

    @Inject
    private QueryDaoService queryDaoService;

    @Inject
    private TabSheet tabs;

    @Inject
    private ComponentsFactory componentsFactory;

    @Inject
    private StageDataService stageDataService;

    List<Object> nomControlGroupOrder=new ArrayList<>();
    List<Object> nomControlAvailableOrderItems=new ArrayList<>();

    Map<Object,String> nomControlAvailableOrderItemsDescription=new HashMap<>();

    //содержит пару: название данных/их тип
    Map<String,String> logisticStageDataItemsDescription=new HashMap<>();
    //список редактируемых полей
    List<String> logisticStageDataEditableFields=Arrays.asList(
            "destination_address",
            "acceptance_address",
            "carrier",
            "cargo_number",
            "planed_send_date",
            "planed_receive_date",
            "fact_send_date",
            "fact_receive_date",
            "cargo_monitoring_id",
            "cargo_monitoring_url",
            "store_receive_flag",
            "cargo_state");

    //список обязательных для заполнения полей
    List<String> logisticStageRequiredFields=Arrays.asList(
            "destination_address",
            "acceptance_address",
            "carrier",
            "cargo_number",
            "planed_send_date",
            "planed_receive_date",
            "fact_send_date",
            "fact_receive_date",
            "cargo_monitoring_id",
            "store_receive_flag");

    //карта актуальных stage data. нужно для нескольких транзакций подряд
    Map<QueriesPosition,QueryPositionStageData> stageDataMap=new HashMap<>();
    Map<Class,String> errorStyleMap=new HashMap<>();
    Map<QueriesPosition,List<Component>> componentsMapForValidation=new HashMap<>();

    private class QueryLinkGenerator implements Table.ColumnGenerator {

        /**
         * Called by {@link Table} when rendering a column for which the generator was created.
         *
         * @param entity an entity instance represented by the current row
         * @return a component to be rendered inside of the cell
         */
        @Override
        public Component generateCell(Entity entity) {
            Query q = ((QueriesPosition) entity).getQuery();
            LinkButton lnk = (LinkButton) componentsFactory.createComponent(LinkButton.NAME);
            lnk.setAction(new BaseAction("query").
                    withCaption(q.getInstanceName()).
                    withHandler(e-> openEditor(q, WindowManager.OpenType.DIALOG)));
            return lnk;
        }
    }

    @Override
    public void ready() {
        super.ready();


        nomControlGroupOrder.add(positionsStoreControl.getColumn("query.urgency").getId());
        nomControlGroupOrder.add(positionsStoreControl.getColumn("query.company").getId());
        nomControlGroupOrder.add(positionsStoreControl.getColumn("query.division").getId());
        nomControlGroupOrder.add(positionsStoreControl.getColumn("query").getId());

        nomControlAvailableOrderItems.add(positionsStoreControl.getColumn("query.urgency").getId());
        nomControlAvailableOrderItems.add(positionsStoreControl.getColumn("query.company").getId());
        nomControlAvailableOrderItems.add(positionsStoreControl.getColumn("query.division").getId());
        nomControlAvailableOrderItems.add(positionsStoreControl.getColumn("query").getId());
       // nomControlAvailableOrderItems.add(positionsStoreControl.getColumn("positionType").getId());
        //nomControlAvailableOrderItems.add(positionsStoreControl.getColumn("positionUsefulness").getId());


        nomControlAvailableOrderItemsDescription.put(positionsStoreControl.getColumn("query.urgency").getId(),messages.getMainMessage("query.urgency"));
        nomControlAvailableOrderItemsDescription.put(positionsStoreControl.getColumn("query.company").getId(),messages.getMainMessage("query.company"));
        nomControlAvailableOrderItemsDescription.put(positionsStoreControl.getColumn("query.division").getId(),messages.getMainMessage("query.division"));
        nomControlAvailableOrderItemsDescription.put(positionsStoreControl.getColumn("query").getId(),messages.getMainMessage("query"));
       // nomControlAvailableOrderItemsDescription.put(positionsStoreControl.getColumn("positionType").getId(),messages.getMainMessage("positionType"));
        //nomControlAvailableOrderItemsDescription.put(positionsStoreControl.getColumn("positionUsefulness").getId(),messages.getMainMessage("positionUsefulness"));

        setupNomControl();
        setupStoreControl();
        restorePanel();
        tabs.addSelectedTabChangeListener(event -> {
            savePanel();
            getOpenedStageTable().getDatasource().refresh();
        });
    }

    /**
     * @author AntonLomako
     * инициализация карт описания данных на этапах
     */
    private void initStageDataDescription(){
        logisticStageDataItemsDescription.put("destination_address","String");
        logisticStageDataItemsDescription.put("acceptance_address","String");

        logisticStageDataItemsDescription.put("carrier","Company");
        logisticStageDataItemsDescription.put("cargo_number","String");
        logisticStageDataItemsDescription.put("cargo_state","CargoState");

        logisticStageDataItemsDescription.put("planed_send_date","Date");
        logisticStageDataItemsDescription.put("planed_receive_date","Date");
        logisticStageDataItemsDescription.put("fact_send_date","Date");
        logisticStageDataItemsDescription.put("fact_receive_date","Date");

        logisticStageDataItemsDescription.put("cargo_monitoring_id","String");
        logisticStageDataItemsDescription.put("cargo_monitoring_url","String");

        logisticStageDataItemsDescription.put("store_receive_flag","Boolean");
        logisticStageDataItemsDescription.put("store_receive_ts","Date");
        logisticStageDataItemsDescription.put("store_receive_responsible","User");

    }

    /**
     * @author AntonLomako
     * иницииализирует мап, содержащий стили ошибок для компонентов, нужен для выведения ошибок при валидации
     */
    private void initErrorStyleMap(){
        errorStyleMap.put(WebDateField.class,"v-datefield-error");
        errorStyleMap.put(WebTextField.class,"v-textfield-error");
        errorStyleMap.put(WebPickerField.class,"c-pickerfield-error");
    }

    /**
     * @author AntonLomako
     * добавляет компоненты в мап, из которого они извлекаются при валидации
     * @param position
     * @param component
     */
    private void addComponentToValidationMap(QueriesPosition position,Component component){
        if(componentsMapForValidation.get(position)==null){
            componentsMapForValidation.put(position,new ArrayList<>());

        }
        componentsMapForValidation.get(position).add(component);

    }

    /**
     * @author AntonLomako
     * добавление сгенерированных колонок в таблицу логистики
     */
    private void initLogisticStageTable(){

        initErrorStyleMap();
        initStageDataDescription();
        refreshLogistic();          //нужны актуальные данные в датасорсах
        processLogisticStageTableSelection(Collections.emptyList());

        componentsMapForValidation.clear();
        stageDataMap.clear();
        dsLogisticStageData.getItems().forEach(item->{
            stageDataMap.put(item.getPosition(),item);
        });

        logisticStageDataItemsDescription.entrySet().forEach(entry->{

            positionsLogistic.addGeneratedColumn(getMessage(entry.getKey()),entity -> {
                QueryPositionStageData stageData=stageDataService.
                        getOrCreateStageDataForPositionFromCollectionAndDescription(dsLogisticStageData.getItems(),
                                entity,
                                logisticStageDataItemsDescription);

                //если stageData была создана, то ее надо добавить в датасорс и в map
                if(!dsLogisticStageData.getItems().contains(stageData)) {
                    dsLogisticStageData.addItem(stageData);
                    stageDataMap.put(stageData.getPosition(),stageData);
                }

                //создаем визуальный компонент в зависимости от типа данных
                //для коипонентов, которые есть в списке редактируемых создаем редактируемые поля
                Component component=null;

                if(logisticStageDataEditableFields.contains(entry.getKey())){

                   //при установке чекбокса получения на складе должны вызываться методы установки/очищения времени получения и ответственного
                    if(entry.getKey().equals("store_receive_flag")){
                        component=componentsFactory.createComponent(CheckBox.NAME);
                        CheckBox checkBox=(CheckBox)component;
                        checkBox.setValue(stageDataService.getBooleanData(stageDataMap.get(entity),entry.getKey()));
                        checkBox.addValueChangeListener(value->{
                            if((Boolean)value.getValue()) setStoreGetDataForPosition(entity);
                            else clearStoreGetDataForPosition(entity);
                            refreshLogistic();
                        });

                    }
                    else{
                        switch (entry.getValue()){
                            case "Date": {
                                component=componentsFactory.createComponent(DateField.NAME);
                                DateField dateField=(DateField)component;
                                dateField.setValue(stageDataService.getDateData(stageDataMap.get(entity),entry.getKey()));
                                dateField.setResolution(DateField.Resolution.DAY);
                                dateField.addValueChangeListener(value->{
                                    dsLogisticStageData.excludeItem(stageDataMap.get(entity));
                                    QueryPositionStageData data=stageDataService.setData(stageDataMap.get(entity),entry.getKey(),(Date)value.getValue());
                                    dsLogisticStageData.addItem(data);
                                    stageDataMap.put(entity,data);
                                    dateField.removeStyleName(errorStyleMap.get(dateField.getClass()));

                                });
                                break;
                            }
                            case "String": {
                                component=componentsFactory.createComponent(TextField.NAME);
                                TextField textField=(TextField) component;
                                textField.setValue(stageDataService.getStringData(stageDataMap.get(entity),entry.getKey()));
                                textField.addValueChangeListener(value->{
                                    dsLogisticStageData.excludeItem(stageDataMap.get(entity));
                                    QueryPositionStageData data=stageDataService.setData(stageDataMap.get(entity),entry.getKey(),(String)value.getValue());
                                    dsLogisticStageData.addItem(data);
                                    stageDataMap.put(entity,data);
                                   textField.removeStyleName(errorStyleMap.get(textField.getClass()));
                                });

                                break;
                            }
                            case "Boolean": {
                                component=componentsFactory.createComponent(CheckBox.NAME);
                                CheckBox checkBox=(CheckBox)component;
                                checkBox.setValue(stageDataService.getBooleanData(stageDataMap.get(entity),entry.getKey()));
                                checkBox.addValueChangeListener(value->{
                                    dsLogisticStageData.excludeItem(stageDataMap.get(entity));
                                    QueryPositionStageData data=stageDataService.setData(stageDataMap.get(entity),entry.getKey(),(Boolean) value.getValue());
                                    dsLogisticStageData.addItem(data);
                                    stageDataMap.put(entity,data);

                                });

                                break;
                            }
                            default:
                                try {
                                    //для энумов - выпадающий список, для объектнных полей pickerField
                                    if(Class.forName("com.groupstp.supply.entity."+entry.getValue()).isEnum()){
                                        component=componentsFactory.createComponent(PopupButton.NAME);
                                        PopupButton popupButton=(PopupButton) component;
                                        String caption=stageDataService.getStringData(stageDataMap.get(entity),entry.getKey());
                                        if(caption!=null)popupButton.setCaption(getMessage(caption));
                                        popupButton.setWidth("100%");

                                        VBoxLayout layout=(VBoxLayout)componentsFactory.createComponent(VBoxLayout.NAME);

                                        Arrays.asList(Class.forName("com.groupstp.supply.entity."+entry.getValue()).getEnumConstants()).forEach(item->{
                                            Button button=(Button)componentsFactory.createComponent(Button.NAME);
                                            button.setCaption(getMessage(item.toString()));
                                            button.setWidth("100%");
                                            button.setAction(new BaseAction("") {
                                                @Override
                                                public void actionPerform(Component component) {
                                                    dsLogisticStageData.excludeItem(stageDataMap.get(entity));
                                                    QueryPositionStageData data=stageDataService.setData(stageDataMap.get(entity),entry.getKey(),item.toString());
                                                    dsLogisticStageData.addItem(data);
                                                    stageDataMap.put(entity,data);
                                                    refreshLogistic();
                                                    processLogisticStageTableSelection(positionsLogistic.getSelected());
                                                }
                                            });
                                            layout.add(button);
                                        });
                                        popupButton.setPopupContent(layout);
                                    }
                                    else{
                                        component=componentsFactory.createComponent(PickerField.NAME);
                                        PickerField pickerField=(PickerField)component;
                                        pickerField.addLookupAction();

                                        Session session = metadata.getSession();
                                        MetaClass metaClass1 = session.getClassNN(queryDaoService.getMetaclassPrefix(entry.getValue())+ entry.getValue());
                                        pickerField.setMetaClass(metaClass1);


                                        pickerField.setValue(stageDataService.getEntityData(stageDataMap.get(entity),entry.getKey()));
                                        pickerField.addValueChangeListener(value->{
                                            dsLogisticStageData.excludeItem(stageDataMap.get(entity));
                                            QueryPositionStageData data=stageDataService.setData(stageDataMap.get(entity),entry.getKey(),(StandardEntity) value.getValue());
                                            dsLogisticStageData.addItem(data);
                                            stageDataMap.put(entity,data);
                                            pickerField.removeStyleName(errorStyleMap.get(pickerField.getClass()));
                                        });

                                    }
                                } catch (ClassNotFoundException e) {
                                    e.printStackTrace();
                                }
                        }
                        if(logisticStageRequiredFields.contains(entry.getKey()))
                            addComponentToValidationMap(entity,component);
                    }
                }
                else{

                    switch (entry.getValue()){
                        case "Date": {
                            component=componentsFactory.createComponent(Label.NAME);
                            Label label=(Label)component;
                            label.setValue(stageDataService.getDateData(stageDataMap.get(entity),entry.getKey()));
                            break;
                        }
                        case "String": {
                            component=componentsFactory.createComponent(Label.NAME);
                            Label label=(Label)component;
                            label.setValue(stageDataService.getStringData(stageDataMap.get(entity),entry.getKey()));
                            break;
                        }
                        case "Boolean": {
                            component=componentsFactory.createComponent(CheckBox.NAME);
                            CheckBox checkBox=(CheckBox)component;
                            checkBox.setEditable(false);
                            checkBox.setValue(stageDataService.getBooleanData(stageDataMap.get(entity),entry.getKey()));
                            break;
                        }
                        default:
                            component=componentsFactory.createComponent(Label.NAME);
                            Label label=(Label)component;
                            try {
                                if(Class.forName("com.groupstp.supply.entity."+entry.getValue()).isEnum()){
                                   label.setValue(stageDataService.getStringData(stageDataMap.get(entity),entry.getKey()));
                                }
                                else{
                                    StandardEntity entity1=stageDataService.getEntityData(stageDataMap.get(entity),entry.getKey());
                                    label.setValue(entity1);
                                }

                            //если класс не грузится то отображаем как сущность
                            } catch (ClassNotFoundException e) {
                                StandardEntity entity1=stageDataService.getEntityData(stageDataMap.get(entity),entry.getKey());
                                label.setValue(entity1);
                            }
                    }
                }


                return component;
            });


        });



        com.vaadin.ui.Table vTable = positionsLogistic.unwrap(com.vaadin.ui.Table.class);
        vTable.addItemClickListener((ItemClickEvent.ItemClickListener) event ->{

            //напрямую выбранный элемент не получить. достаем его по id
            QueriesPosition qp=dsLogistic.getItem(UUID.fromString(event.getItemId().toString()));

            //сюда попадает прошлое выделение, поэтому его надо обрабатывать
            Collection<QueriesPosition> qpCollection=new ArrayList<QueriesPosition>();
            if(event.isCtrlKey()){
                qpCollection.addAll(positionsLogistic.getSelected());
                if(qpCollection.contains(qp))qpCollection.remove(qp);
                else qpCollection.add(qp);
            }
            else qpCollection.add(qp);

            processLogisticStageTableSelection(qpCollection);
        }
        );

    }

    /**
     * @author AntonLomako
     * при переводе на этап проверяет заполнение необходимых полей
     */
    private Collection<QueriesPosition> checkFillingOfRequiredFieldForPositions(Collection<QueriesPosition> positions){

        List<QueriesPosition> correctPositions=new ArrayList<>();
        positions.forEach(item->{
            Boolean positionIsCorrect=true;
            List<Component> components=componentsMapForValidation.get(item);
            if(components!=null){
                for(Component component:components){
                    if(((HasValue)component).getValue()==null) {
                        component.addStyleName(errorStyleMap.get(component.getClass()));
                        positionIsCorrect=false;
                    }
                }
            }
            if(positionIsCorrect) correctPositions.add(item);
        });
        return correctPositions;
    }

    private void moveCargoOfSelectedItemsToStage(CargoState state){
        positionsLogistic.getSelected().forEach(item->{
            dsLogisticStageData.excludeItem(stageDataMap.get(item));
            QueryPositionStageData data=stageDataService.setData(stageDataMap.get(item),"cargo_state",state.toString());
            dsLogisticStageData.addItem(data);
            stageDataMap.put(item,data);
            processLogisticStageTableSelection(positionsLogistic.getSelected());

        });
        refreshLogistic();
    }

    private int selectedState;
    private int getSelectedState(){return selectedState;}

    /**
     * @author AntonLomako
     * обработка выбранных ячеек для определения текста кнопок переещения по этапам логистики и их активности
     */
    private void processLogisticStageTableSelection(Collection<QueriesPosition> queriesPositions){
        Boolean changeCargoStateButtonsAreEnable=true;
        Boolean selectedFirstState=false;
        Boolean selectedLastState=false;

        Map <String,Integer> cargoStateTotal=new HashMap<>();
        int totalCargoStateSelected=0;// без пустых статусов
       selectedState=-1;

        List<CargoState> cargoStates=Arrays.asList(CargoState.values());

        if(queriesPositions.size()==0){
            changeCargoStateButtonsAreEnable=false;
        }

        //ведется подсчет этапов груза для выбранных позиций
        else{
            for(QueriesPosition item:queriesPositions){
                String state=stageDataService.getStringData(stageDataMap.get(item),"cargo_state");
                if(state!=null){
                    selectedState=cargoStates.indexOf(CargoState.valueOf(state));
                    if(selectedState==0) selectedFirstState=true;
                    if(selectedState==cargoStates.size()-1) selectedLastState=true;
                    totalCargoStateSelected++;
                    if(cargoStateTotal.get(state)!=null)cargoStateTotal.put(state,cargoStateTotal.get(state)+1);
                    else cargoStateTotal.put(state,1);
                }
            }

            //выбрано несколько разных этапов, одновременное перемещение невозможно
            if(cargoStateTotal.entrySet().size()>1) changeCargoStateButtonsAreEnable=false;
        }

        cargoStateGroupBox.setCaption(getMessage("selected_total")+": "+String.valueOf(totalCargoStateSelected));
        cargoStateGroupBoxTotalLayout.removeAll();

        cargoStateTotal.entrySet().forEach(entry->{
            Label label=(Label)componentsFactory.createComponent(Label.NAME);
            label.setValue(getMessage(entry.getKey())+" :"+String.valueOf(entry.getValue()));
            cargoStateGroupBoxTotalLayout.add(label,0);
        });

        initCargoStateButtons();

        if(changeCargoStateButtonsAreEnable&&!selectedLastState){
            nextCargoState.setVisible(true);
            nextCargoState.setCaption(getMessage("cargo_to")+" '" +getMessage(cargoStates.get(selectedState+1).toString())+"'");

        }
        else{
            nextCargoState.setVisible(false);
            //nextCargoState.setCaption(getMessage("next_move_impossible"));
        }

        if(changeCargoStateButtonsAreEnable&&!selectedFirstState){
            if(selectedState==-1){
                previousCargoState.setVisible(false);
            }
            else {
                previousCargoState.setVisible(true);
                //previousCargoState.setEnabled(true);
                previousCargoState.setCaption(getMessage("cargo_to")+" '" + getMessage(cargoStates.get(selectedState - 1).toString())+"'");
            }
        }
        else{
            previousCargoState.setVisible(false);
            //previousCargoState.setCaption(getMessage("back_move_impossible"));
        }

        if(!changeCargoStateButtonsAreEnable){
            Label label=(Label)componentsFactory.createComponent(Label.NAME);
            label.setValue(getMessage("impossible_move"));
            cargoStateGroupBoxTotalLayout.add(label);
        }


    }

    private void initCargoStateButtons(){
        if(nextCargoState.getAction()==null) {
            nextCargoState.setAction(new BaseAction("") {
                @Override
                public void actionPerform(Component component) {
                    moveCargoOfSelectedItemsToStage(CargoState.values()[getSelectedState()+1]);
                }
            });
        }
        if(previousCargoState.getAction()==null) {
            previousCargoState.setAction(new BaseAction("") {
                @Override
                public void actionPerform(Component component) {
                    moveCargoOfSelectedItemsToStage(CargoState.values()[getSelectedState()-1]);
                }
            });
        }
    }

    /**
     * @author AntonLomako
     * обновление датасорсов и, соответственно, обновление таблицы логистики
     */
    private void refreshLogistic(){
        dsLogistic.refresh();
        dsLogisticStageData.refresh(ParamsMap.of("positions",dsLogistic.getItems()));
    }

    /**
     * обработка получения на складе
     * выставляются время, флаг получения, ответственный
     */
    public void onStoreGet() throws ValidationException {

        Set<QueriesPosition> selectedPositions=positionsLogistic.getSelected();
        if (selectedPositions.size() == 0) {
            showNotification(getMessage("Select position first"), NotificationType.WARNING);
            return;
        }

        selectedPositions.forEach(item->{
            setStoreGetDataForPosition(item);

        });
        refreshLogistic();
    }

    /**
     * данные получения на складе устанавливаются для позиции
     * @param position
     */
    private void setStoreGetDataForPosition(QueriesPosition position){
        dsLogisticStageData.excludeItem(stageDataMap.get(position));
        QueryPositionStageData data=stageDataService.setData(stageDataMap.get(position),
                "store_receive_flag",
                true);

        data=stageDataService.setData(data,
                "store_receive_ts",
                java.util.Calendar.getInstance().getTime());

        data=stageDataService.setData(data,
                "store_receive_responsible",
                AppBeans.get(UserSessionSource.class).getUserSession().getUser().getId().toString());

        dsLogisticStageData.addItem(data);
        stageDataMap.put(position,data);
    }

    /**
     * данные получения на складе очищаются для позиции
     * @param position
     */
    private void clearStoreGetDataForPosition(QueriesPosition position){
        dsLogisticStageData.excludeItem(stageDataMap.get(position));
        QueryPositionStageData data=stageDataService.setData(stageDataMap.get(position),
                "store_receive_flag",
                false);

        data=stageDataService.setData(data,
                "store_receive_ts",
                (Date)null);

        data=stageDataService.setData(data,
                "store_receive_responsible",
                (StandardEntity)null);

        dsLogisticStageData.addItem(data);
        stageDataMap.put(position,data);
    }

    private void savePanel() {
        Element x = getSettings().get(tabs.getId());
        x.addAttribute("tabOpened", tabs.getSelectedTab().getName());
        saveSettings();
    }

    private void restorePanel() {
        if(getSettings().get(tabs.getId()).attribute("tabOpened")==null)
            return;
        tabs.setSelectedTab(getSettings().get(tabs.getId()).attribute("tabOpened").getValue());
    }

    /**
     * Настройка вкладки номенклатурный контроль
     */
    private void setupNomControl() {
        GroupTable<QueriesPosition> p = positionsNomControl;
        p.addGeneratedColumn("queryLink", new QueryLinkGenerator());
        p.groupBy(nomControlGroupOrder.toArray());
        dsNomControl.addItemPropertyChangeListener(e -> {
            if("positionUsefulness".equals(e.getProperty()) && e.getValue().equals(true)) {
                e.getItem().setPositionUsefulnessTS(new Date());
            }
        });
    }

    public void onNomControlGroupOrderChange(){
        createGroupOrderDialog(nomControlGroupOrder,nomControlAvailableOrderItems,nomControlAvailableOrderItemsDescription,map->{
            int i=0;
            List<Map.Entry<String,Object>> entries= (List<Map.Entry<String, Object>>) map.get("currentOrder");
            Object[] obj =new Object[entries.size()];

            nomControlGroupOrder.clear();;

            for(Map.Entry ent:entries){
                obj[i]=ent.getValue();
                i++;
                nomControlGroupOrder.add(ent.getValue());
            }
            positionsNomControl.groupBy(obj);
        });


    }

    interface SomeAction{
        void execute(Map map);
    }


    //создает окно с перетаскиваемыми элементыми. при завершении выполняет SomeAction с параметром Map, в котором будет запись currentOrder - результирующий порядок
    public void createGroupOrderDialog(List<Object> currentOrder,List<Object> availableOrderItems,Map<Object,String> itemDescription,SomeAction okAction){

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
        param.put("params",map);

        openWindow("chooseGroupOrder", WindowManager.OpenType.DIALOG,param)
                .addCloseListener(data->{
                    if(data.equals("ok"))okAction.execute(map);
                        });

    }

    /**
     * настройка складскго контроля
     */
    private void setupStoreControl() {
        GroupTable<QueriesPosition> p = positionsStoreControl;
        p.addGeneratedColumn("queryLink", new QueryLinkGenerator());
        p.groupBy(new Object[]{
                p.getColumn("query.urgency").getId(),
                p.getColumn("query.company").getId(),
                p.getColumn("query.division").getId()});
        //dsStoreControl.addItemPropertyChangeListener(e -> {});
    }

    /**
     * Обработчик нажатия на кнопку Целесообразность заявки, устаналивает признак целесообразности для всех позиций заявки
     */
    public void onBtnSetQueryUsefulnessClick() {
        QueriesPosition position = positionsNomControl.getSingleSelected();
        if (position == null) {
            showNotification(getMessage("Select position first"), NotificationType.WARNING);
            return;
        }
        dsNomControl.getChildItems(dsNomControl.getParentGroup(position)).forEach(entity -> {
            entity.setValue("positionUsefulness", true);
        });
    }

    /**
     * Раскрывает все группировки активной таблицы
     */
    public void onBtnExpandAllClick() {
        getOpenedStageTable().expandAll();
    }

    /**
     * Сворачивает все группировки активной таблицы
     */
    public void onBtnCollapseAllClick() {
        getOpenedStageTable().collapseAll();
    }

    @Inject
    private GroovyTestService groovyTestService;

    /**
     * Для списка выделенных позиций пытается первести их на следующий этап
     */
    public void onBtnDoneClick() throws Exception {
        movePositions();
    }

    /**
     * Для списка выделенных позиций проверяется заполнение необходимых полей
     * получается список позиций с незаполненными полями
     * пользователю выводится запрос, что делать с теми, которые заполнены: перевести их или подождать
     */
    public void onLogisticBtnDoneClick() throws Exception {

        Set<QueriesPosition> selectedPositions=positionsLogistic.getSelected();
        if (selectedPositions.size() == 0) {
            showNotification(getMessage("Select position first"), NotificationType.WARNING);
            return;
        }
        Collection <QueriesPosition> correctPositions=checkFillingOfRequiredFieldForPositions(positionsLogistic.getSelected());

        if(correctPositions.size()>0){
            makeConfirmDialog(
                    getMessage("position_moving")
                    ,getMessage("correct_position_value")+": "+String.valueOf(correctPositions.size())+". "+getMessage("move_them_to_next_stage")+"?"
                    ,()->{
                        correctPositions.forEach(item->{
                            try {
                                workflowService.movePosition(item);
                            } catch (Exception e) {
                                e.printStackTrace();
                            }
                        });
                        refreshLogistic();
            });
        }
        else {
            showNotification(getMessage("fill_required_fields"),NotificationType.TRAY);
        }

    }

    /**
     * создание окна подтверждения действия
     * @param header заголовок
     * @param content содержание(вопрос)
     * @param action действие, при нажатии ОК. лямбда без параметров
     */
    private void makeConfirmDialog(String header,String content,SomeDialogAction action){
        String capitalHeader= header.substring(0, 1).toUpperCase() + header.substring(1);
        String capitalContent= content.substring(0, 1).toUpperCase() + content.substring(1);
        showOptionDialog(
                capitalHeader,
                capitalContent ,
                MessageType.CONFIRMATION,
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

    interface SomeDialogAction{
        void call();
    }

    private void movePositions() throws Exception {
        GroupTable<QueriesPosition> grpTab = getOpenedStageTable();
        GroupDatasource ds = grpTab.getDatasource();
        Set<QueriesPosition> positions = grpTab.getSelected();
        for (QueriesPosition position : positions) {
            workflowService.movePosition(position);
//TEST groovy scripts
//            groovyTestService.testScript( position);
        }
        ds.refresh();
    }

    /**
     * Обработчик нажатия кнопки Записать.
     * Записывает изменния таблицы в БД.
     */
    public void onBtnWriteClick() {
        GroupTable<QueriesPosition> tab = getOpenedStageTable();
        tab.getDatasource().commit();
        tab.getDatasource().refresh();
    }

    /**
     * Возвращает строковое представление текущей открытой вкладки (этапа)
     *
     * @return текущий открытый этап
     */
    public String getOpenedStage() {
        return tabs.getSelectedTab().getName().replace("tab", "");
    }

    /**
     * Возвращает таблицу GroupTable текущего открытого этапа
     *
     * @return GroupTable
     */
    public GroupTable<QueriesPosition> getOpenedStageTable() {
        return (GroupTable<QueriesPosition>) tabs.getComponentNN("positions" + getOpenedStage());
    }

    /**
     * Разделяет позицию на несколько подпозиций, для текущей позиции устанавливается этап "Разделенная"
     */
    public void onBtnSplitClick() {
        GroupTable<QueriesPosition> tab = getOpenedStageTable();
        QueriesPosition position = tab.getSingleSelected();
        if (position.getPosition() != null) {
            position = position.getPosition();
        }
        QueriesPosition copy = copyPosition(position);
        copy.setPosition(position);
        if (Stages.StoreControl.equals(position.getCurrentStage()))
            position.setCurrentStage(Stages.Divided);
        tab.getDatasource().addItem(copy);
    }

    @Inject
    private Metadata metadata;

    /**
     * Копирует текущую позицию
     * @param position позиция для копирования
     * @return новую позицию
     */
    private QueriesPosition copyPosition(QueriesPosition position) {
        QueriesPosition src = dataManager.reload(position, "queriesPosition-full");
        QueriesPosition copy = metadata.create(QueriesPosition.class);
        Collection<MetaProperty> properties = position.getMetaClass().getProperties();
        for (MetaProperty property : properties) {
            if (property.getDeclaringClass() != position.getMetaClass().getJavaClass())
                continue;
            String name = property.getName();
            copy.setValue(name, src.getValue(name));
        }
        return copy;
    }

    /**
     * Открывает подбор поставщиков
     */
    public void onBtnSuppliersClick() {
        GroupTable tab = getOpenedStageTable();
        if (tab.getSelected().size() == 0) {
            showNotification(getMessage("Select position first"), NotificationType.WARNING);
            return;
        }
        HashMap<String, Object> items = new HashMap<>();
        items.put("positions", tab.getSelected());
        openWindow("supply$PositionSupplier.browse", WindowManager.OpenType.DIALOG, items);
    }

    /**
     * Открывает ввод предложений
     */
    public void onBtnSuggestionsClick() {
        GroupTable tab = getOpenedStageTable();
        if (tab.getSelected().size() == 0) {
            showNotification(getMessage("Select position first"), NotificationType.WARNING);
            return;
        }
        HashMap<String, Object> items = new HashMap<>();
        items.put("positions", tab.getSelected());
        openWindow("supply$SuppliersSuggestion.browse", WindowManager.OpenType.DIALOG, items);
    }

    @Inject
    private GroupTable<QueriesPosition> positionsComission;

    /**
     * Открывает голосование
     */
    public void onBtnVoteClick() {

        if (positionsComission.getSelected().size() == 0) {
            showNotification(getMessage("Select position first"), NotificationType.WARNING);
            return;
        }
        HashMap<String, Object> items = new HashMap<>();
        items.put("positions", positionsComission.getSelected());
        openWindow("supply$VoteDialog", WindowManager.OpenType.DIALOG, items);
    }

    /**
     * Обработчик нажатия кнопки Готово на вкладке Закупочная комиссия
     * @throws Exception
     */
    public void onBtnDoneClickComission() throws Exception {
        setVote();
    }

    @Inject
    private VoteService voteService;

    /**
     * Записывает голос, если есть победитель в QP
     * @throws Exception
     */
    private void setVote() throws Exception {
        GroupTable<QueriesPosition> grpTab = getOpenedStageTable();
        GroupDatasource ds = grpTab.getDatasource();
        Set<QueriesPosition> positions = grpTab.getSelected();
        for (QueriesPosition position: positions) {
            workflowService.movePosition(position);
            voteService.setVoteForPosition(position);
        }
        ds.refresh();
    }

    @Inject
    private GroupTable<QueriesPosition> positionsBills;

    @Inject
    private Table<Bills> billsTable;

    @Inject
    private GroupDatasource<QueriesPosition, UUID> dsBills;

    @Inject
    private GroupDatasource<Bills, UUID> billsesDs;

    @Inject
    private DataSupplier dataSupplier;
    @Inject
    private FileUploadingAPI fileUploadingAPI;
    @Inject
    private ExportDisplay exportDisplay;
    @Inject
    private FileUploadField uploadField;
    @Inject
    private Button downloadImageBtn;
    @Inject
    private Button clearImageBtn;
    @Inject
    private Button OpenInNewTabBtn;
    @Inject
    private BrowserFrame imageForBill;


    @Override
    public void init(Map<String, Object> params) {

        initLogisticStageTable();

        //Генерируемая колонка "Сумма"
        positionsBills.addGeneratedColumn("Сумма", new Table.PrintableColumnGenerator<QueriesPosition, String>() {
            @Override
            public Component generateCell(QueriesPosition entity) {
                Label label = (Label) componentsFactory.createComponent(Label.NAME);
                if (entity.getVoteResult() == null) {
                    return label;
                }
                label.setValue(entity.getVoteResult().getPrice() * entity.getVoteResult().getQuantity());
                return label;
            }

            @Override
            public String getValue(QueriesPosition entity) {
                if (entity.getVoteResult() == null) {
                    return null;
                }
                return Double.toString(entity.getVoteResult().getPrice() * entity.getVoteResult().getQuantity());
            }
        });

        // События при клике на счет
        billsTable.setClickListener("number", (item, columnId) -> setClickListenerToBills(item, columnId));
        billsTable.setClickListener("timePayment", (item, columnId) -> setClickListenerToBills(item, columnId));
        billsTable.setClickListener("amount", (item, columnId) -> setClickListenerToBills(item, columnId));
        billsTable.setClickListener("sumControl", (item, columnId) -> setClickListenerToBills(item, columnId));
        billsTable.setClickListener("supplier", (item, columnId) -> setClickListenerToBills(item, columnId));
        billsTable.setClickListener("company", (item, columnId) -> setClickListenerToBills(item, columnId));

        //Значки прикрепления счета
        positionsBills.setIconProvider(new Table.IconProvider<QueriesPosition>() {
            @Nullable
            @Override
            public String getItemIcon(QueriesPosition entity) {
                return entity.getBills() != null ? "icons/ok.png" : "icons/cancel.png";
            }
        });

        //Вывод изображения счета
        uploadField.addFileUploadSucceedListener(event -> uploadFieldListenerRealization());

        //Оповещение об ошибках загрузки файла
        uploadField.addFileUploadErrorListener(event ->
                showNotification("File upload error", NotificationType.HUMANIZED));

    }

    /**
     * @param item     - счет
     * @param columnId id столбца таблицы
     * @author Andrey Kolosov
     * События при клике на счет
     */
    private void setClickListenerToBills(Entity item, String columnId) {
        Bills clickedBills = (Bills) item;
        HashMap<String, Object> items = new HashMap<>();
        items.put("supplerId", clickedBills.getSupplier().getId());
        items.put("billId", clickedBills.getId());
        dsBills.setQuery("select e from supply$QueriesPosition e LEFT JOIN e.voteResult v LEFT JOIN v.posSup p LEFT JOIN p.supplier s LEFT JOIN e.bills b\n" +
                "where e.currentStage='Bills' and (" +
                "b.id = :custom$billId\n" +
                "or\n" +
                "(s.id = :custom$supplerId and e.bills is null))");
        dsBills.refresh(items);
        billsTable.setSelected(clickedBills);
        displayImage();

    }

    /**
     * @author Andrey Kolosov
     * Загрузка изображения и прикрепление к счету
     */
    private void uploadFieldListenerRealization() {
        FileDescriptor fd = uploadField.getFileDescriptor();
        try {
            fileUploadingAPI.putFileIntoStorage(uploadField.getFileId(), fd);
        } catch (FileStorageException e) {
            throw new RuntimeException("Error saving file to FileStorage", e);
        }
        billsTable.getSelected().iterator().next().setImageBill(dataSupplier.commit(fd));
        billsesDs.commit();
        displayImage();
    }

    /**
     * @author Andrey Kolosov
     * Скачать изображение счета
     */
    public void onDownloadImageBtnClick() {
        if (billsTable.getSelected().size() != 1) {
            showNotification(getMessage("Select bill first"), NotificationType.WARNING);
            return;
        }
        FileDescriptor fileDescriptorImageBill = billsTable.getSelected().iterator().next().getImageBill();
        if (fileDescriptorImageBill != null) {
            exportDisplay.show(fileDescriptorImageBill, ExportFormat.OCTET_STREAM);
        } else {
            showNotification(getMessage("No Image for Bill"), NotificationType.WARNING);
        }
    }

    /**
     * @author Andrey Kolosov
     * Удалить изображение счета
     */
    public void onClearImageBtnClick() {

        if (billsTable.getSelected().size() != 1) {
            showNotification(getMessage("Select bill first"), NotificationType.WARNING);
            return;
        }
        Bills currentBill = billsTable.getSelected().iterator().next();
        currentBill.setImageBill(null);
        billsesDs.commit();
        displayImage();
    }

    /**
     * @author Andrey Kolosov
     * Метод отображения изображения счета в BrowserFrame imageForBill
     */
    private void displayImage() {
        if (billsTable.getSelected().size() != 1) {
            showNotification(getMessage("Select bill first"), NotificationType.WARNING);
            return;
        }
        FileDescriptor fileDescriptorImageBill = billsTable.getSelected().iterator().next().getImageBill();
        if (fileDescriptorImageBill != null) {
            imageForBill.setSource(FileDescriptorResource.class).setFileDescriptor(fileDescriptorImageBill);
            updateImageButtons(true);
        } else {
            imageForBill.setSource(FileDescriptorResource.class);
            imageForBill.setAlternateText("Изображения нет");
            updateImageButtons(false);
        }
    }

    /**
     * @author Andrey Kolosov
     * Открыть изображение/PDF в новой вкладке
     */
    public void onOpenInNewTabBtnClick() {

        if (billsTable.getSelected().size() != 1) {
            showNotification(getMessage("Select bill first"), NotificationType.WARNING);
            return;
        }
        FileDescriptor fileDescriptorImageBill = billsTable.getSelected().iterator().next().getImageBill();
        if (fileDescriptorImageBill != null) {
            exportDisplay.show(fileDescriptorImageBill, ExportFormat.getByExtension(fileDescriptorImageBill.getExtension()));
        } else {
            showNotification(getMessage("No Image for Bill"), NotificationType.WARNING);
        }
    }

    /**
     * @param enable условие активации
     * @author Andrey Kolosov
     * Активация/Деактивация кнопок для изображения счета
     */
    private void updateImageButtons(boolean enable) {
        downloadImageBtn.setEnabled(enable);
        clearImageBtn.setEnabled(enable);
        OpenInNewTabBtn.setEnabled(enable);
    }

    /**
     * @author Andrey Kolosov
     * Прикрепление позиций к счету
     */
    public void onBtnAttachClick() {
        if (positionsBills.getSelected().size() == 0 || billsTable.getSelected().size() != 1) {
            showNotification(getMessage("Select positions and one bill first"), NotificationType.WARNING);
            return;
        }
        Bills currentBill = billsTable.getSelected().iterator().next();
        positionsBills.getSelected().forEach(p -> {
            if (p.getVoteResult().getPosSup().getSupplier().getId().equals(currentBill.getSupplier().getId())) {
                p.setBills(currentBill);
                dsBills.setItem(p);
                dsBills.commit();
            } else {
                showNotification(getMessage("Wrong supplier"), NotificationType.WARNING);
            }
        });
    }

    /**
     * @author Andrey Kolosov
     * Открепление позиций от счета
     */
    public void onBtnUndockClick() {
        if (positionsBills.getSelected().size() == 0) {
            showNotification(getMessage("Select positions first"), NotificationType.WARNING);
            return;
        }
        positionsBills.getSelected().forEach(p -> {
            p.setBills(null);
            dsBills.setItem(p);
            dsBills.commit();
        });
    }

    /**
     * @author Andrey Kolosov
     * Возвращение заявки на этап подбора поставщиков
     */
    public void onBtnToSupSelection() {

        if (positionsBills.getSelected().size() == 0 && billsTable.getSelected().size() != 1) {
            showNotification(getMessage("Select positions or Bill first"), NotificationType.WARNING);
            return;
        }

        //Если выделен Счет
        if (billsTable.getSelected().size() == 1) {
            Bills currentBill = billsTable.getSelected().iterator().next();
            dsBills.getItems().forEach(e -> {
                if (e.getBills().getId().equals(currentBill.getId())) {
                    e.setCurrentStage(Stages.SupSelection);
                    dsBills.setItem(e);
                    dsBills.commit();
                }
            });
            dsBills.refresh();
            billsTable.setSelected(new ArrayList<Bills>());
            return;
        }

        //Если выделены позиции
        if (positionsBills.getSelected().size() != 0) {
            positionsBills.getSelected().forEach(e -> {
                        e.setCurrentStage(Stages.SupSelection);
                        e.setBills(null);
                        dsBills.setItem(e);
                        dsBills.commit();
                        dsBills.refresh();
                    }

            );
        }
    }

    /**
     * @author Andrey Kolosov
     * Вывести все позиции без Счета в таблицу позиций
     */
    public void onBtnEmptyPositions() {
        dsBills.setQuery("select e from supply$QueriesPosition e where e.bills is null and e.currentStage='Bills'");
        dsBills.refresh();
    }

    /**
     * @author Andrey Kolosov
     * Вывести все позиции в таблицу позиций
     */
    public void onBtnAllPositions() {
        dsBills.setQuery("select e from supply$QueriesPosition e where e.currentStage='Bills'");
        dsBills.refresh();
    }

    @Inject
    protected EmailService emailService;

    /**
     * @author Andrey Kolosov
     * Отправка писем поставщикам
     */
    public void onBtnSendEmail() {

        if (positionsBills.getSelected().isEmpty()) {
            showNotification(getMessage("Select positions first"), NotificationType.WARNING);
            return;
        }
        Set<QueriesPosition> setPosition = positionsBills.getSelected();

        //Шаблоны
        String emailHeader = "To Supplier: %s \n" +
                "From Company: %s \n\n";

        String emailBody = "Nomenclature: %s \n" +
                "Quantity: %10.2f \n" +
                "Price: %10.2f \n\n";

        //Группировка по заказчику, компании
        Map<Suppliers, Map<Company, List<QueriesPosition>>> groupedBySupAndCompMap = setPosition.stream()
                .collect(Collectors.groupingBy(t -> t.getVoteResult().getPosSup().getSupplier(),
                        Collectors.groupingBy(b -> b.getQuery().getCompany())));

        groupedBySupAndCompMap.forEach((s, m) -> {

            m.forEach((c, l) -> {

                String emailHeaderToSend = String.format(emailHeader, s.getName(), c.getName());
                StringBuilder emailBodyToSend = new StringBuilder();
                l.forEach(q -> {
                    String emailBodyPosition = String.format(emailBody, q.getNomenclature().getName(), q.getVoteResult().getQuantity(), q.getVoteResult().getPrice());
                    emailBodyToSend.append(emailBodyPosition);
                });

                EmailInfo emailInfo = new EmailInfo(
                        "piratovi@gmail.com", // recipients
                        "TestTema", // subject
                        emailHeaderToSend.concat(emailBodyToSend.toString())
                );

                emailService.sendEmailAsync(emailInfo);

            });
        });

        positionsBills.setSelected(new ArrayList<QueriesPosition>());

    }

    /**
     * @author Andrey Kolosov
     * @throws Exception
     * перевод всех позиций по одному счету на следующий этап, с проверкой контрольной суммы
     */
    public void onBtnDoneClickBillsTab() throws Exception {
        if (billsTable.getSelected().size() != 1) {
            showNotification(getMessage("Select bill first"), NotificationType.WARNING);
            return;
        }

        Bills currentBill = billsTable.getSelected().iterator().next();
        Double billSum = currentBill.getAmount();
        List<QueriesPosition> list = currentBill.getPositions();
        Double positionSum = list.stream().mapToDouble(q ->
                q.getVoteResult().getPrice() * q.getVoteResult().getQuantity()).sum();

        if (Math.abs(positionSum / billSum - 1) > 0.01) {
            showNotification(getMessage("Контроль суммы не пройден"), NotificationType.WARNING);
        } else {
            currentBill.setSumControl(true);
            billsesDs.commit();
            for (QueriesPosition p : list) {
                workflowService.movePosition(p);
            }
        }
        dsBills.refresh();
    }

    /**
     * @author Andrey Kolosov
     * Открывает список грузов
     */
    public void onBtnDeliveryClick() {
        GroupTable tab = getOpenedStageTable();
        if (tab.getSelected().size() == 0) {
            showNotification(getMessage("Select position first"), NotificationType.WARNING);
            return;
        }
        HashMap<String, Object> items = new HashMap<>();
        items.put("position", tab.getSelected());
        openWindow("supply$Delivery.browse", WindowManager.OpenType.DIALOG, items);
    }
}