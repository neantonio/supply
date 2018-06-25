package com.groupstp.supply.web.querypositionmovement;

import com.groupstp.supply.entity.QueriesPosition;
import com.groupstp.supply.entity.QueryPositionMovements;
import com.groupstp.supply.entity.Stages;
import com.haulmont.bali.util.ParamsMap;
import com.haulmont.charts.gui.data.ListDataProvider;
import com.haulmont.charts.gui.data.MapDataItem;
import com.haulmont.cuba.gui.components.AbstractWindow;
import com.haulmont.cuba.gui.data.CollectionDatasource;
import com.haulmont.cuba.gui.data.GroupDatasource;


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
    com.haulmont.charts.gui.components.charts.GanttChart ganttChart;

    private List <String> colors=Arrays.asList("#FF6600", "#FCD202", "#B0DE09", "#0D8ECF", "#2A0CD0", "#CD0D74", "#CC0000", "#00CC00", "#0000CC", "#DDDDDD", "#999999", "#333333", "#990000");


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
                        "task",messages.getMessage(movement.getStage()) , "color", colors.get((colors.size()-1)%(dataProvider.getItems().size()+1) ))));

                i++;
                if(!iterator.hasNext()) break;
                movement= (QueryPositionMovements)iterator.next();
            }
            dataProvider.addItem(new MapDataItem(ParamsMap.of("category",
                    currentPosition.getNomenclature()==null?currentPosition.getSpecification()
                            :currentPosition.getNomenclature().getName(),
                    "segments", segments)));
        }

//        List<MapDataItem> segments = new ArrayList<>();
//
//        segments.add(new MapDataItem(ParamsMap.of("start", "2018-06-16",
//                "end", "2018-06-27", "task", "Producing specifications")));
//        segments.add(new MapDataItem(ParamsMap.of("start", "2018-07-05",
//                "end", "2018-07-18", "task", "Development")));
//        segments.add(new MapDataItem(ParamsMap.of("start", "2018-07-18",
//                "end", "2018-07-30", "task", "Testing and QA")));
//        dataProvider.addItem(new MapDataItem(ParamsMap.of("category", "Module #1", "segments", segments)));
//
//        segments = new ArrayList<>();
//        segments.add(new MapDataItem(ParamsMap.of("start", "2018-06-01",
//                "end", "2018-07-10", "task", "Gathering requirements", "color", "#cc4748")));
//        segments.add(new MapDataItem(ParamsMap.of("start", "2018-06-12",
//                "end", "2018-07-15", "task", "Producing specifications")));
//        segments.add(new MapDataItem(ParamsMap.of("start", "2018-06-16",
//                "end", "2018-07-05", "task", "Development")));
//        segments.add(new MapDataItem(ParamsMap.of("start", "2018-06-10",
//                "end", "2018-07-18", "task", "Testing and QA")));
//        dataProvider.addItem(new MapDataItem(ParamsMap.of("category", "Module #1", "segments", segments)));

        ganttChart.getConfiguration().setDataProvider(dataProvider);
        
//        chartDs.refresh();
//        Collection items=chartDs.getItems();
//        int i=0;
//        i++;
    }

    private String getColor(Stages stage){



        int stageIndex=Arrays.asList(Stages.values()).indexOf(stage);

        if(stageIndex<colors.size()) return colors.get(stageIndex);
        else return "#FF66FF";
    }
}

