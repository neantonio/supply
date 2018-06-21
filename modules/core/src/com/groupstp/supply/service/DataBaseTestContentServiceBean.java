package com.groupstp.supply.service;

import com.groupstp.supply.entity.*;
import com.haulmont.cuba.core.EntityManager;
import com.haulmont.cuba.core.Persistence;
import com.haulmont.cuba.core.Transaction;
import com.haulmont.cuba.core.global.DataManager;
import com.haulmont.cuba.core.global.LoadContext;
import com.haulmont.cuba.core.global.Metadata;
import com.haulmont.cuba.core.global.ValueLoadContext;
import com.haulmont.cuba.security.entity.Group;
import com.haulmont.cuba.security.entity.User;
import org.apache.poi.hssf.usermodel.HSSFSheet;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;

import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import javax.inject.Inject;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.*;


@Service(DataBaseTestContentService.NAME)
public class DataBaseTestContentServiceBean implements DataBaseTestContentService {

    String priceListFileName="C:\\Users\\79167\\Downloads\\pricetin.xls";

    @Inject
    private DataManager dataManager;

    @Resource
    private
    List<String> companyList;

    @Resource
    private
    Map<String,String> measureMap;



    private Map<String,MeasureUnits> measureUnitMap=new HashMap<>();

    @Resource
    private
    List<String> ownCompanyList;

    @Resource
    private
    List<String> groupList;

    @Resource
    private
    List<String> workflowList;

    @Resource
    private
    List<String> addressList;

    @Resource
    private
    List<String> urgencyList;

    @Resource
    private
    List<String> divisionList;

    @Resource
    private
    List<String> workflowValidationScriptList;

    @Resource
    private
    List<String> secondNameList;

    @Resource
    private
    List<String> firstNameMaleList;

    @Resource
    private
    List<String> firstNameFemaleList;

    @Resource
    private
    List<String> warehouseList;

    @Inject
    private Metadata metadata;

    @Inject
    private RandomDataService randomDataService;

    @Inject
    private QueryService queryService;

    @Inject
    private Persistence persistence;

    @Inject
    private WorkflowService workflowService;

    List<Company> companies=new ArrayList<>();
    List<Division> divisions=new ArrayList<>();
    List<Store> stores=new ArrayList<>();
    List<MeasureUnits> measureUnits=new ArrayList<>();
    List<Nomenclature> nomenclatureList=new ArrayList<>();
    List<Query> queries=new ArrayList<>();
    List<Employee> employees=new ArrayList<>();
    List<Urgency> urgencies=new ArrayList<>();
    List<QueryWorkflow> queryWorkflows=new ArrayList<>();
    List<QueryWorkflowDetail>queryWorkflowDetails=new ArrayList<>();
    List<Group> groups=new ArrayList<>();
    List<QueriesPosition> queriesPositions=new ArrayList<>();
    List<StageTerm> stageTerms=new ArrayList<>();

    Map<Stages,StageAction> stageActionMap=new HashMap<>();

    public DataBaseTestContentServiceBean(){



        //ищем номенклатуру на номенклатурном контроле
        stageActionMap.put(Stages.NomControl,qp->{
            qp.setPositionUsefulness(randomDataService.getRandomBoolean(80));

            if(qp.getPositionUsefulness()){
                if(qp.getNomenclature()==null){
                    for(Nomenclature nomenclature:nomenclatureList){
                        if(qp.getSpecification().contains(nomenclature.getName())) {
                            qp.setNomenclature(nomenclature);
                            break;
                        }
                    }
                }
            }
        });

       //на складском контроле пока ничего не делаем
        stageActionMap.put(Stages.StoreControl,qp->{

        });

        //подбор поставщиков

    }


    public void createEntities(){

        companies.clear();
        divisions.clear();
        stores.clear();
        measureUnits.clear();
        nomenclatureList.clear();
        queries.clear();
        employees.clear();
        urgencies.clear();
        queryWorkflows.clear();
        queryWorkflowDetails.clear();
        groups.clear();
        queriesPositions.clear();
        stageTerms.clear();


        Transaction tx = persistence.createTransaction();
        EntityManager em = persistence.getEntityManager();



        for(String companyName:ownCompanyList){
            Company company =createCompany(companyName);
            companies.add(company);
            em.persist(company);
        }

        for(Company company:companies){
            int divisionsPerCompany= (int) randomDataService.getRandomLong(3,10);
            List<String> leftDivisions=new ArrayList<>();
            divisionList.forEach(item->leftDivisions.add(item));

            for(int i=0;i<divisionsPerCompany;i++){
                Division division = metadata.create(Division.class);
                division.setName((String)randomDataService.getRandomFromList(leftDivisions));
                leftDivisions.remove(division.getName());
                division.setCompany(company);
                em.persist(division);

                divisions.add(division);
            }
        }

        int j=1;
        for(Division division:divisions) {
            int storePerDivision = (int) randomDataService.getRandomLong(1, 6);
            List<String> leftStores = new ArrayList<>();
            warehouseList.forEach(item -> leftStores.add(item));

            for (int i = 0; i < storePerDivision; i++) {
                Store store = metadata.create(Store.class);
                store.setName((String) randomDataService.getRandomFromList(leftStores) + String.valueOf(j));
                stores.add(store);
                leftStores.remove(store.getName());
                em.persist(store);
                j++;
            }
        }

        for(Map.Entry<String,String> entry:measureMap.entrySet()){
            MeasureUnits unit=metadata.create(MeasureUnits.class);
            unit.setCode(entry.getKey());
            unit.setName(entry.getKey());
            unit.setFullName(entry.getValue());
            measureUnits.add(unit);
            measureUnitMap.put(entry.getKey(),unit);
        }

        measureUnits.forEach(item->em.persist(item));

        NomenclatureWrapper.randomDataService=randomDataService;
        NomenclatureWrapper.measureUnitsMap=measureUnitMap;
        NomenclatureWrapper.metadata=metadata;

        Parser parcer=new Parser();

        parcer.parse(priceListFileName).createNomenclature(nomenclatureList);
        nomenclatureList.remove(0);
        nomenclatureList.sort((Nomenclature item1,Nomenclature item2)->{
            return item1.getName().compareTo(item2.getName());
        });

        for(int k=1;k<nomenclatureList.size();k++){
            while(nomenclatureList.get(k).getName().equals(nomenclatureList.get(k-1).getName())){
                nomenclatureList.get(k-1).setName(nomenclatureList.get(k-1).getName()+String.valueOf(k-1));
                k++;
                if(k==nomenclatureList.size()) break;;
            }
        }

        nomenclatureList.sort((Nomenclature item1,Nomenclature item2)->{
            return item1.getArticle().compareTo(item2.getArticle());
        });

        for(int k=1;k<nomenclatureList.size();k++){
            if(nomenclatureList.get(k).getArticle().equals("")) nomenclatureList.get(k).setArticle(String.valueOf(k));
            if(nomenclatureList.get(k).getArticle().equals(nomenclatureList.get(k-1).getArticle())){
                nomenclatureList.get(k).setArticle(nomenclatureList.get(k).getArticle()+String.valueOf(k));
            }
        }
        nomenclatureList.get(0).setArticle("k1");

        nomenclatureList.forEach(item->em.persist(item));

        for(String groupName:groupList){
            Group group=metadata.create(Group.class);
            group.setName(groupName);
            groups.add(group);
            em.persist(group);
        }

        int employeeValue=(int) randomDataService.getRandomLong(200,400);
        for(int i=9;i<employeeValue;i++){
            Employee employee=createEmployee(groups);
            employees.add(employee);
            em.persist(employee);
        }

        for(String urg:urgencyList){
            Urgency urgency=metadata.create(Urgency.class);
            urgency.setName(urg);
            urgencies.add(urgency);
            em.persist(urgency);
        }

        for(Urgency urgency:urgencies){
           Stages[] stages= Stages.values();

            for(int i=0;i<stages.length;i++){
                StageTerm stageTerm=metadata.create(StageTerm.class);
                stageTerm.setUrgency(urgency);
                stageTerm.setStage(stages[i]);
                stageTerm.setTime((int) randomDataService.getRandomLong(24,14*24));    //в часах
                em.persist(stageTerm);
                stageTerms.add(stageTerm);
            }
        }

        for(String workflow:workflowList){
            QueryWorkflow queryWorkflow=metadata.create(QueryWorkflow.class);
            queryWorkflow.setName(workflow);
            queryWorkflows.add(queryWorkflow);
            queryWorkflow.setDetails(createQueryWorkflowDetailList(0,queryWorkflow,null));
            queryWorkflow.getDetails().forEach(item->em.persist(item));
            em.persist(queryWorkflow);
        }

//        int detailValue= (int) randomDataService.getRandomLong(10,50);
//        for(int i=0;i<detailValue;i++){
//            QueryWorkflowDetail workflowDetail=createQueryWorkflowDetail((QueryWorkflow) randomDataService.getRandomFromList(queryWorkflows));
//            queryWorkflowDetails.add(workflowDetail);
//            em.persist(workflowDetail);
//        }




        int queriesValue= (int) randomDataService.getRandomLong(15,20);
        for(int i=0;i<queriesValue;i++){
            Query query= metadata.create(Query.class);
            query.setCause((Causes) randomDataService.getRandomFromArr(Causes.values()));
            query.setCompany((Company) randomDataService.getRandomFromList(companies));
            //query.setInWork(randomDataService.getRandomBoolean(70));
            query.setInWork(false);
            query.setDivision((Division) randomDataService.getRandomFromList(divisions));
            query.setContact(((Employee) randomDataService.getRandomFromList(employees)).getUser());
            em.persist(query.getContact());
            query.setNumber(String.valueOf(i));
            query.setOrigin((Origin) randomDataService.getRandomFromArr(Origin.values()));
            query.setPeridiocity((Peridiocities) randomDataService.getRandomFromArr(Peridiocities.values()));
            query.setStore((Store) randomDataService.getRandomFromList(stores));

            Date today=new Date();
            query.setTimeCreation(randomDataService.getRandomDate(new Date(today.getTime()-20*24*60*60*1000),today));
            query.setUrgency((Urgency) randomDataService.getRandomFromList(urgencies));

            query.setWholeQueryWorkout(randomDataService.getRandomBoolean(80));
            query.setWorkflow((QueryWorkflow) randomDataService.getRandomFromList(queryWorkflows));


            em.persist(query);
            queries.add(query);
        }

        Stages beginStage=Stages.values()[0];

        for(Query query:queries){
            int queryPositionValue= (int) randomDataService.getRandomLong(1,4);
            for(int i=0;i<queryPositionValue;i++) {
                QueriesPosition queryPosition =metadata.create(QueriesPosition.class);
                queryPosition.setQuery(query);
                queryPosition.setCurrentStage(beginStage);

                Nomenclature n= (Nomenclature) randomDataService.getRandomFromList(nomenclatureList);
                while(n.getIsgroup()) n= (Nomenclature) randomDataService.getRandomFromList(nomenclatureList);
                if(randomDataService.getRandomBoolean(70)){
                    queryPosition.setPositionType(PositionType.nomenclature);

                    queryPosition.setNomenclature(n);
                }
                else{
                    queryPosition.setPositionType(PositionType.specification);
                    queryPosition.setSpecification(generateSpecification(n));
                }

                queryPosition.setMeasureUnit(n.getUnit());
                queryPosition.setQuantity((double) randomDataService.getRandomLong(1,300));

                queryPosition.setAnalogsAllowed(randomDataService.getRandomBoolean(90));

                queryPosition.setAnalogsCorrectionFlag(false);
                queryPosition.setAnalysisFlag(false);
                queryPosition.setNomControlFlag(false);
                queryPosition.setStoreControlFlag(false);
                queryPosition.setSupSelectionFlag(false);

                queriesPositions.add(queryPosition);

                em.persist(queryPosition);

            }
        }
        
        tx.commit();
    }

    @Override
    public void beginBusinessProcess(){

        //перемещаем часть заявок в работу
//        for(QueriesPosition qp:queriesPositions){
//            if(randomDataService.getRandomBoolean(80)){
//                try {
//                    workflowService.movePosition(qp);
//                } catch (Exception e) {
//                    e.printStackTrace();
//                }
//            }
//        }
        for(Query query:queries){
            if(randomDataService.getRandomBoolean(80)) {
                queryService.beginQueryProcessing(query);
            }
        }
    }

     String generateSpecification(Nomenclature nomenclature){

        return "Требуется подбор "+nomenclature.getName();
    }



     Company createCompany(){
        return createCompany((String)randomDataService.getRandomFromList(ownCompanyList));
    }

    Company createCompany(String companyName){
        Company result=metadata.create(Company.class);
        result.setInn(String.valueOf(randomDataService.getRandomLong(1000000000,1299999999)));
        result.setKpp(String.valueOf(randomDataService.getRandomLong(10000000,99999999)));
        result.setFullName(companyName);
        result.setName(result.getFullName().substring(0,result.getFullName().length()>24?24:result.getFullName().length()));
        return result;
    }





     User createUser(List<Group> groups){
        User result=metadata.create(User.class);
        if(randomDataService.getRandomBoolean(50)){
            result.setFirstName((String)randomDataService.getRandomFromList(firstNameMaleList));
            result.setLastName((String)randomDataService.getRandomFromList(secondNameList));
        }
        else{
            result.setFirstName((String)randomDataService.getRandomFromList(firstNameFemaleList));
            result.setLastName((String)randomDataService.getRandomFromList(secondNameList)+"a");
        }
        result.setActive(randomDataService.getRandomBoolean(95));
        result.setChangePasswordAtNextLogon(randomDataService.getRandomBoolean(1));
        result.setName(result.getFirstName()+" "+result.getLastName());
        result.setLogin("test"+String.valueOf(result.getName().hashCode())+String.valueOf(randomDataService.getRandomLong(0,999999)));
        result.setEmail(result.getLogin()+"@groupstp.com");
        result.setLoginLowerCase(result.getLogin().toLowerCase());
        result.setGroup((Group) randomDataService.getRandomFromList(groups));
        //result.set
        return result;
    }

    Employee createEmployee(List<Group> groups){
        Employee result=metadata.create(Employee.class);
        result.setUser(createUser(groups));
        return result;
    }

    QueryWorkflowDetail createQueryWorkflowDetail(QueryWorkflow queryWorkflow,int sourceStage){
        QueryWorkflowDetail result=metadata.create(QueryWorkflowDetail.class);
        result.setQueryWorkflow(queryWorkflow);

        Stages[] stages=Stages.values();
        int destStage;
        if(randomDataService.getRandomBoolean(90))destStage=sourceStage+1;
        else destStage=(int) randomDataService.getRandomLong(1,3)+sourceStage;
        if(destStage>=stages.length)destStage=stages.length-1;
        result.setDestStage(stages[destStage]);
        result.setSourceStage(stages[sourceStage]);
        result.setValidationScript((String) randomDataService.getRandomFromList(workflowValidationScriptList));
        result.setScript((String) randomDataService.getRandomFromList(workflowValidationScriptList));
        result.setPriority((int) randomDataService.getRandomLong(1,12));

        return result;
    }

     List<QueryWorkflowDetail> createQueryWorkflowDetailList(int sourceStage,QueryWorkflow queryWorkflow,List<QueryWorkflowDetail> details){

        if(details==null)details=new ArrayList<>();
        int lastStage=Stages.values().length-1;

        List<QueryWorkflowDetail> justGeneratedDetail=new ArrayList<>();
        int detailWithCurrentStage= (int) randomDataService.getRandomLong(1,3);
        for(int i=0;i<detailWithCurrentStage;i++){
            QueryWorkflowDetail detail=createQueryWorkflowDetail(queryWorkflow,sourceStage);
            justGeneratedDetail.add(detail);
            details.add(detail);
        }

        //сортируем и выставляем приоритеты вручную чтобы избежать одинаковых приоритетов
        justGeneratedDetail.sort((item1,item2)->{
            return item1.getPriority().compareTo(item2.getPriority());
        });
        int i=1;
        for(QueryWorkflowDetail d:justGeneratedDetail){
            d.setPriority(i);
            i++;
        }

        for(QueryWorkflowDetail d:justGeneratedDetail){
            if((d.getDestStage()!=Stages.Abortion)&&(d.getDestStage()!=Stages.Divided)&&(d.getDestStage()!=Stages.Done)){
                int stageIndex=Arrays.asList(Stages.values()).indexOf(d.getDestStage());
                createQueryWorkflowDetailList(stageIndex,queryWorkflow,details);
            }
        };

        return details;

    }




}

interface StageAction{
    void processStage(QueriesPosition qp);
}


class Parser {

    public  NomenclatureWrapper parse(String name) {

        String result = "";

        InputStream in = null;

        HSSFWorkbook wb = null;
        try {
            in = new FileInputStream(name);
            wb = new HSSFWorkbook(in);
        } catch (IOException e) {
            e.printStackTrace();
        }
        HSSFSheet sheet = wb.getSheetAt(0);
        Iterator<Row> it = sheet.iterator();

        NomenclatureWrapper currentNomenclatureWrapper = new NomenclatureWrapper();
        NomenclatureWrapper source=currentNomenclatureWrapper;

        int rowNumber=0;

        int currentPointValue=0,previousPointsValue=0;

        while (it.hasNext()) {
            Row row = it.next();
            Iterator<Cell> cells = row.iterator();

            boolean makingCategory=false;
            boolean firstCell=true;
            int columnNumber=0;
            while (cells.hasNext()) {
                Cell cell = cells.next();
                int cellType = cell.getCellType();

                if(rowNumber==357){
                    int i=0;
                    i++;
                }

                switch (cellType) {

                    case Cell.CELL_TYPE_STRING:
                        if((columnNumber==0)||(columnNumber==1))

                            makingCategory=true;

                        if((rowNumber==0)||(makingCategory)){
                            //создание категории
                            if(!cell.getStringCellValue().contains(".")) {
                                if(currentPointValue>previousPointsValue) {
                                    currentNomenclatureWrapper = currentNomenclatureWrapper.addNewChild();

                                }
                                else{
                                    if(currentNomenclatureWrapper.parent==null) currentNomenclatureWrapper = currentNomenclatureWrapper.addNewChild();
                                    else {
                                        for(int i=0;i<previousPointsValue-currentPointValue;i++){
                                            currentNomenclatureWrapper=currentNomenclatureWrapper.parent;
                                        }
                                        currentNomenclatureWrapper = currentNomenclatureWrapper.parent.addNewChild();
                                    }
                                }
                                currentNomenclatureWrapper.name = cell.getStringCellValue();
                                previousPointsValue=currentPointValue;
                            }
                            else{
                                currentPointValue=countChar(cell.getStringCellValue(),".");
                            }
                        }
                        else{
                            //установка полей дочерней категории
                            makingCategory=false;
                            if(firstCell) {
                                currentNomenclatureWrapper.addNewChild();
                                firstCell=false;

                            }
                            NomenclatureWrapper child=currentNomenclatureWrapper.getLast();

                            switch (columnNumber){

                                case 3: child.name=cell.getStringCellValue();break;
                                case 4: child.fullName=cell.getStringCellValue();break;
                                case 5: child.measureUnit=cell.getStringCellValue().substring(cell.getStringCellValue().indexOf("/")+1);break;

                            }

                        }
                        firstCell=false;
                        break;

                    case Cell.CELL_TYPE_NUMERIC:
                        if((columnNumber==0)||(columnNumber==1)) {
                            makingCategory = true;
                            currentPointValue=0;
                        }

                        else{
                            makingCategory=false;
                            if(firstCell) {
                                currentNomenclatureWrapper.addNewChild();
                                firstCell=false;

                            }
                            NomenclatureWrapper child=currentNomenclatureWrapper.getLast();
                            switch (columnNumber){
                                case 2: child.article=String.valueOf(cell.getNumericCellValue());break;
                                case 6: child.price=(float)cell.getNumericCellValue();break;
                            }
                            firstCell=false;
                        }

                        break;


                }
                columnNumber++;
            }


            rowNumber++;
        }

        return source;
    }

    int countChar(String source,String c){
        int result=0;
        String t=source;
        try {
            while (t.indexOf(c) != -1) {
                result++;
                t = t.substring(t.indexOf(c) + 1);
            }
        }
        catch (Exception e){
            return result;
        }
        return result;
    }

}

class NomenclatureWrapper{

    static RandomDataService randomDataService;
    static Map<String,MeasureUnits> measureUnitsMap;
    static Metadata metadata;

    List<NomenclatureWrapper> children=new ArrayList<>();
    NomenclatureWrapper parent;
    String name;
    String fullName;
    String article;
    float weight;
    String dimensions;
    String measureUnit;
    float price;

    Nomenclature selfReflection;

    NomenclatureWrapper getLast(){
        if(children.size()==0) {
            children.add(new NomenclatureWrapper());
            return children.get(0);
        }
        else return children.get(children.size()-1);
    }

    public NomenclatureWrapper addNewChild() {
        NomenclatureWrapper n=new NomenclatureWrapper();
        n.parent=this;
        children.add(n);
        return n;
    }

    Nomenclature createNomenclature(List<Nomenclature> nomenclatures){

        if(selfReflection!=null) return selfReflection;

        selfReflection=metadata.create(Nomenclature.class);

        if(name==null){
            if(fullName!=null)
            selfReflection.setName(fullName.substring(0,fullName.length()>49?49:fullName.length()));
            else selfReflection.setName("root");
        }
        else selfReflection.setName(name.length()>45?name.substring(0,45):name);
        if(fullName!=null)selfReflection.setFullName(fullName.length()>250?fullName.substring(0,250):fullName);
        if(article!=null)selfReflection.setArticle(article);
        else selfReflection.setArticle("");
        selfReflection.setIsgroup((children.size()!=0));
        if(parent!=null)selfReflection.setParent(parent.createNomenclature(nomenclatures));
        selfReflection.setUnit(measureUnitsMap.get(measureUnit));

        if(children.size()==0){
            List<Nomenclature> leftNomenclatures=new ArrayList<>();
            parent.children.forEach(item->{
                if(item!=this) leftNomenclatures.add(item.createNomenclature(nomenclatures));
            });

            int analogValues=0;
            if(randomDataService.getRandomBoolean(40)){
               if(leftNomenclatures.size()>0) analogValues= (int) randomDataService.getRandomLong(1,leftNomenclatures.size()>5? 5:leftNomenclatures.size());
            }

            List<Analogs> analogList=new ArrayList<>();
            for(int i=0;i<analogValues;i++){
                Analogs analogs=metadata.create(Analogs.class);
                analogs.setAnalog((Nomenclature)randomDataService.getRandomFromList(leftNomenclatures));
                analogs.setNomenclature(selfReflection);
                leftNomenclatures.remove(analogs.getAnalog());
                analogList.add(analogs);
            }
            selfReflection.setAnalogs(analogList);
        }

        nomenclatures.add(selfReflection);

        children.forEach(item->item.createNomenclature(nomenclatures));

        return selfReflection;
    }
}


