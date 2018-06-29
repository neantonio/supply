package com.groupstp.supply.service;

import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
/**
 * @author AntonLomako
 * удобный класс для генерации случайных данных
 */
@Service(RandomDataService.NAME)
public class RandomDataServiceBean implements RandomDataService {

    @Override
    public Object getRandomFromList(List source){
        int position= (int) (Math.random()*source.size());
        return source.get(position);
    }

    public Object getRandomFromList(List source,int beginIndex){

        return getRandomFromList(source,beginIndex,source.size()-1);
    }

    public Object getRandomFromList(List source,int beginIndex,int endIndex){
        if(source.size()<2) return source.get(0);
        if(beginIndex>source.size()-1) beginIndex= source.size()-1;
        if(endIndex>source.size()-1) endIndex= source.size()-1;
        return getRandomFromList(source.subList(beginIndex,endIndex));
    }


    @Override
    public long getRandomLong(long begin, long end){
        return (long)(Math.random()*(end-begin)+begin);
    }

    @Override
    public Date getRandomDate(int daysRangeFromToday){
        Date today=new Date();
        long msRange=daysRangeFromToday*24*60*60*1000;
        long begin=today.getTime()-msRange;
        long end = today.getTime()+msRange;
        return getRandomDate(new Date(begin),new Date(end));
    }

    @Override
    public Date getRandomDate(Date begin, Date end){
        long resultTime=getRandomLong(begin.getTime(),end.getTime());
        return  new Date(resultTime);

    }

    @Override
    public boolean getRandomBoolean(int trueProbability) {
        if ((trueProbability == 0)||(trueProbability > 100)) trueProbability= 50;
        return Math.random() * 100 < trueProbability;
    }

    public Object getRandomFromArr(Object[] source){
        int index=(int) (Math.random()*source.length);
        return source[index];
    }

}
