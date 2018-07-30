package com.groupstp.supply.service;


import com.google.gson.JsonObject;
import com.groupstp.supply.entity.*;

import java.util.Collection;
import java.util.List;
import java.util.Map;

public interface SuggestionService {
    String NAME = "supply_SuggestionService";

    String makeTokenForPositionsAndSupplier(Collection<QueriesPosition> positionCollection, Suppliers supplier);

    Collection<QueriesPosition> getPositionsForToken(String token) ;

    Map<Suppliers,Map<Company,List<QueriesPosition>>> makeSuggestionRequestMap(Collection<QueriesPosition> positionCollection);

    Map<Suppliers,Map<Company,List<QueriesPosition>>> makeSuggestionRequestMap(Collection<QueriesPosition> positionCollection, boolean ignoreAlreadySend);

    void processRequestSending(Map<Suppliers, Map<Company, List<QueriesPosition>>> mapToSend, Employee employee);

    void processSuggestion(String token, JsonObject[] jsonObjects);

    List<QueriesPosition> getPositionListWithoutSupplier();

    List<PositionSupplier> getWithRequestAlreadySend();

    List<QueriesPosition> getJustSendPositions();
}