package com.groupstp.supply.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;

@Service(TaskService.NAME)
public class TaskServiceBean implements TaskService {
//
    //ThreadPoolTaskExecutor taskExecutor = (ThreadPoolTaskExecutor) ApplicationContext.("taskExecutor");
@Autowired
private ApplicationContext applicationContext;
    @Autowired
    private ThreadPoolTaskExecutor threadPoolTaskExecutor;
//
//    private long positionCheckTimeoutMs=10*60*1000;   //10 min
//    private String emailConsumer;
//
//    @Inject
//    private QueryDaoService queryDaoService;
//
//    @Inject
//    private QueryService queryService;



    @Override
    public void beginEmailNotificationOnAnalysisTimeRunningOut(){

//        taskExecutor.execute(()->{
//            List<QueriesPosition> positions=queryDaoService.getQueryPositionsByStage(Stages.Analysis);
//
//        });
    }

}