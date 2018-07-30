package com.groupstp.supply.service;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.groupstp.supply.entity.*;
import com.haulmont.cuba.core.app.EmailService;
import com.haulmont.cuba.core.global.DataManager;
import com.haulmont.cuba.core.global.DevelopmentException;
import com.haulmont.cuba.core.global.EmailInfo;
import com.haulmont.cuba.core.global.Metadata;
import org.springframework.stereotype.Service;

import javax.inject.Inject;
import java.io.Serializable;
import java.util.*;
import java.util.stream.Collectors;

@Service(SuggestionService.NAME)
public class SuggestionServiceBean implements SuggestionService {

    @Inject
    private QueryDaoService queryDaoService;

    @Inject
    private EmailService emailService;

    @Inject
    private DataManager dataManager;

    @Inject
    private Metadata metadata;

    @Override
    public String makeTokenForPositionsAndSupplier(Collection<QueriesPosition> positionCollection, Suppliers supplier){

        if(positionCollection.size()==0) throw new DevelopmentException("token can only be made for not empty position collection");

        List<QueriesPosition> positionList=new ArrayList<>(positionCollection);
        String result=String.valueOf(supplier.getId().hashCode());

        //сортируем по uuid
        positionList.sort((item1,item2)->
             item1.getId().compareTo(item2.getId())
        );

        for(QueriesPosition qp:positionList){
            result=result+makePositionTokenPart(qp);
        }

        try{
            getPositionsForToken(result);
            //значит по этому набору позиций был запрос
        }
        catch (Exception e){
            queryDaoService.saveToken(result,positionList,supplier );
        }

        return result;
    }

    @Override
    public Collection<QueriesPosition> getPositionsForToken(String token) {

        Collection<QueriesPosition> result=queryDaoService.getTokenLinkForToken(token).getPositions();
        if((result==null)||(result.isEmpty())) throw new DataIncompleteException();
        return result;
    }

    @Override
    public Map<Suppliers,Map<Company,List<QueriesPosition>>> makeSuggestionRequestMap(Collection<QueriesPosition> positionCollection){
        return makeSuggestionRequestMap( positionCollection,false);
    }

    private List<QueriesPosition> positionListWithoutSupplier;
    private List<PositionSupplier> withRequestAlreadySend=new ArrayList<>();
    private List<QueriesPosition> justSendPositions=new ArrayList<>();

    @Override
    public Map<Suppliers,Map<Company,List<QueriesPosition>>> makeSuggestionRequestMap(Collection<QueriesPosition> positionCollection,boolean ignoreAlreadySend){

        List<PositionSupplier>  positionSuppliers=queryDaoService.getSupplierPositions(positionCollection);

        positionListWithoutSupplier=new ArrayList<>(positionCollection);
        withRequestAlreadySend.clear();
        justSendPositions.clear();

        Map<Suppliers,List<QueriesPosition>> supplierMap=new HashMap<>();

        //сначала делаем мап по поставщикам
        positionCollection.forEach(position->{
            positionSuppliers.forEach(positionSupplier -> {
                if(positionSupplier.getPosition().getId().equals(position.getId())) {
                    if ((!ignoreAlreadySend) && (positionSupplier.getSuggestionRequestSend() == null ? false : positionSupplier.getSuggestionRequestSend())) {
                        withRequestAlreadySend.add(positionSupplier);
                    } else {
                        addPositionToSupplierMap(supplierMap, position, positionSupplier.getSupplier());

                    }
                    positionListWithoutSupplier.remove(position);
                }
            });
        });

        Map<Suppliers,Map<Company,List<QueriesPosition>>> supplierMapWithCompanies=new HashMap<>();

        //группируем позиции по компаниям
        supplierMap.entrySet().forEach(entry->{
           supplierMapWithCompanies.put(
                   entry.getKey(),
                   entry.getValue().stream().collect(Collectors.groupingBy(
                           position->position.getQuery().getCompany()
                   ))
           );
        });

        return supplierMapWithCompanies;

    }

    @Override
    public void processRequestSending(Map<Suppliers, Map<Company, List<QueriesPosition>>> mapToSend, Employee employee){

        mapToSend.entrySet().forEach(supplierEntry->{
            supplierEntry.getValue().entrySet().forEach(companyEntry->{

                markPositionsSupplierAsSend(companyEntry.getValue());
                justSendPositions.addAll(companyEntry.getValue());

                Map<String,Serializable> paramMap=new HashMap<>();
                paramMap.put("company",companyEntry.getKey());
                paramMap.put("positions",(ArrayList)companyEntry.getValue());
                paramMap.put("link","https://gag.groupstp.ru/supplier.html?key=");
                paramMap.put("token", makeTokenForPositionsAndSupplier(companyEntry.getValue(),supplierEntry.getKey() ));
                paramMap.put("employee",employee);

                EmailInfo emailInfo = new EmailInfo(
                        "cubatest@ya.ru",//supplierEntry.getKey().getEmail(),
                        "запрос предложения от "+companyEntry.getKey().getName(),
                        "cubatest@ya.ru",
                        "com/groupstp/supply/templates/supplier_suggestion_template_email.txt", // body template
                        paramMap// template parameters
                );
                emailInfo.setBodyContentType("text/html; charset=UTF-8");
                emailService.sendEmailAsync(emailInfo);
            });
        });
    }

    /**
     * обработка ввода предложения через веб форму
     * @param token
     * @param jsonObjects массив элементов. каждый должен содержать positionId, supAddress, quantity(double),price(double)
     */
    @Override
    public void processSuggestion(String token, JsonObject[] jsonObjects){

        List<PositionSupplier> positionSupplierList =queryDaoService.getPositionSuppliersForToken(token);

        positionSupplierList.forEach(positionSupplier -> {
            writeSupplierSuggestion(positionSupplier,getJsonObjectForPositionSupplier(positionSupplier,jsonObjects));
        });

    }

    private JsonObject getJsonObjectForPositionSupplier(PositionSupplier positionSupplier,JsonObject[] jsonObjects){

        try {
            for (int i = 0; i < jsonObjects.length; i++) {
                if (jsonObjects[i].get("positionId").getAsString().equalsIgnoreCase(positionSupplier.getPosition().getId().toString()))
                    return jsonObjects[i];
            }
        }
        catch (NullPointerException e){
            throw new DevelopmentException("every json object must contain positionId",e);
        }

        throw new DevelopmentException("there must be jsonObject for every position in suggestion request");

    }

    private void markPositionsSupplierAsSend(Collection<QueriesPosition> positionCollection){
        List<PositionSupplier>  positionSuppliers=queryDaoService.getSupplierPositions(positionCollection);

        positionSuppliers.forEach(item->{
            item.setSuggestionRequestSend(true);
            dataManager.commit(item);
        });
    }



    private void addPositionToSupplierMap( Map<Suppliers,List<QueriesPosition>> supplierMap,QueriesPosition position,Suppliers supplier){
        if(supplierMap.get(supplier)==null) supplierMap.put(supplier,new ArrayList<>());
        supplierMap.get(supplier).add(position);
    }

    private String makePositionTokenPart(QueriesPosition position){
        int hash=position.getId().hashCode();
        String result="";
        while (true){
            result=result+(char)hash%256;
            hash=hash/256;
            if(hash==0)break;
        }
        return result;
    }

    private void writeSupplierSuggestion(PositionSupplier positionSupplier,JsonObject jsonObject){
        String supAddress;
        Double quantity;
        Double price;

        try{
            supAddress=jsonObject.get("supAddress").getAsString();
            quantity= jsonObject.get("quantity").getAsDouble();
            price=jsonObject.get("price").getAsDouble();
        }
        catch (NullPointerException e){
            throw new DevelopmentException("every json object must contain positionId, supAddress, quantity(double),price(double)",e);
        }
        SuppliersSuggestion suggestion =metadata.create(SuppliersSuggestion.class);
        suggestion.setPrice(price);
        suggestion.setSupAddress(supAddress);
        suggestion.setQuantity(quantity);
        suggestion.setPosSup(positionSupplier);
        dataManager.commit(suggestion);

    }





    @Override
    public List<QueriesPosition> getPositionListWithoutSupplier() {
        return positionListWithoutSupplier;
    }

    @Override
    public List<PositionSupplier> getWithRequestAlreadySend() {
        return withRequestAlreadySend;
    }

    @Override
    public List<QueriesPosition> getJustSendPositions() {
        return justSendPositions;
    }
}