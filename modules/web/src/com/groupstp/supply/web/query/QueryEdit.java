package com.groupstp.supply.web.query;

import com.groupstp.supply.entity.PositionType;
import com.groupstp.supply.entity.QueriesPosition;
import com.groupstp.supply.entity.Stages;
import com.groupstp.supply.service.WorkflowService;
import com.haulmont.bali.util.ParamsMap;
import com.haulmont.cuba.core.app.UniqueNumbersService;
import com.haulmont.cuba.core.global.PersistenceHelper;
import com.haulmont.cuba.gui.WindowManager;
import com.haulmont.cuba.gui.components.*;
import com.groupstp.supply.entity.Query;

import javax.inject.Inject;
import java.util.Collection;
import java.util.Date;
import java.util.Map;

public class QueryEdit extends AbstractEditor<Query> {
    @Inject
    private UniqueNumbersService uniqueNumbersService;

    @Inject
    private DataGrid<QueriesPosition> positions;

    @Inject
    private Button okBtn;


    public void onOkBtnClick(Component source) {
        boolean wasNew = PersistenceHelper.isNew(getItem());
        if(getItem().getTimeCreation()==null) {
            getItem().setTimeCreation(new Date());
        }
        if (wasNew) {

            commit();
        } else {

            super.commitAndClose();
        }
    }

    //вызывается после инициализации формы
    @Override
    protected void postInit() {
        super.postInit();

//        if (PersistenceHelper.isNew(getItem())) {
//            okBtn.setCaption("Save");
//        } else {
//            okBtn.setCaption("Save and close");
//        }
//        setShowSaveNotification(false);
        //если заявка передана в работу - возможен только просмотр
        Boolean inWork = getItem().getInWork()==null ? false : getItem().getInWork();
        if(inWork)
        {
            showNotification(getMessage("ViewOnly"));
            setEnabled(false);
            return;
        }
    }

    //инициализация формы
    @Override
    public void init(Map<String, Object> params) {
        super.init(params);
        setupTable(); // настройка таблицы позиции
    }

    private void setupTable()
    {
        setupEditorListeners(); // добавление слушателя начала редактиования inplace
        setupAnalogsColumn(); //добавление генерируемой колонки аналогов
    }
    
    private void setupAnalogsColumn() {
        //TODO: отображение аналогов (З2)
    }
    
    private void setupEditorListeners()
    {
        positions.addEditorOpenListener(event -> {
            Map<String, Field> fieldMap = event.getFields();
            Field type = fieldMap.get("positionType");
            Field spec = fieldMap.get("specification");
            Field nom = fieldMap.get("nomenclature");
            Field analAllowed = fieldMap.get("analogsAllowed");
            spec.setEnabled(false);
            nom.setEnabled(false);
            ValueChangeListener listener = e ->{
                if(e.getValue()==PositionType.nomenclature)
                {
                    nom.setEnabled(true);
                    nom.setRequired(true);
                    spec.setRequired(false);
                    spec.setValue(null);
                    spec.setEnabled(false);
                    analAllowed.setEnabled(true);
                }
                else
                {
                    spec.setEnabled(true);
                    spec.setRequired(true);
                    nom.setRequired(false);
                    nom.setValue(null);
                    nom.setEnabled(false);
                    analAllowed.setEnabled(false);
                    analAllowed.setValue(false);
                }
            };
            type.addValueChangeListener(listener);
        });
    }


    /**
     * присваиваине нового номера
     */
    @Override
    protected void initNewItem(Query item) {
        super.initNewItem(item);
        item.setNumber(Long.toString(uniqueNumbersService.getNextNumber("Query")));
    }

    //создание позиции заявки inplace
    public void onCreatePositionClick() {
        QueriesPosition p = new QueriesPosition();
        p.setCurrentStage(Stages.New);
        p.setQuery(getItem());
        positions.getDatasource().addItem(p);
    }

    public void onFinsh(Component source) throws Exception {
        commit();
        moveToWork();
    }

    @Inject
    private WorkflowService workflowService;

    /**
     * передача заявки в работу
     */
    public void moveToWork() throws Exception {
        for (QueriesPosition qp: (Collection<QueriesPosition>)positions.getDatasource().getItems()) {
            workflowService.movePosition(qp);
        }
        positions.getDatasource().refresh();
        getItem().setInWork(true);
        commit();
    }

    //по нажатию кнопки "редактировать аналоги"
    public void onBtnEditAnalogsClick() {
        QueriesPosition position = positions.getSingleSelected();
        if(position==null)
        {
            showNotification(getMessage("Select position first"), NotificationType.WARNING);
            return;
        }
        if(!position.getAnalogsAllowed())
        {
            showNotification(getMessage("Analogs are not allowed for this position"), NotificationType.WARNING);
            return;
        }
        openEditor("supply$QueriesPosition.editAnalogs", position,
                WindowManager.OpenType.DIALOG);
    }
}