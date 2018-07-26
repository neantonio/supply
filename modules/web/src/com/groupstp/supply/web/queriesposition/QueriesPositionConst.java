package com.groupstp.supply.web.queriesposition;

import java.util.Arrays;
import java.util.List;

public class QueriesPositionConst {

    public static final String[] supSelectionGroupOrder = new String[] {
            "query.urgency","query.company","query.division","query"
    };

    public static final String[] supSelectionAvailableFields = new String[] {
            "query.urgency","query.company","query.division","query"
    };

    public static final String[] storeControlGroupOrder = new String[] {
            "query.urgency","query.company","query.division"
    };

    public static final String[] storeControlAvailableFields = new String[] {
            "query.urgency","query.company","query.division"
    };

    public static final String[] nomControlGroupOrder = new String[] {
            "query.urgency","query.company","query.division","query"
    };

    public static final String[] nomControlAvailableFields = new String[] {
            "query.urgency","query.company","query.division","query"
    };

    public static final String[] analysisGroupOrder = new String[] {
            "query.urgency","query.company","query.division","query"
    };

    public static final String[] analysisAvailableFields = new String[] {
            "query.urgency","query.company","query.division","query"
    };

    public static final String[] billsGroupOrder = new String[] {
            "query.urgency","query.company","query.division","query"
    };

    public static final String[] billsAvailableFields = new String[] {
            "query.urgency","query.company","query.division","query"
    };


    //список редактируемых полей
    public static final List<String> logisticStageDataEditableFields = Arrays.asList(
            "destination_address",
            "acceptance_address",
            "carrier",
            "cargo_number",
            "planed_send_date",
            "planed_receive_date",
            "fact_send_date",
            "fact_receive_date",
            "cargo_monitoring_id",
            "cargo_monitoring_url",
            "store_receive_flag",
            "cargo_state");
    //список обязательных для заполнения полей
    public static final List<String> logisticStageRequiredFields = Arrays.asList(
            "destination_address",
            "acceptance_address",
            "carrier",
            "cargo_number",
            "planed_send_date",
            "planed_receive_date",
            "fact_send_date",
            "fact_receive_date",
            "cargo_monitoring_id",
            "store_receive_flag");

}
