package com.groupstp.supply.web.queriesposition;

import com.groupstp.supply.entity.*;
import com.groupstp.supply.service.GroovyTestService;
import com.groupstp.supply.service.VoteService;
import com.groupstp.supply.service.WorkflowService;
import com.haulmont.chile.core.model.MetaProperty;
import com.haulmont.cuba.core.app.EmailService;
import com.haulmont.cuba.core.entity.Entity;
import com.haulmont.cuba.core.entity.FileDescriptor;
import com.haulmont.cuba.core.global.*;
import com.haulmont.cuba.gui.WindowManager;
import com.haulmont.cuba.gui.components.*;
import com.haulmont.cuba.gui.components.actions.BaseAction;
import com.haulmont.cuba.gui.data.DataSupplier;
import com.haulmont.cuba.gui.data.GroupDatasource;
import com.haulmont.cuba.gui.export.ExportDisplay;
import com.haulmont.cuba.gui.export.ExportFormat;
import com.haulmont.cuba.gui.upload.FileUploadingAPI;
import com.haulmont.cuba.gui.xml.layout.ComponentsFactory;
import org.dom4j.Element;

import javax.annotation.Nullable;
import javax.inject.Inject;
import java.net.URL;
import java.util.*;
import java.util.stream.Collectors;

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
                    withHandler(e -> openEditor(q, WindowManager.OpenType.DIALOG)));
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
    private void setupNomControl() {
        GroupTable<QueriesPosition> p = positionsNomControl;
        p.addGeneratedColumn("queryLink", new QueryLinkGenerator());
        p.groupBy(new Object[]{
                p.getColumn("query.urgency").getId(),
                p.getColumn("query.company").getId(),
                p.getColumn("query.division").getId(),
                p.getColumn("query").getId()});
        dsNomControl.addItemPropertyChangeListener(e -> {
            if ("positionUsefulness".equals(e.getProperty()) && e.getValue().equals(true)) {
                e.getItem().setPositionUsefulnessTS(new Date());
            }
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
     *
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
        if(tab.getSelected().size()==0)
        {
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
        if(tab.getSelected().size()==0)
        {
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
     * События при клике на счет
     * @param item - счет
     * @param columnId id столбца таблицы
     */
    private void setClickListenerToBills(Entity item, String columnId) {
        Bills clickedBills = (Bills) item;
        HashMap<String, Object> items = new HashMap<>();
        items.put("supplerId", clickedBills.getSupplier().getId());
        items.put("billId", clickedBills.getId());
        dsBills.setQuery("select e from supply$QueriesPosition e\n" +
                "where e.currentStage='Bills' and (" +
                "e.bills.id = :custom$billId\n" +
                "or\n" +
                "(e.voteResult.posSup.supplier.id = :custom$supplerId and e.bills is null))");
//        dsBills.setQuery("select e from supply$QueriesPosition e where e.currentStage='Bills' and ( (e.voteResult.posSup.supplier.id =:custom$supplerId and e.bills is null) or (e.bills.id =:custom$billId))");
        dsBills.refresh(items);
        billsTable.setSelected(clickedBills);
        displayImage();

    }

    /**
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
     * Активация/Деактивация кнопок для изображения счета
     * @param enable условие активации
     */
    private void updateImageButtons(boolean enable) {
        downloadImageBtn.setEnabled(enable);
        clearImageBtn.setEnabled(enable);
        OpenInNewTabBtn.setEnabled(enable);
    }

    /**
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
     * Вывести все позиции без Счета в таблицу позиций
     */
    public void onBtnEmptyPositions() {
        dsBills.setQuery("select e from supply$QueriesPosition e where e.bills is null and e.currentStage='Bills'");
        dsBills.refresh();
    }

    /**
     * Вывести все позиции в таблицу позиций
     */
    public void onBtnAllPositions() {
        dsBills.setQuery("select e from supply$QueriesPosition e where e.currentStage='Bills'");
        dsBills.refresh();
    }

    @Inject
    protected EmailService emailService;

    /**
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


}