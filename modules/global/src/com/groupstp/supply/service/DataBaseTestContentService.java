package com.groupstp.supply.service;


import com.groupstp.supply.entity.*;
import com.haulmont.cuba.security.entity.Group;

import java.util.Date;
import java.util.List;
import java.util.Map;
/**
 * @author AntonLomako
 */
public interface DataBaseTestContentService {
    String NAME = "supply_DataBaseTestContentService";


    List <Company>createCompanies(List<String> nameList, List<Company> resultList, Object em);

    List<Division> createDivisions(List<String> nameList, List<Company> companyList, List<Division> resultList, Object emo);

    List<Store> createStores(List<String> nameList, List<Division> divisionList, List<Store> resultList, Object emo);

    List<MeasureUnits> createMeasureUnit(Map<String, String> unitMap, List<MeasureUnits> resultList, Map<String, MeasureUnits> resultMap, Object emo);

    List<Nomenclature> createNomenclature(String priceListFileName, List<Nomenclature> resultList, Map<String, MeasureUnits> unitsMap, Object emo);

    List<Group> createGroups(List<String> nameList, List<Group> resultList, Object emo);

    List<Employee> createEmployees(List<Group> groupList, List<Employee> resultList, int minValue, int maxValue, Object emo);

    List<Urgency> createUrgencies(List<String> nameList, List<Urgency> resultList, Object emo);

    List<StageTerm> createStageTerms(List<Urgency> urgencyList, List<StageTerm> resultList, int minTimeValue, int maxTimeValue, Object emo);

    List<QueryWorkflow> createRandomWorkflow(List<String> nameList, List<QueryWorkflow> resultList, Object emo);

    List<Query> createQueries(List<Company> companyList,
                              List<Division> divisionList,
                              List<Store> storeList,
                              List<Employee> employeeList,
                              List<Urgency> urgencyList,
                              List<QueryWorkflow> workflowList,
                              List<Query> resultList,
                              int minValue,
                              int maxValue,
                              Date creationTime,
                              Object emo);

    List<QueriesPosition> createQueriesPositions(List<Query> queryList,
                                                 List<Nomenclature> nomenclatureList,
                                                 List<QueriesPosition> resultList,
                                                 int minValuePerQuery,
                                                 int maxValuePerQuery,
                                                 Object emo);

    void createEntities();
    void beginBusinessProcess();
}