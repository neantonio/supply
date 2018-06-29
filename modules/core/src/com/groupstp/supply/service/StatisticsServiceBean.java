package com.groupstp.supply.service;

import com.groupstp.supply.entity.QueriesPosition;
import com.groupstp.supply.entity.QueryPositionMovements;
import com.groupstp.supply.entity.StageTerm;
import com.groupstp.supply.entity.Stages;
import org.springframework.stereotype.Service;

import javax.inject.Inject;
import java.util.*;
import java.util.function.Predicate;
import java.util.stream.Collectors;

/**
 * @author AntonLomako
 */

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

    @Override
    public Map<Stages, Integer> getStatisticsOfStages(Collection<QueryPositionMovements> movementsCollection,
                                                      Predicate<QueryPositionMovements> filterCondition) {
        Map<Stages, Integer> result=new HashMap<>();
        List<QueryPositionMovements> filteredCollection= movementsCollection.stream().filter(filterCondition).collect(Collectors.toList());

        filteredCollection.forEach(item->{
            if(result.get(item.getStage())!=null){
                result.put(item.getStage(),result.get(item.getStage())+1);
            }
            else {
                result.put(item.getStage(),0);
            }
        });
        return result;
    }

    private List <String> colors=Arrays.asList("#FF6600", "#FCD202", "#B0DE09", "#0D8ECF", "#2A0CD0", "#CD0D74",
            "#CC0000", "#00CC00", "#0000CC", "#DDDDDD", "#999999", "#333333", "#990000");
    @Override
    public String getColor(Stages stage) {
        int stageIndex= Arrays.asList(Stages.values()).indexOf(stage);

        if(stageIndex<colors.size()) return colors.get(stageIndex);
        else return "#FF66FF";
    }

    @Override
    public boolean isMovementOverdue(QueryPositionMovements qpm) {
        Date endDate=qpm.getFinishTS()==null? new Date():qpm.getFinishTS();
        StageTerm stageTerm=queryDaoService.getStageTermForStage(qpm.getStage(),qpm.getPosition().getQuery().getUrgency());
        return (endDate.getTime()-qpm.getCreateTs().getTime())>stageTerm.getTime()*60*60*1000;
    }
}