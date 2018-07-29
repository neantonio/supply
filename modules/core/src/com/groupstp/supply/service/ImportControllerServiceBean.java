package com.groupstp.supply.service;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.groupstp.supply.entity.Nomenclature;
import com.haulmont.cuba.core.EntityManager;
import com.haulmont.cuba.core.Persistence;
import com.haulmont.cuba.core.Transaction;
import org.springframework.stereotype.Service;

import javax.inject.Inject;
import java.io.IOException;
import java.security.NoSuchAlgorithmException;
import java.util.*;

@Service(ImportControllerService.NAME)
public class ImportControllerServiceBean implements ImportControllerService {

    @Inject
    private Sync1CService sync1CService;

    @Inject
    private EntityImportService entityImportService;

    @Inject
    private Persistence persistence;

    String url;
    String pass;

    List<String> getAttributes(String reference){
        HashMap<String, String> params = new HashMap<>();
        List <String> result=new ArrayList<>();
        params.put("reference", reference);
        params.put("type","attributes");
        JsonArray data = null;
        try {
            data = (JsonArray) sync1CService.getData1C(url+"references", pass,params);
        } catch (IOException e) {
            e.printStackTrace();
        } catch (NoSuchAlgorithmException e) {
            e.printStackTrace();
        }
        for (JsonElement e: data) {


            JsonObject o = e.getAsJsonObject();
            String value = o.get("Реквизит").getAsString();
            result.add(value);
        }
        return result;
    }

    @Override
    public void importNomenclature1C(String url, String pass){
        this.url=url;
        this.pass=pass;
        getAttributes("Номенклатура");
        HashMap<String, String> params = new HashMap<>();
        Date today = new Date();
        params.put("reference", "Номенклатура");
        params.put("type", "data");
//        params.put("type","attributes");
       params.put("attributes", "[\"УникальныйИдентификатор\", \"Наименование\", \"НаименованиеПолное\", \"Артикул\", \"Родитель\"]");
//        params.put("reference", "Организации");
//        params.put("type", "data");
//        params.put("attributes", "[\"УникальныйИдентификатор\", \"Наименование\", \"ИНН\", \"НаименованиеПолное\"]");
        JsonArray data = null;
        try {
            data = (JsonArray) sync1CService.getData1C(url+"references", pass,params);
        } catch (IOException e) {
            e.printStackTrace();
        } catch (NoSuchAlgorithmException e) {
            e.printStackTrace();
        }


        EntityJSONAdapter adapter=new EntityJSONAdapter();
        Map<String,String> fieldNameMap=new HashMap<>();
        adapter.addFieldDescription("УникальныйИдентификатор","extId",255);
        adapter.addFieldDescription("Наименование","name",50);
        adapter.addFieldDescription("НаименованиеПолное","fullName",255);
        adapter.addFieldDescription("РодительУникальныйИдентификатор","parent",255);
        adapter.addFieldDescription("Артикул","article",25);

        int i=0;
        List<JsonElement> errors=new ArrayList<>();
        for (JsonElement e: data) {
            JsonObject o = e.getAsJsonObject();
            String id = o.get("УникальныйИдентификатор").getAsString();
            if("УникальныйИдентификатор".equals(id))
                continue;
            Nomenclature nomenclature;
            try {
               entityImportService.importData(adapter.prepareJSONForImport(e.getAsJsonObject(),"Nomenclature").getAsJsonObject());
            } catch (Exception e1) {
                e1.printStackTrace();
                errors.add(e);
            }
            i++;


        }

    }

    class EntityJSONAdapter{

        private Map<String,String> fieldNameMap=new HashMap<>();
        private Map<String,Integer> fieldLengthMap=new HashMap<>();

        JsonObject prepareJSONForImport(JsonObject obj,String type){

            JsonObject result=new JsonObject();

            result.addProperty("type",type);

            obj.entrySet().forEach(entry->{

                if(fieldNameMap.get(entry.getKey())!=null){
                    result.addProperty(fieldNameMap.get(entry.getKey()),
                            fieldLengthMap.get(entry.getKey())==null?
                            entry.getValue().getAsString().length()>=fieldLengthMap.get(entry.getKey())?
                                    entry.getValue().getAsString().substring(0,fieldLengthMap.get(entry.getKey())-1)
                                    : entry.getValue().getAsString()
                            :entry.getValue().getAsString());
                }

            });

            return result;

        }

        public void addFieldDescription(String jsonName,String javaName,int length){
            fieldNameMap.put(jsonName,javaName);
            fieldLengthMap.put(jsonName,length);
        }

        public void addFieldDescription(String jsonName,String javaName){
            fieldNameMap.put(jsonName,javaName);

        }

        public void clearMaps(){
            fieldLengthMap.clear();
            fieldNameMap.clear();
        }

    }
}

