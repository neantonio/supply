package com.groupstp.supply.web.querypositionmovement;

import com.groupstp.supply.entity.QueriesPosition;
import com.groupstp.supply.entity.QueryPositionMovements;
import com.groupstp.supply.entity.Stages;
import com.groupstp.supply.service.QueryDaoService;
import com.haulmont.chile.core.datatypes.Datatype;
import com.haulmont.chile.core.model.MetaClass;
import com.haulmont.cuba.core.app.keyvalue.KeyValueMetaClass;
import com.haulmont.cuba.core.app.keyvalue.KeyValueMetaProperty;
import com.haulmont.cuba.core.entity.KeyValueEntity;
import com.haulmont.cuba.core.entity.StandardEntity;
import com.haulmont.cuba.core.global.AppBeans;
import com.haulmont.cuba.gui.data.impl.CustomCollectionDatasource;
import com.haulmont.cuba.gui.data.impl.CustomValueCollectionDatasource;
import com.haulmont.cuba.gui.data.impl.ValueCollectionDatasourceImpl;
import com.haulmont.cuba.gui.data.impl.ValueDatasource;
import org.apache.commons.collections4.KeyValue;
import org.apache.commons.collections4.map.AbstractLinkedMap;
import org.apache.commons.collections4.map.LinkedMap;

import javax.inject.Inject;
import java.util.*;

/**
 * Created by 79167 on 24.06.2018.
 */
public class PositionChartDs extends CustomValueCollectionDatasource
{

    @Inject
    private QueryDaoService queryDaoService= AppBeans.get(QueryDaoService.NAME);

    @Override
    protected Collection<KeyValueEntity> getEntities(Map<String, Object> params){
        //LinkedMap<Object, Object> result =new LinkedMap<>();
        List<KeyValueEntity> result=new ArrayList<>();

        KeyValueMetaClass metaClass=new KeyValueMetaClass();
        metaClass.setName("sys$KeyValueEntity");
        KeyValueMetaProperty taskProperty=  new KeyValueMetaProperty(metaClass,"task",Task.class);
        KeyValueMetaProperty movementProperty=  new KeyValueMetaProperty(metaClass,"movement",QueryPositionMovements.class);
        KeyValueMetaProperty positionProperty=  new KeyValueMetaProperty(metaClass,"position",QueriesPosition.class);
        metaClass.addProperty(taskProperty);
        metaClass.addProperty(movementProperty);
        metaClass.addProperty(positionProperty);

        addProperty("task",Task.class);

        List<QueriesPosition> positionList=queryDaoService.getAllQueriesPosition();

        positionList.forEach(position->{
            KeyValueEntity e=new KeyValueEntity();

            List<QueryPositionMovements> movementsList=queryDaoService.getQueryPositionMovement(position);

            e.setIdName("position");
            e.setId(position);
            e.setMetaClass(metaClass);

            List<Segment> segmentList=new ArrayList<Segment>();
            movementsList.forEach(item->{
                Segment segment=new Segment();
                segment.setStart(item.getCreateTs());
                if(item.getFinishTS()==null) segment.setEnd(new Date());
                else segment.setEnd(item.getFinishTS());
                segment.setColor(getColor(item.getStage()));
                segmentList.add(segment);
            });
            Task task=new Task();
            task.setCategory(position.getNomenclature()==null?position.getSpecification():position.getNomenclature().getName());
            task.setSegments(segmentList);
            e.setValue("task",task);
            e.setValue("position",position);
          //  e.setValue("movements",movementsList);
            e.setValue("movement",movementsList.get(0));

            result.add(e);

        });

        return  result;
    }

    private String getColor(Stages stage){

        List <String> colors=Arrays.asList("#FF6600", "#FCD202", "#B0DE09", "#0D8ECF", "#2A0CD0", "#CD0D74", "#CC0000", "#00CC00", "#0000CC", "#DDDDDD", "#999999", "#333333", "#990000");

        int stageIndex=Arrays.asList(Stages.values()).indexOf(stage);

        if(stageIndex<colors.size()) return colors.get(stageIndex);
        else return "#FF66FF";
    }




}


class Task extends StandardEntity {
    private String category;
    private List<Segment> segments;

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public List<Segment> getSegments() {
        return segments;
    }

    public void setSegments(List<Segment> segments) {
        this.segments = segments;
    }
}

class Segment extends StandardEntity{
    private Date start;
    private Date end;
    private String color;

    public Date getStart() {
        return start;
    }

    public void setStart(Date start) {
        this.start = start;
    }

    public Date getEnd() {
        return end;
    }

    public void setEnd(Date end) {
        this.end = end;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }
}