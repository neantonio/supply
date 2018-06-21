package com.groupstp.supply.service;

import java.util.Date;
import java.util.List;

/**
 * Created by 79167 on 13.06.2018.
 */
public interface RandomDataService {
    String NAME = "supply_RandomDataService";

    Object getRandomFromList(List source);

    long getRandomLong(long begin, long end);

    Date getRandomDate(int daysRangeFromToday);

    Date getRandomDate(Date begin, Date end);

    boolean getRandomBoolean(int trueProbability);

    Object getRandomFromArr(Object[] source);
}
