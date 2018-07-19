package com.groupstp.supply.service;

import com.groupstp.supply.entity.*;
import org.springframework.stereotype.Service;

import javax.inject.Inject;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

/**
 * логика операций с заявками, позициями и связанными с ними ущностями
 * @author AntonLomako
 */
@Service(QueryService.NAME)
public class QueryServiceBean implements QueryService {



    @Inject
    private WorkflowService workflowService;

    @Inject
    private QueryDaoService queryDaoService;


    @Override
    public List<Nomenclature> getAnalogsOfPosition(QueriesPosition position) {
        List<Analogs> analogs =position.getNomenclature().getAnalogs();
        List<Nomenclature> result=new ArrayList<>();
        analogs.forEach(item->result.add(item.getAnalog()));
        return result;
    }

    @Override
    public List<Nomenclature> getQueryNomenclature(Query query){
        List<Nomenclature> result=new ArrayList<>();
        for(QueriesPosition qp:queryDaoService.getQueriesPositionByQuery(query)){
            if(qp.getNomenclature()!=null)
                result.add(qp.getNomenclature());
        }
        return result;
    }


    /**
     * вычисляет статус завки на основе состояния всехее позиций
     * проверка ведется по времени на этапе и статусу позиции
     * если нет флага inWork в Query она считается новой
     * @param query
     * @return возвращает энум QueryStatus
     */
    @Override
    public QueryStatus getQueryStatus(Query query) {
        try {
            if ((query.getInWork() != null) && (query.getInWork())) {
                //проверим есть ли просроченные позиции
                //а если все завершены, то у заявки статус тоже завершена
                List<QueriesPosition> queriesPositions = queryDaoService.getQueriesPositionByQuery(query);
                boolean allFine = true;
                boolean allDone = true;
                boolean allNew = true;


                for (QueriesPosition item : queriesPositions) {

                    //нет смысла проверять время для завершенных позиций
                    if ((!item.getCurrentStage().equals(Stages.Done)) && (!item.getCurrentStage().equals(Stages.Abortion))){
                        allDone = false;
                        if (getPassedTimeFromStageBegin(item) > queryDaoService.getTimeForPositionStage(item) * 1000 * 60 * 60)
                            allFine = false;
                    }

                    if (item.getCurrentStage() != Stages.New) allNew = false;
                }
                if (allDone) return QueryStatus.DONE;
                else {
                    if (allFine) {
                        if (allNew) return QueryStatus.NEW_ITEM;
                        else return QueryStatus.IN_WORK;
                    } else return QueryStatus.OVERDUE;
                }
            } else return QueryStatus.NEW_ITEM;
        }
        catch (DataIncompleteException e){
            return QueryStatus.UNKNOWN;
        }
    }

    /**
     * вычисление времени нахождения позиции на текущем этапе
     * @param position позиция заявки
     * @return время прошедшее с перевода позиции на текущий этап
     * @throws DataIncompleteException если в базе нет соответствующих записей о перемещении позиции в QueryPositionMovement
     */

    @Override
    public long getPassedTimeFromStageBegin(QueriesPosition position) throws DataIncompleteException {
        Date now=new Date();
        List<QueryPositionMovements> movements=queryDaoService.getQueryPositionMovement(position);
        if((movements==null)||(movements.size()==0))  throw new DataIncompleteException();
        return now.getTime()-movements.get(0).getCreateTs().getTime();
    }

    @Override
    public List<QueriesPosition> beginQueryProcessing(List<Query> queries) {

        List<QueriesPosition> positionsWithError=new ArrayList<>();

        queries.forEach(queryItem->{
            if(queryItem.getInWork()==null? false:queryItem.getInWork()) return;
            queryDaoService.getQueriesPositionByQuery(queryItem).forEach(positionItem->{
                try {
                    workflowService.movePosition(positionItem);
                } catch (Exception e) {
                    e.printStackTrace();
                    positionsWithError.add(positionItem);
                }

            });
            queryItem.setInWork(true);
            queryDaoService.commitQuery(queryItem);
        });

        return positionsWithError;
    }

    @Override
    public List<QueriesPosition> beginQueryProcessing(Query query) {
        List temp=new ArrayList<>();
        temp.add(query);
        return beginQueryProcessing(temp);
    }


    /**
     * Расчет даты исполнения заявки целиком. Для рассчета берутся QueryWorkflowDetail с наивысшим приоритетом
     * @param queriesPosition
     * @param addHours флаг, устанавливающий будут ли добавляться часы к результату. Если ложь, то в результате только дни
     * @return
     */
    @Override
    public Date getExecutionTimeForQueriesPosition(QueriesPosition queriesPosition, boolean addHours) {

        List<Stages> stages=getStageChaneForQueriesPosition(queriesPosition);
        int totalTime=getTotalTimeForStages(stages,queriesPosition.getQuery().getUrgency());

        QueryPositionMovements lastMovement=queryDaoService.getQueryPositionMovement(queriesPosition).get(0);
        Date planedExecutionDate=new Date(lastMovement.getCreateTs().getTime()+totalTime*60*60*1000);

        //Используем календарь чтобы отсечь минуты и т.д для последующей группировки
        Calendar calendar=new GregorianCalendar();
        calendar.setTime(planedExecutionDate);

        calendar.set(Calendar.MILLISECOND,0);
        calendar.set(Calendar.SECOND,0);
        calendar.set(Calendar.MINUTE,0);
        if(!addHours)calendar.set(Calendar.HOUR_OF_DAY,0);

        return calendar.getTime();
    }



    /**
     * рассчитывает общее время исполнения по статиям и срочности. время в часах
     * @param stages
     * @param urgency
     * @return
     */
    private int getTotalTimeForStages(List<Stages>stages, Urgency urgency) {
        List<StageTerm> stageTerms=new ArrayList<>();

        stages.forEach(item->stageTerms.add(queryDaoService.getStageTermForStage(item,urgency)));

        //суммируем время исполнения
        int result=0;
        for(StageTerm stageTerm:stageTerms){
            result+=stageTerm.getTime();
        }
        return result;
    }

    /**
     * составление цепочки этапов по которым может двигаться позиция
     * @param queriesPosition позиция для которой составляется цепочка
     * @return возвращает список Stages. порядок начинается с текущей, заканчивается последней
     */
    private List<Stages> getStageChaneForQueriesPosition(QueriesPosition queriesPosition) {

        List<Stages>result=new ArrayList<>();

        //получаем все WFD для рабочего процесса
        List<QueryWorkflowDetail> allWorkflowDetails=queriesPosition.getQuery().getWorkflow().getDetails();

        Stages currentStage=queriesPosition.getCurrentStage();
        result.add(currentStage);
        List<QueryWorkflowDetail> detailsWithCurrentStage=new ArrayList<QueryWorkflowDetail>();

        //в цикле выбираем WFD с наибольшим приоритетом для текущей стадии
        while(true) {
            for (QueryWorkflowDetail wfd : allWorkflowDetails) {
                if (wfd.getSourceStage() == currentStage) detailsWithCurrentStage.add(wfd);
            }

            //если от текущей стадии дальше двигаться нельзя, то выходим
            if (detailsWithCurrentStage.size() == 0) break;

            //сортируем детали с текущей стадией и изменяем currentStage в соответствии с деталью с наибольшим приоритетом
            detailsWithCurrentStage.sort((wfd1, wfd2) -> wfd1.getPriority().compareTo(wfd2.getPriority()));
            currentStage = detailsWithCurrentStage.get(0).getDestStage();


            if ((currentStage == Stages.Abortion) || (currentStage == Stages.Done)) break;
            else result.add(currentStage);

            detailsWithCurrentStage.clear();
        }
        return result;
    }

    /**
     * нахождение даты исполнения текущего этапа
     * @param queriesPosition
     * @return даты исполнения текущего этапа
     */
    @Override
    public Date getStageExecutionTimeForQueriesPosition(QueriesPosition queriesPosition) {
        QueryPositionMovements lastMovement=queryDaoService.getQueryPositionMovement(queriesPosition).get(0);
        StageTerm currentStageTerm=queryDaoService.getStageTermForStage(queriesPosition.getCurrentStage(),queriesPosition.getQuery().getUrgency());

        Date planedExecutionDate=new Date(lastMovement.getCreateTs().getTime()+currentStageTerm.getTime()*60*60*1000);
        return planedExecutionDate;
    }

    /**
     * Подсчет рабочего времени в заданном интервале
     * @author Andrey Kolosov
     * @param startDate Время начала интервала
     * @param endDate Время окончания интервала
     * @param startTimeWork Время начала рабочего дня
     * @param endTimeWork Время окончания рабочего дня
     * @param lunchTime время обеда
     * @param lunchDuration продолжительность обеда (в часах)
     * @return рабочее время в миллисекундах
     */
    @Override
    public long getWorkTime(Date startDate, Date endDate, LocalTime startTimeWork, LocalTime endTimeWork, LocalTime lunchTime, int lunchDuration) {
        LocalDateTime start = Instant.ofEpochMilli(startDate.getTime())
                .atZone(ZoneId.systemDefault())
                .toLocalDateTime();
        LocalDateTime end = Instant.ofEpochMilli(endDate.getTime())
                .atZone(ZoneId.systemDefault())
                .toLocalDateTime();
        start = start.withSecond(0).withNano(0);
        end = end.withSecond(0).withNano(0);
        if (start.isAfter(end)||start.equals(end)) {
            return 0;
        }
        System.out.println("Считаем с "+start+" до "+end);
        List<LocalDate> localDateList = getDatesBetweenUsingJava8(start.toLocalDate(), end.toLocalDate());
        LocalTime currentStartTime = start.toLocalTime();
        LocalTime currentEndTime = end.toLocalTime();
        LocalTime endTimeWorkCorrect = LocalTime.from(endTimeWork);
        long time = 0;
        long timeSum = 0;
        long workTimeInDay = ChronoUnit.MILLIS.between(endTimeWork,startTimeWork);

        for (LocalDate date : localDateList) {
            System.out.println(date);
            //Проверка дня на праздники/выходные/сокращенный
            int specialDayHours = isSpecialDay(date);
            if (specialDayHours==0) {
                System.out.println("Не работаем");
                continue;
            }
            if (specialDayHours<0) {
                System.out.println("Сокращенный день");
                endTimeWorkCorrect = endTimeWorkCorrect.plusHours(specialDayHours);
            }

            //Проверка на время начала работы
            if (currentStartTime.isBefore(startTimeWork)) {
                currentStartTime = startTimeWork;
            }
            //Проверка на время окончания работы
            if (end.isAfter(endTimeWork.atDate(date))) {
                currentEndTime = endTimeWorkCorrect;
            }

            //Время с которого в этот день работают
            System.out.print("Работаем с "+currentStartTime);
            //Время до которого в этот день работают
            System.out.println(" до "+currentEndTime);

            //вычитание обеда
            //Если обед попадает в промежуток
            if (lunchTime.isAfter(currentStartTime)&&lunchTime.isBefore(currentEndTime)) {
                //Если обед с продолжительностью позже времени конца
                if (lunchTime.plusHours(lunchDuration).isAfter(currentEndTime)) {
                    time = ChronoUnit.MILLIS.between(currentStartTime, lunchTime);
                }
                //Если время конца позже обеда
                else {
                    time = TimeUnit.HOURS.toMillis(ChronoUnit.HOURS.between(currentStartTime, currentEndTime)-lunchDuration);
                }
                //Если обед не попадает в промежуток
            } else {
                time = ChronoUnit.MILLIS.between(currentStartTime, currentEndTime);
            }

            timeSum+=time;
            System.out.println("Рабочих часов в день: "+TimeUnit.MILLISECONDS.toHours(time));
            currentStartTime = startTimeWork;
            currentEndTime = end.toLocalTime();
            endTimeWorkCorrect = LocalTime.from(endTimeWork);
        }

        System.out.println("Рабочих часов за период: "+TimeUnit.MILLISECONDS.toHours(timeSum));

        return timeSum;
    }

    /**
     * Формирует список дней для временного интервала
     * @author Andrey Kolosov
     * @param startDate
     * @param endDate
     * @return
     */
    private List<LocalDate> getDatesBetweenUsingJava8(
            LocalDate startDate, LocalDate endDate) {

        long numOfDaysBetween = ChronoUnit.DAYS.between(startDate, endDate);
        return IntStream.iterate(0, i -> i + 1)
                .limit(numOfDaysBetween+1)
                .mapToObj(startDate::plusDays)
                .collect(Collectors.toList());
    }

    /**
     * Возвращает количество часов, на случай если день выходной/праздник/сокращенный
     * @author Andrey Kolosov
     * @param date Проверяемый день
     * @return рабочие часы
     */
    private int isSpecialDay(LocalDate date) {

        Holiday holiday = queryDaoService.getHoliday(java.sql.Date.valueOf(date));

        if (holiday != null) {
            return holiday.getWorkingHours();
        } else {
            if (date.getDayOfWeek().equals(DayOfWeek.SATURDAY)||date.getDayOfWeek().equals(DayOfWeek.SUNDAY)) {
                return 0;
            }
            return 24;
        }
    }
}