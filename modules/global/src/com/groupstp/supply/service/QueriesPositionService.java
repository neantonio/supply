package com.groupstp.supply.service;


import com.groupstp.supply.entity.QueriesPosition;

import java.util.Set;
import java.util.UUID;

public interface QueriesPositionService {
    String NAME = "supply_QueriesPositionService";


    QueriesPosition copyPosition(QueriesPosition position);


    QueriesPosition splitPosition(QueriesPosition position);

    void movePositionsToCancelStage(Set<QueriesPosition> positions);

    void movePositions(Set<QueriesPosition> positions) throws Exception;

    void sendEmail(Set<QueriesPosition> setPosition);

    void setVote(Set<QueriesPosition> setPosition) throws Exception;

    //void loadPositionsByBills(GroupDatasource<QueriesPosition, UUID> dsBills)


}