-- begin SUPPLY_QUERY
alter table SUPPLY_QUERY add constraint FK_SUPPLY_QUERY_ON_URGENCY foreign key (URGENCY_ID) references SUPPLY_URGENCY(ID)^
alter table SUPPLY_QUERY add constraint FK_SUPPLY_QUERY_ON_WORKFLOW foreign key (WORKFLOW_ID) references SUPPLY_QUERY_WORKFLOW(ID)^
alter table SUPPLY_QUERY add constraint FK_SUPPLY_QUERY_ON_COMPANY foreign key (COMPANY_ID) references SUPPLY_COMPANY(ID)^
alter table SUPPLY_QUERY add constraint FK_SUPPLY_QUERY_ON_DIVISION foreign key (DIVISION_ID) references SUPPLY_DIVISION(ID)^
alter table SUPPLY_QUERY add constraint FK_SUPPLY_QUERY_ON_STORE foreign key (STORE_ID) references SUPPLY_STORE(ID)^
alter table SUPPLY_QUERY add constraint FK_SUPPLY_QUERY_ON_CONTACT foreign key (CONTACT_ID) references SEC_USER(ID)^
create unique index IDX_SUPPLY_QUERY_UK_NUMBER_ on SUPPLY_QUERY (NUMBER_) where DELETE_TS is null ^
create index IDX_SUPPLY_QUERY_ON_URGENCY on SUPPLY_QUERY (URGENCY_ID)^
create index IDX_SUPPLY_QUERY_ON_WORKFLOW on SUPPLY_QUERY (WORKFLOW_ID)^
create index IDX_SUPPLY_QUERY_ON_COMPANY on SUPPLY_QUERY (COMPANY_ID)^
create index IDX_SUPPLY_QUERY_ON_DIVISION on SUPPLY_QUERY (DIVISION_ID)^
create index IDX_SUPPLY_QUERY_ON_STORE on SUPPLY_QUERY (STORE_ID)^
create index IDX_SUPPLY_QUERY_ON_CONTACT on SUPPLY_QUERY (CONTACT_ID)^
-- end SUPPLY_QUERY
-- begin SUPPLY_COMPANY
create unique index IDX_SUPPLY_COMPANY_UK_NAME on SUPPLY_COMPANY (NAME) where DELETE_TS is null ^
-- end SUPPLY_COMPANY
-- begin SUPPLY_DIVISION
alter table SUPPLY_DIVISION add constraint FK_SUPPLY_DIVISION_ON_COMPANY foreign key (COMPANY_ID) references SUPPLY_COMPANY(ID)^
create index IDX_SUPPLY_DIVISION_ON_COMPANY on SUPPLY_DIVISION (COMPANY_ID)^
-- end SUPPLY_DIVISION
-- begin SUPPLY_STORE
alter table SUPPLY_STORE add constraint FK_SUPPLY_STORE_ON_DIVISION foreign key (DIVISION_ID) references SUPPLY_DIVISION(ID)^
create unique index IDX_SUPPLY_STORE_UK_NAME on SUPPLY_STORE (NAME) where DELETE_TS is null ^
create index IDX_SUPPLY_STORE_ON_DIVISION on SUPPLY_STORE (DIVISION_ID)^
-- end SUPPLY_STORE
-- begin SUPPLY_MEASURE_UNITS
create unique index IDX_SUPPLY_MEASURE_UNITS_UK_NAME on SUPPLY_MEASURE_UNITS (NAME) where DELETE_TS is null ^
create unique index IDX_SUPPLY_MEASURE_UNITS_UK_CODE on SUPPLY_MEASURE_UNITS (CODE) where DELETE_TS is null ^
-- end SUPPLY_MEASURE_UNITS
-- begin SUPPLY_URGENCY
create unique index IDX_SUPPLY_URGENCY_UK_NAME on SUPPLY_URGENCY (NAME) where DELETE_TS is null ^
-- end SUPPLY_URGENCY
-- begin SUPPLY_STAGE_TERM
alter table SUPPLY_STAGE_TERM add constraint FK_SUPPLY_STAGE_TERM_ON_URGENCY foreign key (URGENCY_ID) references SUPPLY_URGENCY(ID)^
create index IDX_SUPPLY_STAGE_TERM_ON_URGENCY on SUPPLY_STAGE_TERM (URGENCY_ID)^
-- end SUPPLY_STAGE_TERM
-- begin SUPPLY_QUERY_WORKFLOW_DETAIL
alter table SUPPLY_QUERY_WORKFLOW_DETAIL add constraint FK_SUPPLY_QUERY_WORKFLOW_DETAIL_ON_QUERY_WORKFLOW foreign key (QUERY_WORKFLOW_ID) references SUPPLY_QUERY_WORKFLOW(ID)^
create index IDX_SUPPLY_QUERY_WORKFLOW_DETAIL_ON_QUERY_WORKFLOW on SUPPLY_QUERY_WORKFLOW_DETAIL (QUERY_WORKFLOW_ID)^
-- end SUPPLY_QUERY_WORKFLOW_DETAIL
-- begin SUPPLY_EMPLOYEE
alter table SUPPLY_EMPLOYEE add constraint FK_SUPPLY_EMPLOYEE_ON_USER foreign key (USER_ID) references SEC_USER(ID)^
create unique index IDX_SUPPLY_EMPLOYEE_UK_USER_ID on SUPPLY_EMPLOYEE (USER_ID) where DELETE_TS is null ^
create index IDX_SUPPLY_EMPLOYEE_ON_USER on SUPPLY_EMPLOYEE (USER_ID)^
-- end SUPPLY_EMPLOYEE
-- begin SUPPLY_QUERIES_POSITION
alter table SUPPLY_QUERIES_POSITION add constraint FK_SUPPLY_QUERIES_POSITION_ON_QUERY foreign key (QUERY_ID) references SUPPLY_QUERY(ID)^
alter table SUPPLY_QUERIES_POSITION add constraint FK_SUPPLY_QUERIES_POSITION_ON_NOMENCLATURE foreign key (NOMENCLATURE_ID) references SUPPLY_NOMENCLATURE(ID)^
alter table SUPPLY_QUERIES_POSITION add constraint FK_SUPPLY_QUERIES_POSITION_ON_MEASURE_UNIT foreign key (MEASURE_UNIT_ID) references SUPPLY_MEASURE_UNITS(ID)^
alter table SUPPLY_QUERIES_POSITION add constraint FK_SUPPLY_QUERIES_POSITION_ON_STORE foreign key (STORE_ID) references SUPPLY_STORE(ID)^
alter table SUPPLY_QUERIES_POSITION add constraint FK_SUPPLY_QUERIES_POSITION_ON_SPEC_NOMENCLATURE foreign key (SPEC_NOMENCLATURE_ID) references SUPPLY_NOMENCLATURE(ID)^
alter table SUPPLY_QUERIES_POSITION add constraint FK_SUPPLY_QUERIES_POSITION_ON_NOMECLATURE_CHANGE foreign key (NOMECLATURE_CHANGE_ID) references SUPPLY_NOMENCLATURE(ID)^
alter table SUPPLY_QUERIES_POSITION add constraint FK_SUPPLY_QUERIES_POSITION_ON_POSITION foreign key (POSITION_ID) references SUPPLY_QUERIES_POSITION(ID)^
alter table SUPPLY_QUERIES_POSITION add constraint FK_SUPPLY_QUERIES_POSITION_ON_SRC_STORE foreign key (SRC_STORE_ID) references SUPPLY_STORE(ID)^
alter table SUPPLY_QUERIES_POSITION add constraint FK_SUPPLY_QUERIES_POSITION_ON_VOTE_RESULT foreign key (VOTE_RESULT_ID) references SUPPLY_SUPPLIERS_SUGGESTION(ID)^
alter table SUPPLY_QUERIES_POSITION add constraint FK_SUPPLY_QUERIES_POSITION_ON_BILLS foreign key (BILLS_ID) references SUPPLY_BILLS(ID)^
alter table SUPPLY_QUERIES_POSITION add constraint FK_SUPPLY_QUERIES_POSITION_ON_DELIVERY foreign key (DELIVERY_ID) references SUPPLY_DELIVERY(ID)^
create index IDX_SUPPLY_QUERIES_POSITION_ON_QUERY on SUPPLY_QUERIES_POSITION (QUERY_ID)^
create index IDX_SUPPLY_QUERIES_POSITION_ON_NOMENCLATURE on SUPPLY_QUERIES_POSITION (NOMENCLATURE_ID)^
create index IDX_SUPPLY_QUERIES_POSITION_ON_MEASURE_UNIT on SUPPLY_QUERIES_POSITION (MEASURE_UNIT_ID)^
create index IDX_SUPPLY_QUERIES_POSITION_ON_STORE on SUPPLY_QUERIES_POSITION (STORE_ID)^
create index IDX_SUPPLY_QUERIES_POSITION_ON_SPEC_NOMENCLATURE on SUPPLY_QUERIES_POSITION (SPEC_NOMENCLATURE_ID)^
create index IDX_SUPPLY_QUERIES_POSITION_ON_NOMECLATURE_CHANGE on SUPPLY_QUERIES_POSITION (NOMECLATURE_CHANGE_ID)^
create index IDX_SUPPLY_QUERIES_POSITION_ON_POSITION on SUPPLY_QUERIES_POSITION (POSITION_ID)^
create index IDX_SUPPLY_QUERIES_POSITION_ON_SRC_STORE on SUPPLY_QUERIES_POSITION (SRC_STORE_ID)^
create index IDX_SUPPLY_QUERIES_POSITION_ON_VOTE_RESULT on SUPPLY_QUERIES_POSITION (VOTE_RESULT_ID)^
create index IDX_SUPPLY_QUERIES_POSITION_ON_BILLS on SUPPLY_QUERIES_POSITION (BILLS_ID)^
create index IDX_SUPPLY_QUERIES_POSITION_ON_DELIVERY on SUPPLY_QUERIES_POSITION (DELIVERY_ID)^
-- end SUPPLY_QUERIES_POSITION
-- begin SUPPLY_NOMENCLATURE
alter table SUPPLY_NOMENCLATURE add constraint FK_SUPPLY_NOMENCLATURE_ON_UNIT foreign key (UNIT_ID) references SUPPLY_MEASURE_UNITS(ID)^
alter table SUPPLY_NOMENCLATURE add constraint FK_SUPPLY_NOMENCLATURE_ON_PARENT foreign key (PARENT_ID) references SUPPLY_NOMENCLATURE(ID)^
create unique index IDX_SUPPLY_NOMENCLATURE_UK_ARTICLE on SUPPLY_NOMENCLATURE (ARTICLE) where DELETE_TS is null ^
create unique index IDX_SUPPLY_NOMENCLATURE_UK_NAME on SUPPLY_NOMENCLATURE (NAME) where DELETE_TS is null ^
create index IDX_SUPPLY_NOMENCLATURE_ON_UNIT on SUPPLY_NOMENCLATURE (UNIT_ID)^
create index IDX_SUPPLY_NOMENCLATURE_ON_PARENT on SUPPLY_NOMENCLATURE (PARENT_ID)^
-- end SUPPLY_NOMENCLATURE
-- begin SUPPLY_ANALOGS
alter table SUPPLY_ANALOGS add constraint FK_SUPPLY_ANALOGS_ON_NOMENCLATURE foreign key (NOMENCLATURE_ID) references SUPPLY_NOMENCLATURE(ID)^
alter table SUPPLY_ANALOGS add constraint FK_SUPPLY_ANALOGS_ON_ANALOG foreign key (ANALOG_ID) references SUPPLY_NOMENCLATURE(ID)^
create index IDX_SUPPLY_ANALOGS_ON_NOMENCLATURE on SUPPLY_ANALOGS (NOMENCLATURE_ID)^
create index IDX_SUPPLY_ANALOGS_ON_ANALOG on SUPPLY_ANALOGS (ANALOG_ID)^
-- end SUPPLY_ANALOGS
-- begin SUPPLY_POSITIONS_ANALOGS
alter table SUPPLY_POSITIONS_ANALOGS add constraint FK_SUPPLY_POSITIONS_ANALOGS_ON_ANALOG foreign key (ANALOG_ID) references SUPPLY_NOMENCLATURE(ID)^
alter table SUPPLY_POSITIONS_ANALOGS add constraint FK_SUPPLY_POSITIONS_ANALOGS_ON_QUERIES_POSITION foreign key (QUERIES_POSITION_ID) references SUPPLY_QUERIES_POSITION(ID)^
create index IDX_SUPPLY_POSITIONS_ANALOGS_ON_ANALOG on SUPPLY_POSITIONS_ANALOGS (ANALOG_ID)^
create index IDX_SUPPLY_POSITIONS_ANALOGS_ON_QUERIES_POSITION on SUPPLY_POSITIONS_ANALOGS (QUERIES_POSITION_ID)^
-- end SUPPLY_POSITIONS_ANALOGS
-- begin SUPPLY_QUERY_POSITION_MOVEMENTS
alter table SUPPLY_QUERY_POSITION_MOVEMENTS add constraint FK_SUPPLY_QUERY_POSITION_MOVEMENTS_ON_POSITION foreign key (POSITION_ID) references SUPPLY_QUERIES_POSITION(ID)^
alter table SUPPLY_QUERY_POSITION_MOVEMENTS add constraint FK_SUPPLY_QUERY_POSITION_MOVEMENTS_ON_USER foreign key (USER_ID) references SEC_USER(ID)^
create index IDX_SUPPLY_QUERY_POSITION_MOVEMENTS_ON_POSITION on SUPPLY_QUERY_POSITION_MOVEMENTS (POSITION_ID)^
create index IDX_SUPPLY_QUERY_POSITION_MOVEMENTS_ON_USER on SUPPLY_QUERY_POSITION_MOVEMENTS (USER_ID)^
-- end SUPPLY_QUERY_POSITION_MOVEMENTS
-- begin SUPPLY_SUPPLIERS_SUGGESTION
alter table SUPPLY_SUPPLIERS_SUGGESTION add constraint FK_SUPPLY_SUPPLIERS_SUGGESTION_ON_POS_SUP foreign key (POS_SUP_ID) references SUPPLY_POSITION_SUPPLIER(ID)^
create index IDX_SUPPLY_SUPPLIERS_SUGGESTION_ON_POS_SUP on SUPPLY_SUPPLIERS_SUGGESTION (POS_SUP_ID)^
-- end SUPPLY_SUPPLIERS_SUGGESTION
-- begin SUPPLY_POSITION_SUPPLIER
alter table SUPPLY_POSITION_SUPPLIER add constraint FK_SUPPLY_POSITION_SUPPLIER_ON_POSITION foreign key (POSITION_ID) references SUPPLY_QUERIES_POSITION(ID)^
alter table SUPPLY_POSITION_SUPPLIER add constraint FK_SUPPLY_POSITION_SUPPLIER_ON_SUPPLIER foreign key (SUPPLIER_ID) references SUPPLY_SUPPLIERS(ID)^
create index IDX_SUPPLY_POSITION_SUPPLIER_ON_POSITION on SUPPLY_POSITION_SUPPLIER (POSITION_ID)^
create index IDX_SUPPLY_POSITION_SUPPLIER_ON_SUPPLIER on SUPPLY_POSITION_SUPPLIER (SUPPLIER_ID)^
-- end SUPPLY_POSITION_SUPPLIER
-- begin SUPPLY_VOTE
alter table SUPPLY_VOTE add constraint FK_SUPPLY_VOTE_ON_POSITION foreign key (POSITION_ID) references SUPPLY_QUERIES_POSITION(ID)^
alter table SUPPLY_VOTE add constraint FK_SUPPLY_VOTE_ON_EMP foreign key (EMP_ID) references SEC_USER(ID)^
alter table SUPPLY_VOTE add constraint FK_SUPPLY_VOTE_ON_SUGGESTION foreign key (SUGGESTION_ID) references SUPPLY_SUPPLIERS_SUGGESTION(ID)^
create index IDX_SUPPLY_VOTE_ON_POSITION on SUPPLY_VOTE (POSITION_ID)^
create index IDX_SUPPLY_VOTE_ON_EMP on SUPPLY_VOTE (EMP_ID)^
create index IDX_SUPPLY_VOTE_ON_SUGGESTION on SUPPLY_VOTE (SUGGESTION_ID)^
-- end SUPPLY_VOTE
-- begin SUPPLY_BILLS
alter table SUPPLY_BILLS add constraint FK_SUPPLY_BILLS_ON_COMPANY foreign key (COMPANY_ID) references SUPPLY_COMPANY(ID)^
alter table SUPPLY_BILLS add constraint FK_SUPPLY_BILLS_ON_SUPPLIER foreign key (SUPPLIER_ID) references SUPPLY_SUPPLIERS(ID)^
alter table SUPPLY_BILLS add constraint FK_SUPPLY_BILLS_ON_IMAGE_BILL foreign key (IMAGE_BILL_ID) references SYS_FILE(ID)^
create unique index IDX_SUPPLY_BILLS_UK_NUMBER_ on SUPPLY_BILLS (NUMBER_) where DELETE_TS is null ^
create index IDX_SUPPLY_BILLS_ON_COMPANY on SUPPLY_BILLS (COMPANY_ID)^
create index IDX_SUPPLY_BILLS_ON_SUPPLIER on SUPPLY_BILLS (SUPPLIER_ID)^
create index IDX_SUPPLY_BILLS_ON_IMAGE_BILL on SUPPLY_BILLS (IMAGE_BILL_ID)^
-- end SUPPLY_BILLS
-- begin SUPPLY_PROCURATION
alter table SUPPLY_PROCURATION add constraint FK_SUPPLY_PROCURATION_ON_EMPLOYEE foreign key (EMPLOYEE_ID) references SUPPLY_EMPLOYEE(ID)^
create unique index IDX_SUPPLY_PROCURATION_UK_NUMBER_ on SUPPLY_PROCURATION (NUMBER_) where DELETE_TS is null ^
create index IDX_SUPPLY_PROCURATION_ON_EMPLOYEE on SUPPLY_PROCURATION (EMPLOYEE_ID)^
-- end SUPPLY_PROCURATION
-- begin SUPPLY_QUERY_POSITION_STAGE_DATA
alter table SUPPLY_QUERY_POSITION_STAGE_DATA add constraint FK_SUPPLY_QUERY_POSITION_STAGE_DATA_ON_POSITION foreign key (POSITION_ID) references SUPPLY_QUERIES_POSITION(ID)^
create index IDX_SUPPLY_QUERY_POSITION_STAGE_DATA_ON_POSITION on SUPPLY_QUERY_POSITION_STAGE_DATA (POSITION_ID)^
-- end SUPPLY_QUERY_POSITION_STAGE_DATA
-- begin SUPPLY_QUERY_POSITION_STAGE_DATA_ITEM
alter table SUPPLY_QUERY_POSITION_STAGE_DATA_ITEM add constraint FK_SUPPLY_QUERYPOSITSTAGEDATAITEM_ON_QUERY_POSITION_STAGE_DATA foreign key (QUERY_POSITION_STAGE_DATA_ID) references SUPPLY_QUERY_POSITION_STAGE_DATA(ID)^
alter table SUPPLY_QUERY_POSITION_STAGE_DATA_ITEM add constraint FK_SUPPLY_QUERY_POSITION_STAGE_DATA_ITEM_ON_USER foreign key (USER_ID) references SEC_USER(ID)^
create index IDX_SUPPLY_QUERPOSISTAGDATAITEM_ON_QUERY_POSITION_STAGE_DATA on SUPPLY_QUERY_POSITION_STAGE_DATA_ITEM (QUERY_POSITION_STAGE_DATA_ID)^
create index IDX_SUPPLY_QUERY_POSITION_STAGE_DATA_ITEM_ON_USER on SUPPLY_QUERY_POSITION_STAGE_DATA_ITEM (USER_ID)^
-- end SUPPLY_QUERY_POSITION_STAGE_DATA_ITEM
-- begin SUPPLY_QUERY_POSITION_STAGE_DATA_ITEM_LINK
alter table SUPPLY_QUERY_POSITION_STAGE_DATA_ITEM_LINK add constraint FK_QUEPOSSTADATITE_ON_QUERY_POSITION_STAGE_DATA foreign key (QUERY_POSITION_STAGE_DATA_ID) references SUPPLY_QUERY_POSITION_STAGE_DATA(ID)^
alter table SUPPLY_QUERY_POSITION_STAGE_DATA_ITEM_LINK add constraint FK_QUEPOSSTADATITE_ON_QUERY_POSITION_STAGE_DATA_ITEM foreign key (QUERY_POSITION_STAGE_DATA_ITEM_ID) references SUPPLY_QUERY_POSITION_STAGE_DATA_ITEM(ID)^
-- end SUPPLY_QUERY_POSITION_STAGE_DATA_ITEM_LINK

-- begin SUPPLY_DELIVERY_LINE
alter table SUPPLY_DELIVERY_LINE add constraint FK_SUPPLY_DELIVERY_LINE_ON_DELIVERY foreign key (DELIVERY_ID) references SUPPLY_DELIVERY(ID)^
create index IDX_SUPPLY_DELIVERY_LINE_ON_DELIVERY on SUPPLY_DELIVERY_LINE (DELIVERY_ID)^
-- end SUPPLY_DELIVERY_LINE
-- begin SUPPLY_HOLIDAY
create unique index IDX_SUPPLY_HOLIDAY_UK_DAY_ on SUPPLY_HOLIDAY (DAY_) where DELETE_TS is null ^
-- end SUPPLY_HOLIDAY
-- begin SUPPLY_SETTINGS
alter table SUPPLY_SETTINGS add constraint FK_SUPPLY_SETTINGS_ON_MEASURE_UNITS foreign key (MEASURE_UNITS_ID) references SUPPLY_MEASURE_UNITS(ID)^
alter table SUPPLY_SETTINGS add constraint FK_SUPPLY_SETTINGS_ON_PROCURATION foreign key (PROCURATION_ID) references SUPPLY_PROCURATION(ID)^
alter table SUPPLY_SETTINGS add constraint FK_SUPPLY_SETTINGS_ON_QUERIES_POSITION foreign key (QUERIES_POSITION_ID) references SUPPLY_QUERIES_POSITION(ID)^
alter table SUPPLY_SETTINGS add constraint FK_SUPPLY_SETTINGS_ON_QUERY foreign key (QUERY_ID) references SUPPLY_QUERY(ID)^
alter table SUPPLY_SETTINGS add constraint FK_SUPPLY_SETTINGS_ON_QUERY_POSITION_MOVEMENTS foreign key (QUERY_POSITION_MOVEMENTS_ID) references SUPPLY_QUERY_POSITION_MOVEMENTS(ID)^
alter table SUPPLY_SETTINGS add constraint FK_SUPPLY_SETTINGS_ON_QUERY_POSITION_STAGE_DATA foreign key (QUERY_POSITION_STAGE_DATA_ID) references SUPPLY_QUERY_POSITION_STAGE_DATA(ID)^
alter table SUPPLY_SETTINGS add constraint FK_SUPPLY_SETTINGS_ON_QUERY_POSITION_STAGE_DATA_ITEM foreign key (QUERY_POSITION_STAGE_DATA_ITEM_ID) references SUPPLY_QUERY_POSITION_STAGE_DATA_ITEM(ID)^
alter table SUPPLY_SETTINGS add constraint FK_SUPPLY_SETTINGS_ON_QUERY_WORKFLOW foreign key (QUERY_WORKFLOW_ID) references SUPPLY_QUERY_WORKFLOW(ID)^
alter table SUPPLY_SETTINGS add constraint FK_SUPPLY_SETTINGS_ON_QUERY_WORKFLOW_DETAIL foreign key (QUERY_WORKFLOW_DETAIL_ID) references SUPPLY_QUERY_WORKFLOW_DETAIL(ID)^
alter table SUPPLY_SETTINGS add constraint FK_SUPPLY_SETTINGS_ON_STAGE_TERM foreign key (STAGE_TERM_ID) references SUPPLY_STAGE_TERM(ID)^
alter table SUPPLY_SETTINGS add constraint FK_SUPPLY_SETTINGS_ON_STORE foreign key (STORE_ID) references SUPPLY_STORE(ID)^
alter table SUPPLY_SETTINGS add constraint FK_SUPPLY_SETTINGS_ON_SUPPLIERS_SUGGESTION foreign key (SUPPLIERS_SUGGESTION_ID) references SUPPLY_SUPPLIERS_SUGGESTION(ID)^
alter table SUPPLY_SETTINGS add constraint FK_SUPPLY_SETTINGS_ON_URGENCY foreign key (URGENCY_ID) references SUPPLY_URGENCY(ID)^
alter table SUPPLY_SETTINGS add constraint FK_SUPPLY_SETTINGS_ON_VOTE foreign key (VOTE_ID) references SUPPLY_VOTE(ID)^
alter table SUPPLY_SETTINGS add constraint FK_SUPPLY_SETTINGS_ON_NOMENCLATURE foreign key (NOMENCLATURE_ID) references SUPPLY_NOMENCLATURE(ID)^
alter table SUPPLY_SETTINGS add constraint FK_SUPPLY_SETTINGS_ON_POSITION_SUPPLIER foreign key (POSITION_SUPPLIER_ID) references SUPPLY_POSITION_SUPPLIER(ID)^
alter table SUPPLY_SETTINGS add constraint FK_SUPPLY_SETTINGS_ON_POSITIONS_ANALOGS foreign key (POSITIONS_ANALOGS_ID) references SUPPLY_POSITIONS_ANALOGS(ID)^
alter table SUPPLY_SETTINGS add constraint FK_SUPPLY_SETTINGS_ON_ANALOGS foreign key (ANALOGS_ID) references SUPPLY_ANALOGS(ID)^
alter table SUPPLY_SETTINGS add constraint FK_SUPPLY_SETTINGS_ON_BILLS foreign key (BILLS_ID) references SUPPLY_BILLS(ID)^
alter table SUPPLY_SETTINGS add constraint FK_SUPPLY_SETTINGS_ON_DELIVERY foreign key (DELIVERY_ID) references SUPPLY_DELIVERY(ID)^
alter table SUPPLY_SETTINGS add constraint FK_SUPPLY_SETTINGS_ON_DELIVERY_LINE foreign key (DELIVERY_LINE_ID) references SUPPLY_DELIVERY_LINE(ID)^
alter table SUPPLY_SETTINGS add constraint FK_SUPPLY_SETTINGS_ON_EMPLOYEE foreign key (EMPLOYEE_ID) references SUPPLY_EMPLOYEE(ID)^
alter table SUPPLY_SETTINGS add constraint FK_SUPPLY_SETTINGS_ON_HOLIDAY foreign key (HOLIDAY_ID) references SUPPLY_HOLIDAY(ID)^
alter table SUPPLY_SETTINGS add constraint FK_SUPPLY_SETTINGS_ON_COMPANY foreign key (COMPANY_ID) references SUPPLY_COMPANY(ID)^
alter table SUPPLY_SETTINGS add constraint FK_SUPPLY_SETTINGS_ON_SUPPLIERS foreign key (SUPPLIERS_ID) references SUPPLY_SUPPLIERS(ID)^
alter table SUPPLY_SETTINGS add constraint FK_SUPPLY_SETTINGS_ON_DIVISION foreign key (DIVISION_ID) references SUPPLY_DIVISION(ID)^
create unique index IDX_SUPPLY_SETTINGS_UK_KEY_ on SUPPLY_SETTINGS (KEY_) where DELETE_TS is null ^
create index IDX_SUPPLY_SETTINGS_ON_MEASURE_UNITS on SUPPLY_SETTINGS (MEASURE_UNITS_ID)^
create index IDX_SUPPLY_SETTINGS_ON_PROCURATION on SUPPLY_SETTINGS (PROCURATION_ID)^
create index IDX_SUPPLY_SETTINGS_ON_QUERIES_POSITION on SUPPLY_SETTINGS (QUERIES_POSITION_ID)^
create index IDX_SUPPLY_SETTINGS_ON_QUERY on SUPPLY_SETTINGS (QUERY_ID)^
create index IDX_SUPPLY_SETTINGS_ON_QUERY_POSITION_MOVEMENTS on SUPPLY_SETTINGS (QUERY_POSITION_MOVEMENTS_ID)^
create index IDX_SUPPLY_SETTINGS_ON_QUERY_POSITION_STAGE_DATA on SUPPLY_SETTINGS (QUERY_POSITION_STAGE_DATA_ID)^
create index IDX_SUPPLY_SETTINGS_ON_QUERY_POSITION_STAGE_DATA_ITEM on SUPPLY_SETTINGS (QUERY_POSITION_STAGE_DATA_ITEM_ID)^
create index IDX_SUPPLY_SETTINGS_ON_QUERY_WORKFLOW on SUPPLY_SETTINGS (QUERY_WORKFLOW_ID)^
create index IDX_SUPPLY_SETTINGS_ON_QUERY_WORKFLOW_DETAIL on SUPPLY_SETTINGS (QUERY_WORKFLOW_DETAIL_ID)^
create index IDX_SUPPLY_SETTINGS_ON_STAGE_TERM on SUPPLY_SETTINGS (STAGE_TERM_ID)^
create index IDX_SUPPLY_SETTINGS_ON_STORE on SUPPLY_SETTINGS (STORE_ID)^
create index IDX_SUPPLY_SETTINGS_ON_SUPPLIERS_SUGGESTION on SUPPLY_SETTINGS (SUPPLIERS_SUGGESTION_ID)^
create index IDX_SUPPLY_SETTINGS_ON_URGENCY on SUPPLY_SETTINGS (URGENCY_ID)^
create index IDX_SUPPLY_SETTINGS_ON_VOTE on SUPPLY_SETTINGS (VOTE_ID)^
create index IDX_SUPPLY_SETTINGS_ON_NOMENCLATURE on SUPPLY_SETTINGS (NOMENCLATURE_ID)^
create index IDX_SUPPLY_SETTINGS_ON_POSITION_SUPPLIER on SUPPLY_SETTINGS (POSITION_SUPPLIER_ID)^
create index IDX_SUPPLY_SETTINGS_ON_POSITIONS_ANALOGS on SUPPLY_SETTINGS (POSITIONS_ANALOGS_ID)^
create index IDX_SUPPLY_SETTINGS_ON_ANALOGS on SUPPLY_SETTINGS (ANALOGS_ID)^
create index IDX_SUPPLY_SETTINGS_ON_BILLS on SUPPLY_SETTINGS (BILLS_ID)^
create index IDX_SUPPLY_SETTINGS_ON_DELIVERY on SUPPLY_SETTINGS (DELIVERY_ID)^
create index IDX_SUPPLY_SETTINGS_ON_DELIVERY_LINE on SUPPLY_SETTINGS (DELIVERY_LINE_ID)^
create index IDX_SUPPLY_SETTINGS_ON_EMPLOYEE on SUPPLY_SETTINGS (EMPLOYEE_ID)^
create index IDX_SUPPLY_SETTINGS_ON_HOLIDAY on SUPPLY_SETTINGS (HOLIDAY_ID)^
create index IDX_SUPPLY_SETTINGS_ON_COMPANY on SUPPLY_SETTINGS (COMPANY_ID)^
create index IDX_SUPPLY_SETTINGS_ON_SUPPLIERS on SUPPLY_SETTINGS (SUPPLIERS_ID)^
create index IDX_SUPPLY_SETTINGS_ON_DIVISION on SUPPLY_SETTINGS (DIVISION_ID)^
-- end SUPPLY_SETTINGS
