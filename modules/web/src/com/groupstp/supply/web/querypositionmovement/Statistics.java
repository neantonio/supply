package com.groupstp.supply.web.querypositionmovement;

import com.groupstp.supply.entity.QueriesPosition;
import com.groupstp.supply.entity.QueryPositionMovements;
import com.groupstp.supply.entity.Stages;
import com.groupstp.supply.service.StatisticsService;
import com.haulmont.bali.util.ParamsMap;
import com.haulmont.charts.gui.amcharts.model.*;
import com.haulmont.charts.gui.data.ListDataProvider;
import com.haulmont.charts.gui.data.MapDataItem;
import com.haulmont.cuba.gui.components.*;
import com.haulmont.cuba.gui.components.Label;
import com.haulmont.cuba.gui.data.CollectionDatasource;
import com.haulmont.cuba.gui.data.GroupDatasource;
import com.haulmont.cuba.gui.xml.layout.ComponentsFactory;


import javax.inject.Inject;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.function.Predicate;
import java.util.stream.Collectors;

/**
 * @author AntonLomako
 * окно статистики. вкладки позиция, этап, пользователь
 */
public class Statistics extends AbstractWindow {

    @Inject
    private GroupDatasource queryPositionMovementsesDs;

    @Inject
    private CollectionDatasource stageStatisticDs;

    @Inject
    private CollectionDatasource positionDs;

    @Inject
    private CollectionDatasource justForDisplayStagesDs;

    @Inject
    private Table<QueryPositionMovements> movementsTable;

    @Inject
    private DataGrid<QueryPositionMovements> stagesTable;

    @Inject
    private StatisticsService statisticsService;

    @Inject
    private DateField periodBegin;

    @Inject
    private DateField periodEnd;

    @Inject
    private ComponentsFactory factory;

    @Inject
    private Label pieChartLabel;


    @Inject
    com.haulmont.charts.gui.components.charts.GanttChart ganttChart;

    @Inject
    com.haulmont.charts.gui.components.charts.PieChart pieChart;

    private Map<String,Map<Stages,Integer>> statisticsMap=new HashMap<>();

    private final Map<Stages,Integer> begin_value_map=new HashMap<>();
    private final Map<Stages,Integer> income_value_map=new HashMap<>();
    private final Map<Stages,Integer> processed_value_map=new HashMap<>();
    private final Map<Stages,Integer> end_value_map=new HashMap<>();
    private final Map<Stages,Integer> overdue_value_map=new HashMap<>();

    private final Map<Stages,Boolean> selectedStageMap=new HashMap<>();

    String lastSelectedStatisticsColumnId;

    DataGrid.FooterRow footerRow;

    /**
     * добавление рассчитываемых колонок к таблице
     * составляется карта карт значений статистики по полям
     * @param params
     */
    @Override
    public void init(Map<String,Object> params){

        statisticsMap.put(getMessage("begin_value"),begin_value_map);
        statisticsMap.put(getMessage("end_value"),end_value_map);
        statisticsMap.put(getMessage("processed_per_period"),processed_value_map);
        statisticsMap.put(getMessage("income_per_period"),income_value_map);
        statisticsMap.put(getMessage("overdue_value"),overdue_value_map);

        Arrays.asList(Stages.values()).forEach(item->{
            selectedStageMap.put(item,false);
        });

        initMovementsTable();

        initStageStatisticsDateFields();


    }


    @Override
    public void ready(){

        prepareDataForGanttChartOfMovements();

        initStageStatisticsDateFields();

        lastSelectedStatisticsColumnId=getMessage("begin_value");
        initPieChartAndLabel(statisticsMap.get(getMessage("begin_value")),getMessage("begin_value"));

        initStageTable();

    }

    /**
     * обработка данных для отображения в виде диаграммы Ганта
     */
    private void prepareDataForGanttChartOfMovements(){
        positionDs.refresh();
        ListDataProvider dataProvider = new ListDataProvider();

        queryPositionMovementsesDs.refresh(ParamsMap.of("positions",positionDs.getItems()));

        Collection movements= queryPositionMovementsesDs.getItems();


        Iterator iterator=movements.iterator();
        QueryPositionMovements movement= (QueryPositionMovements)iterator.next();
        DateFormat df = new SimpleDateFormat("yyyy-MM-dd");
        for(int i=0;i<movements.size();){

            QueriesPosition currentPosition=movement.getPosition();
            List<MapDataItem> segments = new ArrayList<>();

            while(movement.getPosition()==currentPosition){

                Date start= movement.getCreateTs();
                Date end=movement.getFinishTS()==null?new Date():movement.getFinishTS();
                if((movement.getStage()!=Stages.Abortion)&&(movement.getStage()!=Stages.Done))segments.add(new MapDataItem(ParamsMap.of("start",start,
                        "end",end ,
                        "task",messages.getMessage(movement.getStage()) , "color",statisticsService.getColor(movement.getStage() ))));

                i++;
                if(!iterator.hasNext()) break;
                movement= (QueryPositionMovements)iterator.next();
            }
            dataProvider.addItem(new MapDataItem(ParamsMap.of("category",
                    currentPosition.getNomenclature()==null?currentPosition.getSpecification()
                            :currentPosition.getNomenclature().getName(),
                    "segments", segments)));
        }



        ganttChart.getConfiguration().setDataProvider(dataProvider);
    }

    private void initMovementsTable(){
        movementsTable.addGeneratedColumn("stage_time",entity->{
            Label label=factory.createComponent(Label.class);
            int minuteDuration=(int) (statisticsService.getStageDuration(entity)/1000/60);
            int hourDuration= (int) (statisticsService.getStageDuration(entity)/1000/60/60);
            int dayDuration=hourDuration/24;

            if(dayDuration>0) label.setValue(String.format("%dд %dч",dayDuration,hourDuration-dayDuration*24));
            else if(hourDuration>0)label.setValue(String.format("%dч",hourDuration));
            else label.setValue(String.format("%d мин",minuteDuration));

            return label;
        });

        movementsTable.addGeneratedColumn("all_time",entity->{
            if((entity.getFinishTS()==null)||(entity.getStage()==Stages.Done)||(entity.getStage()==Stages.Abortion)){
                Label label=factory.createComponent(Label.class);

                int hourDuration= (int) (statisticsService.getTimeOfPositionProcessing(entity.getPosition())/1000/60/60);
                int dayDuration=hourDuration/24;

                if(dayDuration>0) label.setValue(String.format("%dд %dч",dayDuration,hourDuration-dayDuration*24));
                else label.setValue(String.format("%dч",hourDuration));
                return label;
            }
            return null;
        });

        movementsTable.addGeneratedColumn("returns_value",entity-> {
            int returns=statisticsService.getReturnsValueForPosition(entity.getPosition());
            if(returns==0)return null;
            else{
                Label label=factory.createComponent(Label.class);
                label.setValue(String.valueOf(returns));
                return label;
            }
        });
        movementsTable.addGeneratedColumn("price_change",entity-> {
            Label label=factory.createComponent(Label.class);
            label.setValue(statisticsService.getPriceChangeOfNMP(entity.getPosition()));
            return label;
        });
    }

    /**
     * добавление сгенерированных колонок в таблицу статистики
     */
    private void initStageTable(){


        refreshStageTable();

        statisticsMap.entrySet().forEach(entry->{
            stagesTable.addGeneratedColumn(entry.getKey(),new DataGrid.ColumnGenerator<QueryPositionMovements, Integer>(){
                @Override
                public Integer getValue(DataGrid.ColumnGeneratorEvent<QueryPositionMovements> event){
                    return entry.getValue().get( event.getItem().getStage());
                }
                @Override
                public Class<Integer> getType(){
                    return Integer.class;
                }
            },1);
            stagesTable.addItemClickListener(clickEvent->{
                selectStage(clickEvent.getItem().getStage());

                Map stat=statisticsMap.get(clickEvent.getColumnId());
                if(stat!=null)  {
//                   if(!clickEvent.getColumnId().equals(lastSelectedStatisticsColumnId)){
                       initPieChartAndLabel(stat,clickEvent.getColumnId());
                       lastSelectedStatisticsColumnId=clickEvent.getColumnId();
//                   }

                }

            });
        });

        footerRow = stagesTable.appendFooterRow();
        footerRow.getCell("stage").setHtml("<strong>" + getMessage("total") + "</strong>");
        refreshStageTableFooter();

    }

    /**
     * производится выбор только одной стадии
     * @param stage
     */
    private void selectStage(Stages stage) {

        //анимацию отключаем только после первого клика пользователя
        pieChart.setStartDuration(0.);
        pieChart.setPullOutDuration(1);

        selectedStageMap.entrySet().forEach(entry->{
            selectedStageMap.put(entry.getKey(),false);
        });
        selectedStageMap.put(stage,true);
        pieChart.repaint();
    }

    /**
     * инициализация диаграммы вкладки этап. происходит при клике по столбцу таблицы
     * @param statisticItems
     * @param title
     */
    private void initPieChartAndLabel(Map<Stages,Integer> statisticItems,String title){

        ListDataProvider dataProvider = new ListDataProvider();
        statisticItems.entrySet().forEach(entry->{
            dataProvider.addItem(
            new MapDataItem().add("title",entry.getKey())
                    .add("value", entry.getValue())
                    .add("color",statisticsService.getColor(entry.getKey()))
                    .add("pulled",selectedStageMap.get(entry.getKey()))
            );



        });

        pieChart.getConfiguration().setDataProvider(dataProvider);
        pieChartLabel.setValue(title+": "+String.valueOf(getStagesTotal(statisticItems)));

    }

    /**
     * обновление таблицы статистики по этапам
     * из сервиса получаются карты по этапам для заданных условий
     * обнавляестся скрепленный с таблицей статистики по этапам датасорс
     */
    private void refreshStageTable(){
        stageStatisticDs.refresh(ParamsMap.of("beginDate",beginDate,"endDate",endDate));

        getStatisticsOfStages(stageStatisticDs.getItems(),
                qpm->((qpm.getFinishTS()==null)||(qpm.getFinishTS().getTime()>=beginDate.getTime()))
                        &&(qpm.getCreateTs().getTime()<beginDate.getTime()),begin_value_map);

        getStatisticsOfStages(stageStatisticDs.getItems(),
                qpm->((qpm.getFinishTS()==null)||(qpm.getFinishTS().getTime()>=endDate.getTime()))
                        &&(qpm.getCreateTs().getTime()<endDate.getTime()),end_value_map);

        getStatisticsOfStages(stageStatisticDs.getItems(),
                qpm->(qpm.getCreateTs().getTime()>=beginDate.getTime())&&(qpm.getCreateTs().getTime()<=endDate.getTime()),income_value_map);

        getStatisticsOfStages(stageStatisticDs.getItems(),
                qpm->(qpm.getFinishTS()!=null)
                        &&(qpm.getFinishTS().getTime()>=beginDate.getTime())
                        &&(qpm.getFinishTS().getTime()<=endDate.getTime()),processed_value_map);

        getStatisticsOfStages(stageStatisticDs.getItems(),
                qpm->statisticsService.isMovementOverdue(qpm),overdue_value_map);


        refreshStageTableFooter();

        initPieChartAndLabel(statisticsMap.get(lastSelectedStatisticsColumnId),lastSelectedStatisticsColumnId);

        //обновляем этот датасорс чтобы обновить таблицу
        justForDisplayStagesDs.refresh();
    }

    private void refreshStageTableFooter(){
        if(footerRow!=null){
            statisticsMap.entrySet().forEach(entry->{
                footerRow.getCell(entry.getKey()).setText(String.valueOf(getStagesTotal(entry.getValue())));
            });
        }

    }

    private Date beginDate;
    private Date endDate;

    /**
     * инициализация полей ввода даты. присваются первоначальные значения и слушатели изменений
     */
    private void initStageStatisticsDateFields(){
        Date today=new Date();

        if(beginDate==null) beginDate=new Date(today.getTime()-1*24*60*60*1000) ; //пусть будет 1день
        if(endDate==null) endDate=today;

        periodBegin.setValue(beginDate);
        periodEnd.setValue(endDate);

        periodBegin.addValueChangeListener(value->{
            beginDate= (Date) value.getValue();

            //проверка чтобы начальная дата была раньше
            if(beginDate.getTime()>endDate.getTime()) {
                endDate=new Date(beginDate.getTime()+24*60*60*1000);
                periodEnd.setValue(endDate);
                showNotification(messages.getMainMessage("end_date_changed"),NotificationType.TRAY);
            }

            refreshStageTable();

        });
        periodEnd.addValueChangeListener(value->{
            endDate= (Date) value.getValue();

            if(endDate.getTime()<beginDate.getTime()) {
                beginDate=new Date(endDate.getTime()-24*60*60*1000);
                periodBegin.setValue(beginDate);
                showNotification(messages.getMainMessage("begin_date_changed"),NotificationType.TRAY);
            }

            refreshStageTable();
        });


    }

    /**
     * коллекция фильтруется по условию и возвращается карта результатов, где key - этап
     * @param movementsCollection исходная коллекция
     * @param filterCondition фильтрующее условие в виде функционального интерфейса
     * @return
     */
    private Map<Stages, Integer> getStatisticsOfStages(Collection<QueryPositionMovements> movementsCollection,
                                               Predicate<QueryPositionMovements> filterCondition,Map<Stages,Integer> targetMap) {

        targetMap.clear();
        List<QueryPositionMovements> filteredCollection= movementsCollection.stream().filter(filterCondition).collect(Collectors.toList());

        filteredCollection.forEach(item->{
            if(targetMap.get(item.getStage())!=null){
                targetMap.put(item.getStage(),targetMap.get(item.getStage())+1);
            }
            else {
                targetMap.put(item.getStage(),1);
            }
        });
        return targetMap;
    }

    /**
     * суммирует value
     * @param stageData
     * @return
     */
    private int getStagesTotal( Map<Stages,Integer> stageData){
        int result=0;
        for(Integer i:stageData.values()){
            result+=i;
        }
        return result;
    }





}

