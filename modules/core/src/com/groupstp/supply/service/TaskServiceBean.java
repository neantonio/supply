package com.groupstp.supply.service;

import com.groupstp.supply.entity.QueriesPosition;
import com.groupstp.supply.entity.Stages;
import com.haulmont.cuba.core.global.AppBeans;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.core.task.TaskExecutor;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.InitBinder;

import javax.inject.Inject;
import java.util.List;

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