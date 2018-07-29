package com.groupstp.supply.service;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.haulmont.chile.core.datatypes.impl.EnumClass;
import com.haulmont.chile.core.model.MetaProperty;
import com.haulmont.cuba.core.EntityManager;
import com.haulmont.cuba.core.Persistence;
import com.haulmont.cuba.core.Transaction;
import com.haulmont.cuba.core.entity.Entity;
import com.haulmont.cuba.core.global.DataManager;
import com.haulmont.cuba.core.global.Metadata;
import org.slf4j.Logger;
import org.springframework.stereotype.Service;

import javax.inject.Inject;
import java.io.Serializable;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;

@Service(EntityImportService.NAME)
public class EntityImportServiceBean implements EntityImportService {

    @Inject
    private Metadata metadata;

    @Inject
    private DataManager dataManager;

    @Inject
    private Logger log;

    @Inject
    private Persistence persistence;



    @Override
    public Serializable createOrUpdateEntity(String data) {
        ArrayList<Serializable> res = new ArrayList<>();
        JsonParser parser = new JsonParser();
        JsonElement element  = parser.parse(data);
        try {
            if(element.isJsonArray()) {
                for (JsonElement jsonElement : element.getAsJsonArray()) {
                    res.add(importData(jsonElement.getAsJsonObject()));
                }
                return res;
            }
            return importData(element.getAsJsonObject());
        }
        catch (Exception ex)
        {
            log.debug(ex.toString());
            return returnMessage(ex.toString());
        }
    }

    @Override
    public Serializable importData(JsonObject e) throws Exception {
        Entity entity = createObject(e);
        for (MetaProperty metaProperty : entity.getMetaClass().getProperties()) {
            setValue(entity, metaProperty, e);
        }
        return dataManager.commit(entity);
    }


    void setValue(Entity res, MetaProperty metaProperty, JsonObject e) throws Exception {
        if(!e.has(metaProperty.getName()))
            return;
        JsonElement val = e.get(metaProperty.getName());
        if(val.isJsonNull())
            return;
        if(val.isJsonPrimitive())
            val = e.getAsJsonPrimitive(metaProperty.getName());
        else if(val.isJsonArray())
            val = e.getAsJsonArray(metaProperty.getName());
        else
            val = e.getAsJsonObject(metaProperty.getName());

        if (val.isJsonArray()) {
            for (JsonElement jsonElement : val.getAsJsonArray()) {
                importData(jsonElement.getAsJsonObject());
            }
        }
        else if (metaProperty.getType().equals(MetaProperty.Type.ASSOCIATION) || metaProperty.getType().equals(MetaProperty.Type.COMPOSITION))
        {
            Entity impVal;


            //значит в json идэшник
            if(e.get(metaProperty.getName()).isJsonPrimitive()){
                if(e.get(metaProperty.getName()).getAsString().equalsIgnoreCase("00000000-0000-0000-0000-000000000000")) impVal=null;
                else{

                        impVal = getEntity(metaProperty.getDeclaringClass().getName().substring(metaProperty.getDeclaringClass().getName().lastIndexOf(".") + 1),
                                e.get(metaProperty.getName()).getAsString());


                        impVal.setValue("extId", e.get(metaProperty.getName()).getAsString());
                        if(checkMandatoryFields(impVal)) {
                            Transaction tx = persistence.createTransaction();
                            EntityManager em = persistence.getEntityManager();
                            em.persist(impVal);
                            tx.commit();
                        }

                }


            } else{
               impVal = (Entity) importData(e.getAsJsonObject(metaProperty.getName()));
            }

            res.setValue(metaProperty.getName(), impVal);
        }
        else if(metaProperty.getJavaType().equals(Integer.class))
            res.setValue(metaProperty.getName(), val.getAsInt());
        else if(metaProperty.getJavaType().equals(String.class))
            res.setValue(metaProperty.getName(), val.getAsString());
        else if(metaProperty.getJavaType().equals(Float.class))
            res.setValue(metaProperty.getName(), val.getAsFloat());
        else if(metaProperty.getJavaType().equals(Double.class))
            res.setValue(metaProperty.getName(), val.getAsDouble());
        else if(metaProperty.getJavaType().equals(Boolean.class))
            res.setValue(metaProperty.getName(), val.getAsBoolean());
        else if(metaProperty.getJavaType().equals(Date.class))
            res.setValue(metaProperty.getName(), parse(val.getAsString()));
        else if(metaProperty.getType().equals(MetaProperty.Type.ENUM)) {
            res.setValue(metaProperty.getName(), getEnumValue((EnumClass[]) metaProperty.getJavaType().getEnumConstants(), val.getAsString()));
        }
    }

    private boolean checkMandatoryFields(Entity entity){

        boolean changesMade=false;

        for (MetaProperty metaProperty : entity.getMetaClass().getProperties()) {
            if(metaProperty.isMandatory()){

                if(metaProperty.getName().equalsIgnoreCase("id")) break;
                if(entity.getValue(metaProperty.getName())!=null) break;

                if(metaProperty.getJavaType().equals(Integer.class)){
                    entity.setValue(metaProperty.getName(), 0);

                }
                else if(metaProperty.getJavaType().equals(String.class)){
                    // вдруг поле уникальное
                    entity.setValue(metaProperty.getName(),"temp "+String.valueOf(Math.random())+String.valueOf(Math.random()));
                }

                else if(metaProperty.getJavaType().equals(Float.class)){
                    entity.setValue(metaProperty.getName(), 0.);
                }

                else if(metaProperty.getJavaType().equals(Double.class)){
                    entity.setValue(metaProperty.getName(), 0.);
                }

                else if(metaProperty.getJavaType().equals(Boolean.class)){
                    entity.setValue(metaProperty.getName(),false);
                }

                else if(metaProperty.getJavaType().equals(Date.class)){
                    entity.setValue(metaProperty.getName(),new Date());
                }

                else if(metaProperty.getType().equals(MetaProperty.Type.ENUM)) {
                    entity.setValue(metaProperty.getName(), getEnumValue((EnumClass[]) metaProperty.getJavaType().getEnumConstants(),
                            ((EnumClass[]) metaProperty.getJavaType().getEnumConstants())[0].toString()));
                }
                changesMade=true;
            }

        }
        return changesMade;
    }

    Object getEnumValue(EnumClass[] ev, String id)
    {
        for(int i=0;i<ev.length;i++)
            if(ev[i].toString().equals(id))
                return ev[i];
        return null;
    }

    @Override
    public Entity createObject(JsonObject e) throws Exception {
        if(e.get("type")==null)
            throw new Exception("Type is NULL for "+e.getAsString());
        return getEntity(e.get("type").getAsString(),e.get("extId").getAsString());



        //return getEntity(e.get("type").getAsString(),e.get("extId").getAsString());
    }

    Date parse(String d) {
        SimpleDateFormat f = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss");
        try {
            return f.parse(d);
        } catch (ParseException e) {
            e.printStackTrace();
        }
        return new Date();
    }

    private Entity getEntity(String pureType,String id){
        String type = "supply$"+pureType;
        Entity entity=null;

        try {
            if (id!=null) {
               entity= (Entity) dataManager.load(metadata.getClass(type).getJavaClass())
                        .query("select e from "+type+"  e where e.extId=:extId")
                        .parameter("extId",id)
                        .view(pureType.toLowerCase()+"-full")
                        .one();
            }
        }
        catch (Exception ex)
        {
            if(!ex.getMessage().equals("No results"))
                throw ex;
        }
        if(entity==null) {
            entity = metadata.create(type);

                entity.setValue("extId", id);    //т.к ид уже известен, надо будет его сетить и заполнять обязательные поля

            }

        return entity;

    }

    Serializable returnMessage(String message)
    {
        HashMap<String, String> res = new HashMap<>();
        res.put("ErrorMessage", message);
        return res;
    }


}