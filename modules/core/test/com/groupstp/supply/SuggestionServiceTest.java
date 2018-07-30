package com.groupstp.supply;

import com.google.gson.JsonObject;
import com.groupstp.supply.entity.*;
import com.groupstp.supply.service.QueryDaoService;
import com.groupstp.supply.service.SuggestionServiceBean;
import com.haulmont.chile.core.model.MetaClass;
import com.haulmont.cuba.core.app.EmailService;
import com.haulmont.cuba.core.entity.Entity;
import com.haulmont.cuba.core.global.DataManager;
import com.haulmont.cuba.core.global.Metadata;
import mockit.Expectations;
import mockit.Injectable;
import mockit.Mocked;
import mockit.Tested;
import mockit.integration.junit4.JMockit;
import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.*;
import java.util.stream.Collectors;

import static org.junit.Assert.*;
import static org.hamcrest.CoreMatchers.*;

/**
 * Created by Антон on 26.07.2018.
 */
@RunWith(JMockit.class)
public class SuggestionServiceTest {

    @Tested
    SuggestionServiceBean suggestionService;

    @Mocked
    @Injectable
    QueryDaoService queryDaoService;

    @Mocked
    @Injectable
    EmailService emailService;

    @Mocked
    @Injectable
    DataManager dataManager;

    @Mocked
    @Injectable
    Metadata metadata;

    @Test
    public void serviceMakeSameTokenForCoincidentalSetOfPositionsAndDifferentForDifferentOnes(){
        new Expectations() {{
            queryDaoService.saveToken(withNotNull(),withNotNull(), withNotNull());

        }};

        QueriesPosition qp1=new QueriesPosition();
        QueriesPosition qp2=new QueriesPosition();
        QueriesPosition qp3=new QueriesPosition();
        QueriesPosition qp4=new QueriesPosition();
        qp1.setId(UUID.randomUUID());
        qp2.setId(UUID.randomUUID());
        qp3.setId(UUID.randomUUID());
        qp4.setId(UUID.randomUUID());

        List<QueriesPosition> queriesPositions1= Arrays.asList(qp1,qp2,qp3);
        List<QueriesPosition> queriesPositions2= Arrays.asList(qp2,qp1,qp3);
        List<QueriesPosition> queriesPositions3= Arrays.asList(qp3,qp2,qp1);

        Suppliers suppliers=new Suppliers();
        suppliers.setId(UUID.randomUUID());

        String result1=suggestionService.makeTokenForPositionsAndSupplier(queriesPositions1,suppliers );
        String result2=suggestionService.makeTokenForPositionsAndSupplier(queriesPositions2,suppliers );
        String result3=suggestionService.makeTokenForPositionsAndSupplier(queriesPositions3,suppliers );

        assertEquals(result1,result2);
        assertEquals(result3,result2);

        List<QueriesPosition> queriesPositions4= Arrays.asList(qp4,qp2,qp3);
        List<QueriesPosition> queriesPositions5= Arrays.asList(qp4,qp1,qp3);
        List<QueriesPosition> queriesPositions6= Arrays.asList(qp4,qp2,qp1);

        String result4=suggestionService.makeTokenForPositionsAndSupplier(queriesPositions4,suppliers );
        String result5=suggestionService.makeTokenForPositionsAndSupplier(queriesPositions5,suppliers );
        String result6=suggestionService.makeTokenForPositionsAndSupplier(queriesPositions6,suppliers );

        Assert.assertThat(result4,not(equalTo(result5)));
        Assert.assertThat(result5,not(equalTo(result6)));
        Assert.assertThat(result4,not(equalTo(result6)));

        Suppliers suppliers2=new Suppliers();
        suppliers2.setId(UUID.randomUUID());

        String result7=suggestionService.makeTokenForPositionsAndSupplier(queriesPositions4,suppliers2 );
        String result8=suggestionService.makeTokenForPositionsAndSupplier(queriesPositions5,suppliers2 );
        String result9=suggestionService.makeTokenForPositionsAndSupplier(queriesPositions6,suppliers2 );

        Assert.assertThat(result7,not(equalTo(result5)));
        Assert.assertThat(result8,not(equalTo(result6)));
        Assert.assertThat(result9,not(equalTo(result6)));

    }

    @Test
    public void serviceMakeCorrectMapOfPositionDividedBySupplierAndCompany(){

        Company c1=new Company();
        c1.setName("c1");
        Company c2=new Company();
        c2.setName("c2");
        Company c3=new Company();
        c3.setName("c3");

        Suppliers s1=new Suppliers();
        s1.setName("s1");
        Suppliers s2=new Suppliers();
        s2.setName("s2");

        Query q1=new Query();
        q1.setCompany(c1);
        Query q2=new Query();
        q2.setCompany(c2);
        Query q3=new Query();
        q3.setCompany(c3);

        QueriesPosition qp1=new QueriesPosition();
        qp1.setQuery(q1);
        QueriesPosition qp2=new QueriesPosition();
        qp2.setQuery(q1);
        QueriesPosition qp3=new QueriesPosition();
        qp3.setQuery(q1);
        QueriesPosition qp4=new QueriesPosition();
        qp4.setQuery(q2);
        QueriesPosition qp5=new QueriesPosition();
        qp5.setQuery(q2);
        QueriesPosition qp6=new QueriesPosition();
        qp6.setQuery(q2);
        QueriesPosition qp7=new QueriesPosition();
        qp7.setQuery(q3);
        QueriesPosition qp8=new QueriesPosition();
        qp8.setQuery(q3);
        QueriesPosition qp9=new QueriesPosition();
        qp9.setQuery(q3);
        QueriesPosition qp10=new QueriesPosition();
        qp10.setQuery(q3);

        PositionSupplier ps1=new PositionSupplier();  ps1.setPosition(qp1);    ps1.setSupplier(s1);
        PositionSupplier ps2=new PositionSupplier();  ps2.setPosition(qp2);    ps2.setSupplier(s1);
        PositionSupplier ps3=new PositionSupplier();  ps3.setPosition(qp3);    ps3.setSupplier(s1);
        PositionSupplier ps4=new PositionSupplier();  ps4.setPosition(qp4);    ps4.setSupplier(s1);
        PositionSupplier ps5=new PositionSupplier();  ps5.setPosition(qp5);    ps5.setSupplier(s1);
        PositionSupplier ps6=new PositionSupplier();  ps6.setPosition(qp6);    ps6.setSupplier(s2);
        PositionSupplier ps7=new PositionSupplier();  ps7.setPosition(qp7);    ps7.setSupplier(s2);
        PositionSupplier ps8=new PositionSupplier();  ps8.setPosition(qp8);    ps8.setSupplier(s2);
        PositionSupplier ps9=new PositionSupplier();  ps9.setPosition(qp9);    ps9.setSupplier(s2);
        PositionSupplier ps10=new PositionSupplier();  ps10.setPosition(qp10);    ps10.setSupplier(s2);

        new Expectations(){{
            queryDaoService.getSupplierPositions(withNotNull());
            result=Arrays.asList(ps1,ps2,ps3,ps4,ps5,ps6,ps7,ps8,ps9,ps10);
        }};


        Map<Suppliers,Map<Company,List<QueriesPosition>>> result=suggestionService.makeSuggestionRequestMap(Arrays.asList(qp1,qp2,qp3,qp4,qp5,qp6,qp7,qp8,qp9,qp10));

        //проверряем когда есть поставщик и позиции еще не отправлены
        assertEquals(2,result.entrySet().size());

        List<Map.Entry<Suppliers,Map>> bySupplier=new ArrayList<>((Collection) result.entrySet());
        List<Map> byCompany=bySupplier.stream().map(item->item.getValue()).collect(Collectors.toList());
        assertEquals(2,byCompany.get(0).entrySet().size());
        assertEquals(2,byCompany.get(1).entrySet().size());
        assertEquals(10,getAllPositionsFromMap(result).size());

        ps10.setPosition(qp1);
        ps3.setSuggestionRequestSend(true);


        //проверяем обработку уже отправленных запросов и позиций без поставщика
        result=suggestionService.makeSuggestionRequestMap(Arrays.asList(qp1,qp2,qp3,qp4,qp5,qp6,qp7,qp8,qp9,qp10));



        assertEquals(2,result.get(s1).entrySet().size());
        assertEquals(3,result.get(s2).entrySet().size());
        assertEquals(9,getAllPositionsFromMap(result).size());
        assertEquals(1,suggestionService.getPositionListWithoutSupplier().size());
        assertEquals(1,suggestionService.getWithRequestAlreadySend().size());
        assertEquals(qp10,suggestionService.getPositionListWithoutSupplier().get(0));
        assertEquals(ps3,suggestionService.getWithRequestAlreadySend().get(0));
    }

    @Test
    public void serviceProcessJsonFromWebFormAndThrowExceptionWhenNeeded(){
        new Expectations() {{
            queryDaoService.saveToken(withNotNull(),withNotNull(), withNotNull());

        }};

        QueriesPosition qp1=new QueriesPosition();
        QueriesPosition qp2=new QueriesPosition();
        QueriesPosition qp3=new QueriesPosition();
        QueriesPosition qp4=new QueriesPosition();
        qp1.setId(UUID.randomUUID());
        qp2.setId(UUID.randomUUID());
        qp3.setId(UUID.randomUUID());
        qp4.setId(UUID.randomUUID());

        List<QueriesPosition> queriesPositions= Arrays.asList(qp1,qp2,qp3);


        Suppliers suppliers=new Suppliers();
        suppliers.setId(UUID.randomUUID());

        PositionSupplier ps1=new PositionSupplier();  ps1.setPosition(qp1);    ps1.setSupplier(suppliers);
        PositionSupplier ps2=new PositionSupplier();  ps2.setPosition(qp2);    ps2.setSupplier(suppliers);
        PositionSupplier ps3=new PositionSupplier();  ps3.setPosition(qp3);    ps3.setSupplier(suppliers);

        String token=suggestionService.makeTokenForPositionsAndSupplier(queriesPositions,suppliers);

        JsonObject[] jsonObjects=new JsonObject[3];
        jsonObjects[0]=makeJsonObject(qp1.getId().toString(),"a1",122.,4.);
        jsonObjects[1]=makeJsonObject(qp2.getId().toString(),"a2",222.,24.);
        jsonObjects[2]=makeJsonObject(qp3.getId().toString(),"a3",322.,34.);


        new Expectations(){{
            queryDaoService.getPositionSuppliersForToken(withNotNull());
            result=Arrays.asList(ps1,ps2,ps3);
        }{
            metadata.create( SuppliersSuggestion.class);
            result=new SuppliersSuggestion();
        }{
            dataManager.commit((Entity) withNotNull());
        }};


        try {
           suggestionService.processSuggestion(token,jsonObjects);
        } catch (Exception e) {
           fail("брошено исключение при обработке предложения");
        }

        jsonObjects[2]=makeJsonObject("15","a3",322.,34.);

        try {
            suggestionService.processSuggestion(token,jsonObjects);
            fail("при обработке предложения исключение не брошено, хотя данные не корректны");
        } catch (Exception e) {

        }

    }

    private  List<QueriesPosition> getAllPositionsFromMap(Map<Suppliers,Map<Company,List<QueriesPosition>>> sourceMap){
        List<QueriesPosition> allPositions=new ArrayList<>();
        sourceMap.entrySet().forEach(supplierEntry->{
            supplierEntry.getValue().entrySet().forEach(companyEntry-> {
                allPositions.addAll(companyEntry.getValue());
            });
        });

        return allPositions;
    }

    private JsonObject makeJsonObject(String positionId,String supAddress,Double quantity,Double price){
        JsonObject result=new JsonObject();
        result.addProperty("positionId",positionId);
        result.addProperty("supAddress",supAddress);
        result.addProperty("quantity",quantity);
        result.addProperty("price",price);
        return result;
    }
}
