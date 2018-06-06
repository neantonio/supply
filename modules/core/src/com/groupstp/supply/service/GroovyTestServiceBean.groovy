package com.groupstp.supply.service

import com.haulmont.cuba.core.entity.KeyValueEntity
import com.haulmont.cuba.core.global.AppBeans
import com.haulmont.cuba.core.global.DataManager
import com.haulmont.cuba.core.global.ValueLoadContext
import org.springframework.stereotype.Service

import javax.inject.Inject
import javax.xml.crypto.Data

@Service(GroovyTestService.NAME)
public class GroovyTestServiceBean implements GroovyTestService {


    boolean testAnalisys(position)
    {
        DataManager dataManager = AppBeans.get(DataManager.class)
        List errors = []
        String query = 'select COUNT(e.position) from supply$PositionSupplier e where e.position.id=:position'
        ValueLoadContext ctx = ValueLoadContext.create()
        ctx.setQuery(
                ValueLoadContext.createQuery(query)
                        .setParameter("position",position))
                .addProperty("count")
        List res = dataManager.loadValues(ctx)
        if(res.get(0).getValue("count")<3)
            errors << "Подобрано меньше 3 поставщиков"

        query = 'select e.posSup, COUNT(e) from supply$SuppliersSuggestion e ' +
                'where e.posSup.position.id=:position ' +
                'and e.quantity<>0 ' +
                'and e.term<>0 ' +
                'and e.price<>0 ' +
                'group by e.posSup'

        ctx = ValueLoadContext.create();
        ctx.setQuery(ctx.createQuery(query).setParameter("position", position));
        ctx.addProperty("positionsSupplier").addProperty("count");
        res = dataManager.loadValues(ctx);
        def count=0
        for(r in res)
        {
            if(r.getValue("count")<1)
                errors "Для поставщика "+r.getValue("positionsSupplier").getSupplier()+" не заданы предложения"
            count+=r.getValue("count")
        }
        if(count<3)
            errors << "Общее количество предложений меньше 3"
        if(errors.size()>0)
            return errors.join('\n')
        return true
    }

    boolean testScript(Object position) {
        return testAnalisys(position)
    }
}