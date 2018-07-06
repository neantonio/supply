package com.groupstp.supply.service;

import com.groupstp.supply.entity.QueriesPosition;
import com.groupstp.supply.entity.QueryPositionStageData;
import com.groupstp.supply.entity.QueryPositionStageDataItem;
import com.haulmont.cuba.core.entity.StandardEntity;
import com.haulmont.cuba.core.global.AppBeans;
import com.haulmont.cuba.core.global.Metadata;
import com.haulmont.cuba.core.global.UserSessionSource;
import org.springframework.stereotype.Service;

import javax.inject.Inject;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.*;

/**
 * @author AntonLomako
 * работа с данными этапа: запись\получение\создание
 */

@Service(StageDataService.NAME)
public class StageDataServiceBean implements StageDataService {

    @Inject
    private Metadata metadata;

    @Inject
    private QueryDaoService queryDaoService;

    //ключ-новая; значение - старая QueryPositionStageDataItem
    private Map<QueryPositionStageDataItem,QueryPositionStageDataItem> dirtyItemsMap=new HashMap<>();
    private Set<QueryPositionStageData> dirtyData=new HashSet<>();

    //основной метод для установки значения. все остальные значения преобразовываются к стрингу
    @Override
    public QueryPositionStageData setData(QueryPositionStageData stageData, String dataName, String data) {
        QueryPositionStageDataItem dataItem=findDataItem(stageData,dataName);
        QueryPositionStageDataItem newDataItem;

        boolean saveItem=false;
        if(dataItem.getItemValue()!=null)newDataItem=initNewDataItems(stageData,dataItem);
        else {
            saveItem=true;
            newDataItem=dataItem;
        }

        newDataItem.setItemValue(data);
        if(saveItem){
            queryDaoService.saveEntity(newDataItem);
            return  stageData;
        }
        else{
            return (QueryPositionStageData)queryDaoService.saveEntity(stageData);
        }

//        if(dataItem.getItemValue()==null)dataItem.setItemType(data);
//        else {
//
//            //если редактирование происходит уже не в первый раз, тогда изменяем поле
//            if(dirtyItemsMap.get(dataItem)!=null){
//                dirtyItemsMap.get(dataItem).setItemValue(data);
//            }
//            //а если в первый, то создаем новую сущность и кладем ее в мар
//            else{
//                newDataItem=initNewDataItems(stageData,dataItem);
//                dirtyItemsMap.put(newDataItem,dataItem);
//                dirtyData.add(stageData);
//            }
//        }
//        return stageData;

    }

    @Override
    public void saveChanges(){
        dirtyData.forEach(item->{
            queryDaoService.saveEntity(item);
        });
        dirtyData.clear();
        dirtyItemsMap.clear();
    }



    @Override
    public  QueryPositionStageData setData(QueryPositionStageData stageData, String dataName, Date data) {
        if(data==null) return setData(stageData,dataName,(String)null);
        return setData(stageData,dataName,String.format("%d",data.getTime()));
    }

    @Override
    public  QueryPositionStageData setData(QueryPositionStageData stageData, String dataName, Integer data) {
        if(data==null) return setData(stageData,dataName,(String)null);
        return setData(stageData,dataName,String.format("%d",data));
    }

    @Override
    public  QueryPositionStageData setData(QueryPositionStageData stageData, String dataName, Double data) {
        if(data==null) return setData(stageData,dataName,(String)null);
       return setData(stageData,dataName,String.format("%d",data));
    }

    @Override
    public  QueryPositionStageData setData(QueryPositionStageData stageData, String dataName, StandardEntity data) {
        if(data==null) return setData(stageData,dataName,(String)null);
       return setData(stageData,dataName,data.getId().toString());
    }

    @Override
    public  QueryPositionStageData setData(QueryPositionStageData stageData, String dataName, Boolean data) {
        if(data==null) return setData(stageData,dataName,(String)null);
       return setData(stageData,dataName,String.valueOf(data));
    }


    private QueryPositionStageDataItem findDataItem(QueryPositionStageData stageData, String dataName){
        for(QueryPositionStageDataItem dataItem:stageData.getDataItems()){
            if(dataItem.getItemName().equals(dataName)) return dataItem;
        }
        throw new DataIncompleteException("no field with name "+dataName+" in stageData");
    }

    private QueryPositionStageDataItem initNewDataItems(QueryPositionStageData stageData,
                                  QueryPositionStageDataItem oldDataItem){
        QueryPositionStageDataItem result=metadata.create(QueryPositionStageDataItem.class);
        result.setItemName(oldDataItem.getItemName());
        result.setItemType(oldDataItem.getItemType());
        result.setQueryPositionStageData(stageData);
        result.setUser(AppBeans.get(UserSessionSource.class).getUserSession().getUser());

        stageData.getDataItems().remove(oldDataItem);
        stageData.getDataItems().add(result);

        return result;

    }

    @Override
    public String getStringData(QueryPositionStageData stageData, String dataName) {
        QueryPositionStageDataItem dataItem=findDataItem(stageData,dataName);
        return dataItem.getItemValue();
    }

    @Override
    public Date getDateData(QueryPositionStageData stageData, String dataName) {
        QueryPositionStageDataItem dataItem=findDataItem(stageData,dataName);
        if((dataItem.getItemValue()==null)||(dataItem.getItemValue().equalsIgnoreCase(""))) return null;

        try {
            return new Date(Long.valueOf(dataItem.getItemValue()));
        }
        catch (Exception e){
            return null;
        }

    }

    @Override
    public Double getDoubleData(QueryPositionStageData stageData, String dataName) {
        QueryPositionStageDataItem dataItem=findDataItem(stageData,dataName);
        return Double.valueOf(dataItem.getItemValue());
    }

    @Override
    public Integer getIntegerData(QueryPositionStageData stageData, String dataName) {
        QueryPositionStageDataItem dataItem=findDataItem(stageData,dataName);
        return Integer.valueOf(dataItem.getItemValue());
    }

    @Override
    public Boolean getBooleanData(QueryPositionStageData stageData, String dataName) {
        QueryPositionStageDataItem dataItem=findDataItem(stageData,dataName);
        return Boolean.valueOf(dataItem.getItemValue());
    }

    @Override
    public StandardEntity getEntityData(QueryPositionStageData stageData, String dataName) {
        QueryPositionStageDataItem dataItem=findDataItem(stageData,dataName);
        return queryDaoService.getEntity(dataItem.getItemType(),dataItem.getItemValue());

    }



    @Override
    public QueryPositionStageData getOrCreateStageDataForPositionFromCollectionAndDescription(Collection<QueryPositionStageData> items,
                                                                                              QueriesPosition entity,
                                                                                              Map<String, String> stageDataItemsDescription) {
        if(items!=null){
            Iterator<QueryPositionStageData> iterator=items.iterator();
            while (iterator.hasNext()){
                QueryPositionStageData currentStageData=iterator.next();
                if(currentStageData.getPosition().getId().equals(entity.getId())) return currentStageData;
            }
        }
        QueryPositionStageData result= createStageData(entity,stageDataItemsDescription);
       // if(items!=null)items.add(result);
        queryDaoService.saveEntity(result);
        return result;


    }

    /**
     * создание QueryPositionStageData по описанию полей
     * @param entity QueriesPosition к которой относятся данные
     * @param stageDataItemsDescription описание данных в виде ключ-название поля, значение - тип данных
     * @return
     */
    private QueryPositionStageData createStageData(QueriesPosition entity, Map<String, String> stageDataItemsDescription) {
        QueryPositionStageData result=metadata.create(QueryPositionStageData.class);
        result.setDataItems(new ArrayList<>());
        result.setPosition(entity);

        stageDataItemsDescription.entrySet().forEach(entry->{
            QueryPositionStageDataItem dataItem=metadata.create(QueryPositionStageDataItem.class);
            dataItem.setItemName(entry.getKey());
            dataItem.setItemType(entry.getValue());
            dataItem.setQueryPositionStageData(result);
            result.getDataItems().add(dataItem);
        });

        return result;
    }
}