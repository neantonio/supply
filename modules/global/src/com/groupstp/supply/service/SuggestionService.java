package com.groupstp.supply.service;


import com.groupstp.supply.entity.Company;
import com.groupstp.supply.entity.Employee;
import com.groupstp.supply.entity.QueriesPosition;
import com.groupstp.supply.entity.Suppliers;

import java.util.Collection;
import java.util.List;
import java.util.Map;

public interface SuggestionService {
    String NAME = "supply_SuggestionService";

    String makeTokenForPositions(Collection<QueriesPosition> positionCollection);

    Collection<QueriesPosition> getPositionsForToken(String token) ;

    Map<Suppliers,Map<Company,List<QueriesPosition>>> makeSuggestionRequestMap(Collection<QueriesPosition> positionCollection);

    Map<Suppliers,Map<Company,List<QueriesPosition>>> makeSuggestionRequestMap(Collection<QueriesPosition> positionCollection, boolean ignoreAlreadySend);

    void processRequestSending(Map<Suppliers, Map<Company, List<QueriesPosition>>> mapToSend, Employee employee);

    List<QueriesPosition> getPositionListWithoutSupplier();

    List<QueriesPosition> getWithRequestAlreadySend();
}