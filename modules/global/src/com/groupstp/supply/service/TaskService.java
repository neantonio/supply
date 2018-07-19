package com.groupstp.supply.service;


public interface TaskService {
    String NAME = "supply_TaskService";

    void beginEmailNotificationOnAnalysisTimeRunningOut();
}