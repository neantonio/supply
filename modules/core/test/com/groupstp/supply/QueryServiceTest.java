package com.groupstp.supply;

import com.groupstp.supply.entity.*;
import com.groupstp.supply.service.*;
import mockit.Expectations;
import mockit.Injectable;
import mockit.Mocked;
import mockit.Tested;
import mockit.integration.junit4.JMockit;
import org.junit.Test;
import org.junit.runner.RunWith;

import javax.inject.Inject;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.TimeUnit;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.fail;

/**
 * Created by 79167 on 21.06.2018.
 */
@RunWith(JMockit.class)
public class QueryServiceTest {

    @Tested
    QueryServiceBean queryService;

    @Mocked
    @Injectable
    QueryDaoService queryDaoService;

    @Injectable
    WorkflowService workflowService;

    @Inject
    DataBaseTestContentService testContentService;



    @Test
    public void serviceReturnsAllAnalogsOfNomenclatureInQueriesPositionTest() {

        QueriesPosition position=new QueriesPosition();
        Nomenclature n1=new Nomenclature();
        Nomenclature n2=new Nomenclature();
        Nomenclature n3=new Nomenclature();

        Analogs a12=new Analogs();
        Analogs a13=new Analogs();
        a12.setNomenclature(n1);
        a12.setAnalog(n2);
        a13.setNomenclature(n1);
        a13.setAnalog(n3);
        n1.setAnalogs(Arrays.asList(a12,a13));

        position.setNomenclature(n1);

        List<Nomenclature> analogs = queryService.getAnalogsOfPosition(position);

        assertEquals( 2,analogs.size());
    }

    @Test
    public void serviceReturnAllNomenclatureOfQueryTest(){

        Query query=new Query();


        QueriesPosition qp1=new QueriesPosition();
        QueriesPosition qp2=new QueriesPosition();
        QueriesPosition qp3=new QueriesPosition();
        List<QueriesPosition> queriesPositions=Arrays.asList(qp1,qp2,qp3);

        Nomenclature n1=new Nomenclature();
        Nomenclature n2=new Nomenclature();
        Nomenclature n3=new Nomenclature();

        qp1.setNomenclature(n1);
        qp2.setNomenclature(n2);
        qp3.setNomenclature(n3);

        new Expectations() {{
            queryDaoService.getQueriesPositionByQuery(query);
            result = queriesPositions;
        }};

        assertEquals(3,queryService.getQueryNomenclature(query).size());
    }

    @Test
    public void serviceCalculateCorrectStatusOfQueryTest(){
        Query query=new Query();


        QueriesPosition qp1=new QueriesPosition();
        QueriesPosition qp2=new QueriesPosition();
        QueriesPosition qp3=new QueriesPosition();
        List<QueriesPosition> queriesPositions=Arrays.asList(qp1,qp2,qp3);
        QueryPositionMovements qpm= new QueryPositionMovements();
        QueryPositionMovements overdueQpm= new QueryPositionMovements();

        new Expectations() {{
            queryDaoService.getQueriesPositionByQuery(withNotNull());
            result = queriesPositions;

            queryDaoService.getTimeForPositionStage(withNotNull());
            result=10;

            queryDaoService.getQueryPositionMovement(withNotNull());
            result= Arrays.asList(qpm);
        }};

        assertEquals("нет флага inWork, статус должен быть new", QueryStatus.NEW_ITEM,queryService.getQueryStatus(query));

        //проверим выдачу статуса в работе
        //все заявки как будто перешли на текущий этап только что
        qp1.setCurrentStage(Stages.New);
        qp2.setCurrentStage(Stages.New);
        qp3.setCurrentStage(Stages.New);
        qpm.setCreateTs(new Date());
        query.setInWork(true);

        assertEquals("нет ни одной позиции в работе, статус должен быть new",QueryStatus.NEW_ITEM,queryService.getQueryStatus(query));

        qp1.setCurrentStage(Stages.NomControl);
        qp2.setCurrentStage(Stages.Abortion);
        qp3.setCurrentStage(Stages.Done);
        assertEquals("есть одна позиция в работе а остальные завершены, статус должен быть in_work",
                QueryStatus.IN_WORK,queryService.getQueryStatus(query));

        //проверим выдачу статуса просрочено
        //пусть одна заявка будет просроченной
        Date today=new Date();
        overdueQpm.setCreateTs(new Date(today.getTime()-20*60*60*1000));

        //для начала просроченной будет отклоненная заявка
        new Expectations(){{
            queryDaoService.getQueryPositionMovement(withNotNull());
            returns( Arrays.asList(qpm),Arrays.asList(overdueQpm),Arrays.asList(qpm));
        }
        };
        assertEquals("есть одна позиция в работе , есть завершенная позиция, которая просрочена и просто завершенная позиция, статус должен быть in_work",
                QueryStatus.IN_WORK,queryService.getQueryStatus(query));

        //теперь просрочена позиция в работе
        new Expectations(){{
            queryDaoService.getQueryPositionMovement(withNotNull());
            returns( Arrays.asList(overdueQpm),Arrays.asList(overdueQpm),Arrays.asList(qpm));
        }
        };
        assertEquals("есть просроченная позиция в работе , есть просроченная завершенная позиция и просто завершенная позиция, статус должен быть overdue",
                QueryStatus.OVERDUE,queryService.getQueryStatus(query));


        //все позиции завершены
        qp1.setCurrentStage(Stages.Abortion);
        assertEquals("все позиции завершены? среди них есть просроченные, статус должен быть done",
                QueryStatus.DONE,queryService.getQueryStatus(query));

    }

    @Test
    public void serviceCalculateCorrectTimePositionBeingOnCurrentStageAndThrowsExceptionIfDataIncomplete(){
        QueryPositionMovements qpm= new QueryPositionMovements();
        new Expectations() {{

            queryDaoService.getQueryPositionMovement(withNotNull());
            returns( Arrays.asList(qpm),null,new ArrayList<>());
        }};

        long timePassed =60*60*1000;
        Date today=new Date();
        qpm.setCreateTs(new Date(today.getTime()-timePassed));

        //т.к время в методе получается заново, то считаем с погрешностью в секунду
        assertEquals("проверка времени при наличии записи в базе",
                Math.round(((double)timePassed)/1000),
                Math.round(((double)queryService.getPassedTimeFromStageBegin(new QueriesPosition()))/1000));

        try{
           queryService.getPassedTimeFromStageBegin(new QueriesPosition());
           fail("QueryDaoService вернул null, DataIncompleteException не брошено");
        }
        catch (DataIncompleteException e){
        }
        catch (Exception ee){
            fail("QueryDaoService вернул null, брошено не описанное исключение");
        }

        try{
            queryService.getPassedTimeFromStageBegin(new QueriesPosition());
            fail("QueryDaoService вернул пустой лист, DataIncompleteException не брошено");
        }
        catch (DataIncompleteException e){
            return;
        }
        catch (Exception ee){
            fail("QueryDaoService вернул пустой лист, брошено не описанное исключение");
        }
    }

    @Test
    public void serviceCorrectlyBeginQueryProcessingAndReturnListOfQueriesPositionThoseCausedError(){
        //// TODO: 23.06.2018 later
    }

    @Test
    public void serviceCalculateCorrectPlanedExecutionTimeForQueriesPosition(){

        StageTerm term=new StageTerm();
        QueryPositionMovements qpm= new QueryPositionMovements();

        term.setTime(24);

        QueryWorkflowDetail d1=new QueryWorkflowDetail();
        d1.setSourceStage(Stages.NomControl);
        d1.setDestStage(Stages.StoreControl);
        d1.setPriority(1);
        QueryWorkflowDetail d2=new QueryWorkflowDetail();
        d2.setSourceStage(Stages.StoreControl);
        d2.setDestStage(Stages.Analysis);
        d2.setPriority(1);
        QueryWorkflowDetail d3=new QueryWorkflowDetail();
        d3.setSourceStage(Stages.Analysis);
        d3.setDestStage(Stages.SupSelection);
        d3.setPriority(1);
        QueryWorkflowDetail d4=new QueryWorkflowDetail();
        d4.setSourceStage(Stages.SupSelection);
        d4.setDestStage(Stages.Bills);
        d4.setPriority(1);
        QueryWorkflowDetail d5=new QueryWorkflowDetail();
        d5.setSourceStage(Stages.Bills);
        d5.setDestStage(Stages.Done);
        d5.setPriority(1);

        //добавим несколько деталей с меньшим приоритетом
        QueryWorkflowDetail d22=new QueryWorkflowDetail();
        d22.setSourceStage(Stages.StoreControl);
        d22.setDestStage(Stages.Bills);
        d22.setPriority(2);
        QueryWorkflowDetail d42=new QueryWorkflowDetail();
        d42.setSourceStage(Stages.SupSelection);
        d42.setDestStage(Stages.Done);
        d42.setPriority(2);

        Query query=new Query();
        QueryWorkflow workflow=new QueryWorkflow();
        QueriesPosition qp=new QueriesPosition();

        qp.setCurrentStage(Stages.NomControl);
        qp.setQuery(query);
        query.setWorkflow(workflow);
        workflow.setDetails(Arrays.asList(d1,d2,d3,d4,d5,d22,d42));

        qpm.setCreateTs(new Date());

        new Expectations() {{
            queryDaoService.getStageTermForStage(withNotNull(),withNull());
            result = term;

            queryDaoService.getQueryPositionMovement(withNotNull());
            result= Arrays.asList(qpm);
        }};

        Calendar calendar=new GregorianCalendar();
        calendar.set(Calendar.MILLISECOND,0);
        calendar.set(Calendar.SECOND,0);
        calendar.set(Calendar.MINUTE,0);

        Calendar calendarToUse=new GregorianCalendar();
        calendarToUse.setTime(calendar.getTime());
        calendarToUse.set(Calendar.HOUR_OF_DAY,0);

        calendarToUse.set(Calendar.DAY_OF_YEAR,calendarToUse.get(Calendar.DAY_OF_YEAR)+5);

        assertEquals("неверно рассчитано общее плановое время исполнения заявки",calendarToUse.getTime(),queryService.getExecutionTimeForQueriesPosition(qp,false));

        //изменим стадию
        qp.setCurrentStage(Stages.StoreControl);
        calendarToUse.setTime(calendar.getTime());
        calendarToUse.set(Calendar.HOUR_OF_DAY,0);

        calendarToUse.set(Calendar.DAY_OF_YEAR,calendarToUse.get(Calendar.DAY_OF_YEAR)+4);

        assertEquals("неверно рассчитано общее плановое время исполнения заявки",calendarToUse.getTime(),queryService.getExecutionTimeForQueriesPosition(qp,false));
    }

    //10:00 06.03.2018 - 12:00 10.03.2018
    @Test
    public void getWorkTimeTestFirst() {
        Calendar calendarStart = Calendar.getInstance();
        calendarStart.set(2018, 2, 6, 10, 0, 0);
        Calendar calendarEnd = Calendar.getInstance();
        calendarEnd.set(2018, 2, 10, 12,0, 0);
        LocalTime startTimeWork = LocalTime.of(8,0);
        LocalTime endTimeWork = LocalTime.of(17,0);
        LocalTime lunchTime = LocalTime.of(12, 0);
        int lunchDuration = 60;//Продолжительность обеда 1 час

        new Expectations() {
            {
                queryDaoService.getHoliday(withNotNull());
                Holiday holiday7 = new Holiday();
                holiday7.setWorkingHours(-1);
                Holiday holiday8 = new Holiday();
                holiday8.setWorkingHours(0);
                returns(null, holiday7, holiday8, null);
            }};

        long workTime = queryService.getWorkTime(calendarStart.getTime(), calendarEnd.getTime(), startTimeWork, endTimeWork, lunchTime, lunchDuration);
        assertEquals(TimeUnit.MILLISECONDS.toHours(workTime), 21);
    }

    //10:00 08.03.2018 - 12:00 08.03.2018
    @Test
    public void getWorkTimeTestSecond() {
        Calendar calendarStart = Calendar.getInstance();
        calendarStart.set(2018, 2, 8, 10, 0, 0);
        Calendar calendarEnd = Calendar.getInstance();
        calendarEnd.set(2018, 2, 8, 12,0, 0);
        LocalTime startTimeWork = LocalTime.of(8,0);
        LocalTime endTimeWork = LocalTime.of(17,0);
        LocalTime lunchTime = LocalTime.of(12, 0);
        int lunchDuration = 60;//Продолжительность обеда 1 час
        new Expectations() {
            {
                queryDaoService.getHoliday(withNotNull());
                Holiday holiday8 = new Holiday();
                holiday8.setWorkingHours(0);
                result = holiday8;
            }};

        long workTime = queryService.getWorkTime(calendarStart.getTime(), calendarEnd.getTime(), startTimeWork, endTimeWork, lunchTime, lunchDuration);
        assertEquals(TimeUnit.MILLISECONDS.toHours(workTime), 0);
    }

    //08:00 16.07.2018 - 23:59:00 22.07.2018
    @Test
    public void getWorkTimeTestThird() {
        Calendar calendarStart = Calendar.getInstance();
        calendarStart.set(2018, 6, 16, 8, 0, 0);
        Calendar calendarEnd = Calendar.getInstance();
        calendarEnd.set(2018, 6, 22, 23,59, 0);
        LocalTime startTimeWork = LocalTime.of(8,0);
        LocalTime endTimeWork = LocalTime.of(17,0);
        LocalTime lunchTime = LocalTime.of(12, 0);
        int lunchDuration = 60;//Продолжительность обеда 1 час
        new Expectations() {
            {
                queryDaoService.getHoliday(withNotNull());
                result = null;
            }};
        long workTime = queryService.getWorkTime(calendarStart.getTime(), calendarEnd.getTime(), startTimeWork, endTimeWork, lunchTime, lunchDuration);
        assertEquals(TimeUnit.MILLISECONDS.toHours(workTime), 40);
    }


    //
    @Test
    public void getWorkTimeTestFour() {
        Calendar calendarStart = Calendar.getInstance();
        calendarStart.set(2018, 6, 16, 22, 0, 0);
        Calendar calendarEnd = Calendar.getInstance();
        calendarEnd.set(2018, 6, 18, 8,59, 0);
        LocalTime startTimeWork = LocalTime.of(8,0);
        LocalTime endTimeWork = LocalTime.of(17,0);
        LocalTime lunchTime = LocalTime.of(12, 0);
        int lunchDuration = 60;//Продолжительность обеда 1 час
        new Expectations() {
            {
                queryDaoService.getHoliday(withNotNull());
                result = null;
            }};
        long workTime = queryService.getWorkTime(calendarStart.getTime(), calendarEnd.getTime(), startTimeWork, endTimeWork, lunchTime, lunchDuration);
        long w = TimeUnit.MILLISECONDS.toMinutes(workTime);
        assertEquals(TimeUnit.MILLISECONDS.toMinutes(workTime), 59+480);

    }
}

