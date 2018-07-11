package com.groupstp.supply.service;


import com.groupstp.supply.entity.QueriesPosition;

import java.util.Date;
import java.util.List;

public interface PaymentTableService {
    String NAME = "supply_PaymentTableService";

    List<QueriesPosition> getItems(Date start, Date end);
}