package com.groupstp.supply.service;

import com.groupstp.supply.entity.QueriesPosition;
import com.haulmont.cuba.core.entity.KeyValueEntity;
import com.haulmont.cuba.core.global.DataManager;
import com.haulmont.cuba.core.global.ValueLoadContext;
import org.springframework.stereotype.Service;

import javax.inject.Inject;
import java.util.List;

@Service(VoteService.NAME)
public class VoteServiceBean implements VoteService {
    @Inject
    private DataManager dataManager;

    public void setVoteForPosition(QueriesPosition qp) throws Exception {
        qp = dataManager.reload(qp, "queriesPosition-Comission");
        String query = "select sum(v.weight), v.suggestion from supply$Vote v " +
                "where v.position.id=:position " +
                "group by v.suggestion " +
                "order by sum(v.weight) desc";
        ValueLoadContext ctx = ValueLoadContext.create().setQuery(ValueLoadContext.createQuery(query)
                .setParameter("position", qp))
                .addProperty("maxsum")
                .addProperty("suggestion");
        List<KeyValueEntity> res = dataManager.loadValues(ctx);
        if(res.size()<1)
            throw new Exception("Невозможно определить победителя");
        qp.setVoteResult(res.get(0).getValue("suggestion"));
        dataManager.commit(qp);
    }

}