package com.groupstp.supply.service;


import com.groupstp.supply.entity.QueriesPosition;
import com.groupstp.supply.entity.QueryPositionMovements;
import com.groupstp.supply.entity.Stages;


import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.function.Predicate;

/**
 * @author AntonLomako
 */
public interface StatisticsService {
    String NAME = "supply_StatisticsService";

    long getTimeOfPositionProcessing(QueriesPosition position);
    long getTimeOfPositionProcessing(List<QueryPositionMovements> positionMovementsList);
    long getStageDuration(QueryPositionMovements movement,Date now);
    long getStageDuration(QueryPositionMovements movement);
    int getReturnsValueForPosition(QueriesPosition position);
    int getReturnsValueForPosition(List<QueryPositionMovements> positionMovementsList);
    double getPriceChangeOfNMP(QueriesPosition position);
    double getPriceCompareWithKPI(QueriesPosition position);
    int getTimeCompareWithKPI(QueriesPosition position);

    /**
     * возвращает map, где ключ:этап, значение: отфильтрованная по условию коллеция, относящаяся к этапу
     * @param movementsCollection коллекция записей о перемещении позиций
     * @param filterCondition    условие по которому фильтруется коллекця
     * @return
     */
    Map<Stages,Integer> getStatisticsOfStages(Collection<QueryPositionMovements> movementsCollection, Predicate<QueryPositionMovements> filterCondition);

    /**
     * определения цвета в диаграмме в зависимости от этапа
     * @param stage этап
     * @return
     */
    String getColor(Stages stage);

    /**
     * определяет просроченна ли позиция по записи в QueryPositionMovements
     * @param qpm
     * @return
     */
    boolean isMovementOverdue(QueryPositionMovements qpm);
}