package com.groupstp.supply.service;


import com.groupstp.supply.entity.QueriesPosition;

public interface VoteService {
    String NAME = "supply_VoteService";
    public void setVoteForPosition(QueriesPosition qp)throws Exception;
}