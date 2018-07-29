package com.groupstp.supply.service;

import com.groupstp.supply.entity.QueriesPosition;
import com.groupstp.supply.entity.Stages;
import com.haulmont.cuba.core.app.EmailService;
import com.haulmont.cuba.core.global.AppBeans;
import com.haulmont.cuba.core.global.EmailInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.core.task.TaskExecutor;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.InitBinder;

import javax.inject.Inject;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ScheduledFuture;

/**
 * @author AntonLomako
 */
@Service(TaskService.NAME)
public class TaskServiceBean implements TaskService {


    private long notifyTimeOffset=2*60*60*1000;  //2h
    private String emailConsumer="cubatestlomako@gmail.com";

    private ScheduledFuture notificationOnAnalysisRunningOutTask;

    private List<QueriesPosition> latestPositionCalledNotification=new ArrayList<>();

    @Inject
    private QueryDaoService queryDaoService;

    @Inject
    private QueryService queryService;

    @Inject
    private WorkflowService workflowService;

    @Inject
    private EmailService emailService;

    /**
     * проверяет позиции на этапе аналити, если время нах-я позиции на этапе скоро заканчивается,
     * то отправляется уведомление по почте, если уже закончилось, то позиция переводится дадьше
     */
    @Override
    public void checkAnalysisTime(){

        //накапливаем  позиции во время проверки. потом одним письмом все отправляем
        List <QueriesPosition> positionsToNotify=new ArrayList<QueriesPosition>();


        List<QueriesPosition> positionsWithExpiredTime=new ArrayList<>();
        List<QueriesPosition> positions=queryDaoService.getQueryPositionsByStage(Stages.Analysis);
        positions.forEach(item->{
            if(queryService.getPassedTimeFromStageBegin(item)<queryDaoService.getTimeForPositionStage(item)*60*60*1000) {
                if (queryService.getPassedTimeFromStageBegin(item) - queryDaoService.getTimeForPositionStage(item) * 60 * 60 * 1000 < notifyTimeOffset) {

                    //если во аремя предыдущей проверки по позиции было уведомление, она будет в этом списке
                    if (!latestPositionCalledNotification.contains(item)) {
                        positionsToNotify.add(item);
                        latestPositionCalledNotification.add(item);
                    }
                }
            }
            else{
                //если позиция просрочилась,переводим ее на следующий этап и убираем ее из списка latestPositionCalledNotification
                latestPositionCalledNotification.remove(item);
                positionsWithExpiredTime.add(item);
                try {
                    workflowService.movePosition(item);
                } catch (Exception e) {
                    //// TODO: 19.07.2018 надо как-то уведомить, что позиция не ушла

                }
            }
        });

        String positionsNames="";
        for(QueriesPosition position:positionsToNotify){
            positionsNames=positionsNames+position.getQueriesPositionName()+"\n";
        }
        if(positionsToNotify.size()>0){
            //// TODO: 19.07.2018 жуткий хардкод
            sendEmail(emailConsumer,"Таймаут аналиники","Внимание! Переод аналитики заканчивается у позиций: "+"\n"+positionsNames);
        }

    }


    private void sendEmail(String target,String theme,String content){
        EmailInfo emailInfo = new EmailInfo(
                target,
                theme,
                null,
                content,
                null
        );
        emailService.sendEmailAsync(emailInfo);
    }

}