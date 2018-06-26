package com.groupstp.supply.service;

import com.groupstp.supply.entity.QueriesPosition;
import com.groupstp.supply.entity.QueryPositionMovements;
import org.springframework.stereotype.Service;

import javax.inject.Inject;
import java.util.Date;
import java.util.List;

@Service(StatisticsService.NAME)
public class StatisticsServiceBean implements StatisticsService {

    @Inject
    QueryDaoService queryDaoService;

    @Override
    public long getTimeOfPositionProcessing(QueriesPosition position) {
        return getTimeOfPositionProcessing(queryDaoService.getQueryPositionMovement(position));
    }

    @Override
    public long getTimeOfPositionProcessing(List<QueryPositionMovements> positionMovementsList) {
        long result=0;
        Date now=new Date();
        for(QueryPositionMovements item:positionMovementsList){
            result+=getStageDuration(item,now);
        };
        return result;

    }

    @Override
    public long getStageDuration(QueryPositionMovements movement,Date now) {
        Date finish;
        if(movement.getFinishTS()==null) finish=now;
        else finish=movement.getFinishTS();
        return finish.getTime()-movement.getCreateTs().getTime();
    }

    @Override
    public long getStageDuration(QueryPositionMovements movement) {
        return getStageDuration(movement,new Date());
    }

    @Override
    public int getReturnsValueForPosition(QueriesPosition position) {
        return getReturnsValueForPosition(queryDaoService.getQueryPositionMovement(position));
    }

    @Override
    public int getReturnsValueForPosition(List<QueryPositionMovements> positionMovementsList) {
        int result=0;
        for(QueryPositionMovements item1:positionMovementsList) {
            for(QueryPositionMovements item2:positionMovementsList) {
                if(item1!=item2) if(item1.getStage()==item2.getStage()) result++;
            }
        }
        return result;
    }

    @Override
    public double getPriceChangeOfNMP(QueriesPosition position) {
        if(position.getVoteResult()==null) return 0;
        return position.getStartMinimalPrice()-position.getVoteResult().getPrice();
    }

    @Override
    public double getPriceCompareWithKPI(QueriesPosition position) {
        return 0;
    }

    @Override
    public int getTimeCompareWithKPI(QueriesPosition position) {
        return 0;
    }
}