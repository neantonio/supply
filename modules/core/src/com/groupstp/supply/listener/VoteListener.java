package com.groupstp.supply.listener;

import com.groupstp.supply.entity.QueriesPosition;
import com.groupstp.supply.service.WorkflowService;
import org.slf4j.Logger;
import org.springframework.stereotype.Component;
import com.haulmont.cuba.core.listener.AfterInsertEntityListener;
import java.sql.Connection;
import com.groupstp.supply.entity.Vote;
import com.haulmont.cuba.core.listener.AfterUpdateEntityListener;

import javax.inject.Inject;

@Component("supply_VoteListener")
public class VoteListener implements AfterInsertEntityListener<Vote>, AfterUpdateEntityListener<Vote> {

    @Inject
    private Logger log;

    @Override
    public void onAfterInsert(Vote entity, Connection connection) {
        checkComissionFinished(entity);
    }

    @Override
    public void onAfterUpdate(Vote entity, Connection connection) {
        checkComissionFinished(entity);
    }

    @Inject
    private WorkflowService workflowService;

    public void checkComissionFinished(Vote v)
    {
        QueriesPosition qp = v.getPosition();
        try
        {
            workflowService.movePosition(qp);
        }
        catch (Exception e)
        {
            log.debug(e.getMessage());
        }
    }
}