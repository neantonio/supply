package com.groupstp.supply.web.query;

import com.groupstp.supply.entity.PositionType;
import com.groupstp.supply.entity.QueriesPosition;
import com.groupstp.supply.entity.Stages;
import com.groupstp.supply.service.WorkflowService;
import com.haulmont.bali.util.ParamsMap;
import com.haulmont.cuba.core.app.UniqueNumbersService;
import com.haulmont.cuba.gui.WindowManager;
import com.haulmont.cuba.gui.components.AbstractEditor;
import com.groupstp.supply.entity.Query;
import com.haulmont.cuba.gui.components.DataGrid;
import com.haulmont.cuba.gui.components.Field;

import javax.inject.Inject;
import java.util.Collection;
import java.util.Map;
import com.haulmont.cuba.gui.components.Component;

public class QueryEdit extends AbstractEditor<Query> {
    @Inject
    private UniqueNumbersService uniqueNumbersService;

    @Inject
    private DataGrid<QueriesPosition> positions;

    

    //вызывается после инициализации формы
    @Override
    protected void postInit() {
        super.postInit();
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