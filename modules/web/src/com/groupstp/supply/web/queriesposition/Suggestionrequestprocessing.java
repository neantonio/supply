package com.groupstp.supply.web.queriesposition;

import com.groupstp.supply.entity.Company;
import com.groupstp.supply.entity.PositionSupplier;
import com.groupstp.supply.entity.QueriesPosition;
import com.groupstp.supply.entity.Suppliers;
import com.groupstp.supply.service.EmployeeService;
import com.groupstp.supply.service.SuggestionService;
import com.haulmont.cuba.core.global.Metadata;
import com.haulmont.cuba.gui.WindowManager;
import com.haulmont.cuba.gui.components.AbstractWindow;
import com.haulmont.cuba.gui.components.GroupTable;
import com.haulmont.cuba.gui.components.VBoxLayout;
import com.haulmont.cuba.gui.data.GroupDatasource;
import com.haulmont.cuba.gui.xml.layout.ComponentsFactory;

import javax.inject.Inject;
import java.util.*;
import java.util.stream.Collectors;

/**
 * @author AntonLomako
 * обработка отправки запроса повторно и по позициям у которых еще не задан поставщик
 */

public class Suggestionrequestprocessing extends AbstractWindow {

    @Inject
    private GroupDatasource<QueriesPosition,UUID> positionsWithoutSupplierDs;

    @Inject
    private GroupDatasource<PositionSupplier,UUID> alreadySendRequestDs;

    @Inject
    private VBoxLayout withoutSupplierVbox;

    @Inject
    private VBoxLayout repeatedSendVbox;

    @Inject
    private GroupTable<QueriesPosition> withoutSupplierTable;

    @Inject
    private GroupTable<PositionSupplier> repeatedSendTable;

    @Inject
    private ComponentsFactory componentsFactory;

    @Inject
    private SuggestionService suggestionService;

    @Inject
    private EmployeeService employeeService;

    @Inject
    private Metadata metadata;

    private SupplyWindowUtil windowUtil;

    @Override
    public void init(Map<String, Object> params) {

        windowUtil=new SupplyWindowUtil(this,messages,componentsFactory,metadata);

        Collection<QueriesPosition> positionsWithOutSupplier= (Collection<QueriesPosition>) params.get("positionsWithoutSupplier");
        Collection<PositionSupplier> alreadySendRequest= (Collection<PositionSupplier>) params.get("alreadySendRequest");

        if((positionsWithOutSupplier==null)||(positionsWithOutSupplier.size()==0)) withoutSupplierVbox.setVisible(false);
        else positionsWithOutSupplier.forEach(item->positionsWithoutSupplierDs.addItem(item));
        if((alreadySendRequest==null)||(alreadySendRequest.size()==0)) repeatedSendVbox.setVisible(false);
        else alreadySendRequest.forEach(item->alreadySendRequestDs.addItem(item));
    }

    /**
     * открывает окно выбора поставщиков для выбанных поставщиков
     */
    public void onSuppliersClick() {
        if(!windowUtil.checkSelection(withoutSupplierTable.getSelected())) return;
        HashMap<String, Object> items = new HashMap<>();
        items.put("positions", withoutSupplierTable.getSelected());
        openWindow("supply$PositionSupplier.browse", WindowManager.OpenType.DIALOG, items);
    }

    /**
     * попытка отправить запрос по всем позициям, которые были без поставщиков
     * позиции по которым запрос отправлен удаляются из таблицы
     */
    public void onCheckAndSendClick() {

        Map<Suppliers,Map<Company,List<QueriesPosition>>> mapForSending=suggestionService.makeSuggestionRequestMap(positionsWithoutSupplierDs.getItems());
        suggestionService.processRequestSending(mapForSending,employeeService.getCurrentUserEmployee());

        positionsWithoutSupplierDs.clear();
        suggestionService.getPositionListWithoutSupplier().forEach(item->positionsWithoutSupplierDs.addItem(item));
       // withoutSupplierTable.refresh();

        afterDataChange();

    }

    public void onSendToSelectedClick() {
        if(!windowUtil.checkSelection(repeatedSendTable.getSelected())) return;

        List<QueriesPosition> positionList=repeatedSendTable.getSelected().stream().map(PositionSupplier::getPosition).collect(Collectors.toList());

        Map<Suppliers,Map<Company,List<QueriesPosition>>> mapForSending=suggestionService.makeSuggestionRequestMap(positionList,true);
        suggestionService.processRequestSending(mapForSending,employeeService.getCurrentUserEmployee());

        repeatedSendTable.getSelected().forEach(item->alreadySendRequestDs.removeItem(item));
        //repeatedSendTable.refresh();

        afterDataChange();

    }


    public void onSendToAllAgainClick() {

        List<QueriesPosition> positionList=alreadySendRequestDs.getItems().stream().map(PositionSupplier::getPosition).collect(Collectors.toList());

        Map<Suppliers,Map<Company,List<QueriesPosition>>> mapForSending=suggestionService.makeSuggestionRequestMap(positionList,true);
        suggestionService.processRequestSending(mapForSending,employeeService.getCurrentUserEmployee());

        //alreadySendRequestDs.clear();
        alreadySendRequestDs.refresh();

        if(suggestionService.getJustSendPositions().size()>0){
            windowUtil.makeTrayNotificationWithStringList(messages.getMainMessage("just_send_position"),
                    suggestionService.getJustSendPositions().stream().map(QueriesPosition::getQueriesPositionName).collect(Collectors.toList()));
        }

        afterDataChange();
    }

    private void afterDataChange(){

        if(suggestionService.getJustSendPositions().size()>0){
            windowUtil.makeTrayNotificationWithStringList(messages.getMainMessage("just_send_position"),
                    suggestionService.getJustSendPositions().stream().map(QueriesPosition::getQueriesPositionName).collect(Collectors.toList()));
        }

        boolean closeNow=true;
        if(alreadySendRequestDs.getItems().size()==0) {
            repeatedSendVbox.setVisible(false);
        }
        else{
            repeatedSendVbox.setVisible(true);
            closeNow=false;
        }
        if(positionsWithoutSupplierDs.getItems().size()==0){
            withoutSupplierVbox.setVisible(false);
        }
        else{
            withoutSupplierVbox.setVisible(true);
            closeNow=false;
        }
        if(closeNow)close("ok",true);
    }
}