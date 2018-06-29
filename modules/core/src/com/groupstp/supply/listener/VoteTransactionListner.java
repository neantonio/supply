package com.groupstp.supply.listener;

import com.haulmont.cuba.core.entity.Entity;
import com.haulmont.cuba.core.listener.AfterCompleteTransactionListener;
import org.springframework.stereotype.Component;

import java.util.Collection;

@Component("supply_VoteTransactionListner")
public class VoteTransactionListner implements AfterCompleteTransactionListener {


    @Override
    public void afterComplete(boolean committed, Collection<Entity> detachedEntities) {

    }


}