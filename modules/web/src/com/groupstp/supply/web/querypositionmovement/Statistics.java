package com.groupstp.supply.web.querypositionmovement;

import com.groupstp.supply.entity.QueriesPosition;
import com.groupstp.supply.entity.QueryPositionMovements;
import com.groupstp.supply.entity.Stages;
import com.groupstp.supply.service.StatisticsService;
import com.haulmont.bali.util.ParamsMap;
import com.haulmont.charts.gui.data.ListDataProvider;
import com.haulmont.charts.gui.data.MapDataItem;
import com.haulmont.cuba.gui.components.AbstractWindow;
import com.haulmont.cuba.gui.components.Label;
import com.haulmont.cuba.gui.components.Table;
import com.haulmont.cuba.gui.data.CollectionDatasource;
import com.haulmont.cuba.gui.data.GroupDatasource;
import com.haulmont.cuba.gui.xml.layout.ComponentsFactory;


import javax.inject.Inject;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.*;

public class Statistics extends AbstractWindow {

    @Inject
    GroupDatasource queryPositionMovementsesDs;

    @Inject
    CollectionDatasource positionDs;

    @Inject
    Table<QueryPositionMovements> movementsTable;

    @Inject
    StatisticsService statisticsService;

    @Inject
    private ComponentsFactory factory;


    @Inject
    com.haulmont.charts.gui.components.charts.GanttChart ganttChart;

    private List <String> colors=Arrays.asList("#FF6600", "#FCD202", "#B0DE09", "#0D8ECF", "#2A0CD0", "#CD0D74", "#CC0000", "#00CC00", "#0000CC", "#DDDDDD", "#999999", "#333333", "#990000");

    @Override
    public void init(Map<String,Object> params){
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

    @Override
    public void ready(){

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
                segments.add(new MapDataItem(ParamsMap.of("start",start,
                        "end",end ,
                        "task",messages.getMessage(movement.getStage()) , "color", getColor(movement.getStage() ))));

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

    private String getColor(Stages stage){

        int stageIndex=Arrays.asList(Stages.values()).indexOf(stage);

        if(stageIndex<colors.size()) return colors.get(stageIndex);
        else return "#FF66FF";
    }
}

