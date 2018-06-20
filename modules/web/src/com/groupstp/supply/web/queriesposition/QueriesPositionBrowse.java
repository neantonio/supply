package com.groupstp.supply.web.queriesposition;

import com.groupstp.supply.entity.*;
import com.groupstp.supply.service.GroovyTestService;
import com.groupstp.supply.service.WorkflowService;
import com.haulmont.bali.util.ParamsMap;
import com.haulmont.chile.core.model.MetaProperty;
import com.haulmont.cuba.core.entity.Entity;
import com.haulmont.cuba.core.entity.KeyValueEntity;
import com.haulmont.cuba.core.global.*;
import com.haulmont.cuba.gui.WindowManager;
import com.haulmont.cuba.gui.components.*;
import com.haulmont.cuba.gui.components.actions.BaseAction;
import com.haulmont.cuba.gui.data.GroupDatasource;
import com.haulmont.cuba.gui.data.impl.GroupDatasourceImpl;
import com.haulmont.cuba.gui.xml.layout.ComponentsFactory;
import org.dom4j.Element;

import javax.inject.Inject;
import java.util.*;

public class QueriesPositionBrowse extends AbstractLookup {

    @Inject
    private DataManager dataManager;

    @Inject
    private GroupDatasource<QueriesPosition, UUID> dsNomControl;

    @Inject
    private GroupDatasource<QueriesPosition, UUID> dsStoreControl;

    @Inject
    private GroupTable<QueriesPosition> positionsNomControl;

    @Inject
    private GroupTable<QueriesPosition> positionsStoreControl;

    @Inject
    private GroupTable<QueriesPosition> positionsSupSelection;

    @Inject
    private WorkflowService workflowService;

    @Inject
    private TabSheet tabs;

    @Inject
    private ComponentsFactory componentsFactory;

    private class QueryLinkGenerator implements Table.ColumnGenerator{

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
        setupNomControl();
        setupStoreControl();
        restorePanel();
        tabs.addSelectedTabChangeListener(event -> {
            savePanel();
            getOpenedStageTable().getDatasource().refresh();
        });
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
    private void setupNomControl()
    {
        GroupTable<QueriesPosition> p = positionsNomControl;
        p.addGeneratedColumn("queryLink", new QueryLinkGenerator());
        p.groupBy(new Object[]{
                p.getColumn("query.urgency").getId(),
                p.getColumn("query.company").getId(),
                p.getColumn("query.division").getId(),
                p.getColumn("query").getId()});
        dsNomControl.addItemPropertyChangeListener(e -> {
            if("positionUsefulness".equals(e.getProperty()) && e.getValue().equals(true)) {
                e.getItem().setPositionUsefulnessTS(new Date());
            }
        });
    }

    /**
     * настройка складскго контроля
     */
    private void setupStoreControl()
    {
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
        if(position==null)
        {
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
        GroupTable<QueriesPosition> grpTab = getOpenedStageTable();
        GroupDatasource ds = grpTab.getDatasource();
        Set<QueriesPosition> positions = grpTab.getSelected();
        for (QueriesPosition position: positions) {
            workflowService.movePosition(position);
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
     * @return текущий открытый этап
     */
    public String getOpenedStage()
    {
        return tabs.getSelectedTab().getName().replace("tab", "");
    }

    /**
     * Возвращает таблицу GroupTable текущего открытого этапа
     * @return GroupTable
     */
    public GroupTable<QueriesPosition> getOpenedStageTable()
    {
        return (GroupTable<QueriesPosition>) tabs.getComponentNN("positions"+getOpenedStage());
    }

    /**
     * Разделяет позицию на несколько подпозиций, для текущей позиции устанавливается этап "Разделенная"
     */
    public void onBtnSplitClick() {
        GroupTable<QueriesPosition> tab = getOpenedStageTable();
        QueriesPosition position = tab.getSingleSelected();
        if(position.getPosition()!=null)
        {
            position = position.getPosition();
        }
        QueriesPosition copy = copyPosition(position);
        copy.setPosition(position);
        if(Stages.StoreControl.equals(position.getCurrentStage()))
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
    private QueriesPosition copyPosition(QueriesPosition position)
    {
        QueriesPosition src = dataManager.reload(position, "queriesPosition-full");
        QueriesPosition copy = metadata.create(QueriesPosition.class);
        Collection<MetaProperty> properties = position.getMetaClass().getProperties();
        for (MetaProperty property : properties) {
            if(property.getDeclaringClass()!=position.getMetaClass().getJavaClass())
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
        if(positionsSupSelection.getSelected().size()==0)
        {
            showNotification(getMessage("Select position first"), NotificationType.WARNING);
            return;
        }
        HashMap<String, Object> items = new HashMap<>();
        items.put("positions", positionsSupSelection.getSelected());
        openWindow("supply$PositionSupplier.browse", WindowManager.OpenType.DIALOG, items);
    }

    /**
     * Открывает ввод предложений
     */
    public void onBtnSuggestionsClick() {
        if(positionsSupSelection.getSelected().size()==0)
        {
            showNotification(getMessage("Select position first"), NotificationType.WARNING);
            return;
        }
        HashMap<String, Object> items = new HashMap<>();
        items.put("positions", positionsSupSelection.getSelected());
        openWindow("supply$SuppliersSuggestion.browse", WindowManager.OpenType.DIALOG, items);
    }

    @Inject
    private GroupTable<QueriesPosition> positionsComission;

    /**
     * Открывает голосование
     */
    public void onBtnVoteClick() {

        if(positionsComission.getSelected().size()==0)
        {
            showNotification(getMessage("Select position first"), NotificationType.WARNING);
            return;
        }
        HashMap<String, Object> items = new HashMap<>();
        items.put("positions", positionsComission.getSelected());
        openWindow("supply$VoteDialog", WindowManager.OpenType.DIALOG, items);
    }

    @Inject
    private GroupTable<QueriesPosition> positionsBills;

    @Inject
    private Table<Bills> billsTable;

    @Inject
    private GroupDatasource<QueriesPosition, UUID> dsBills;

    @Inject
    private GroupDatasource<QueriesPosition, UUID> currentBillPositionsDs;

    @Override
    public void init(Map<String, Object> params) {
        positionsBills.addGeneratedColumn("Сумма", new Table.PrintableColumnGenerator<QueriesPosition, String>() {
            @Override
            public Component generateCell(QueriesPosition entity) {
                Label label = (Label) componentsFactory.createComponent(Label.NAME);
                label.setValue(entity.getVoteResult().getPrice() * entity.getVoteResult().getQuantity());
                return label;
            }

            @Override
            public String getValue(QueriesPosition entity) {
                return Double.toString(entity.getVoteResult().getPrice() * entity.getVoteResult().getQuantity());
            }
        });

        billsTable.setClickListener("number", (item, columnId) -> {
            dsBills.refresh();
//            openWindow("AnotherTab", WindowManager.OpenType.NEW_TAB, ParamsMap.of("parameter", item.getInstanceName()));
//            (String) item.getId()
            //billsTable.getSelected().iterator().next().getNumber()
//            dsBills.refresh();
            Bills clickedBills = (Bills) item;
//            showNotification(getMessage(clickedBills.getPrice().toString()), NotificationType.WARNING);

//            LoadContext<QueriesPosition> ctx = LoadContext.create(QueriesPosition.class).setQuery(
//                    LoadContext.createQuery("select q from supply$QueriesPosition q where q.bills.id=:bills" )
//                            .setParameter("bills", clickedBills.getId()));
//            DataManager dataManager = AppBeans.get(DataManager.class);
//            List<QueriesPosition> list = dataManager.loadList(ctx);
//            showNotification(getMessage(list.toString()), NotificationType.WARNING);
            HashMap<String, Object> items = new HashMap<>();
            items.put("billId", clickedBills);
            items.put("supplerId", clickedBills.);
            currentBillPositionsDs.refresh(items);
            positionsBills.setDatasource(currentBillPositionsDs);

//            list1.forEach(t -> {
//                if (!t.getBills().getId().equals(item.getId())) {
//                    dsBills.removeItem(t);
//                    dsBills.commit();
//                }
//            });


        });
    }

    public void onBtnAttachClick() {
        if(positionsBills.getSelected().size()==0 || billsTable.getSelected().size()!=1)
        {
            showNotification(getMessage("Select positions and one bill first"), NotificationType.WARNING);
            return;
        }
        Bills currentBill = billsTable.getSelected().iterator().next();
        positionsBills.getSelected().forEach(p -> {
            p.setBills(currentBill);
            dsBills.setItem(p);
            dsBills.commit();
        });
    }

    public void onBtnUndockClick() {
        if(positionsBills.getSelected().size()==0 || billsTable.getSelected().size()!=1)
        {
            showNotification(getMessage("Select positions and one bill first"), NotificationType.WARNING);
            return;
        }
//        Bills currentBill = billsTable.getSelected().iterator().next();
        positionsBills.getSelected().forEach(p -> {
            p.setBills(null);
            dsBills.setItem(p);
            dsBills.commit();
        });
    }

}