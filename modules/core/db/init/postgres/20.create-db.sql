-- begin SUPPLY_QUERY
alter table SUPPLY_QUERY add constraint FK_SUPPLY_QUERY_URGENCY foreign key (URGENCY_ID) references SUPPLY_URGENCY(ID)^
alter table SUPPLY_QUERY add constraint FK_SUPPLY_QUERY_WORKFLOW foreign key (WORKFLOW_ID) references SUPPLY_QUERY_WORKFLOW(ID)^
alter table SUPPLY_QUERY add constraint FK_SUPPLY_QUERY_COMPANY foreign key (COMPANY_ID) references SUPPLY_COMPANY(ID)^
alter table SUPPLY_QUERY add constraint FK_SUPPLY_QUERY_DIVISION foreign key (DIVISION_ID) references SUPPLY_DIVISION(ID)^
alter table SUPPLY_QUERY add constraint FK_SUPPLY_QUERY_STORE foreign key (STORE_ID) references SUPPLY_STORE(ID)^
alter table SUPPLY_QUERY add constraint FK_SUPPLY_QUERY_CONTACT foreign key (CONTACT_ID) references SEC_USER(ID)^
create unique index IDX_SUPPLY_QUERY_UK_NUMBER_ on SUPPLY_QUERY (NUMBER_) where DELETE_TS is null ^
create index IDX_SUPPLY_QUERY_URGENCY on SUPPLY_QUERY (URGENCY_ID)^
create index IDX_SUPPLY_QUERY_WORKFLOW on SUPPLY_QUERY (WORKFLOW_ID)^
create index IDX_SUPPLY_QUERY_COMPANY on SUPPLY_QUERY (COMPANY_ID)^
create index IDX_SUPPLY_QUERY_DIVISION on SUPPLY_QUERY (DIVISION_ID)^
create index IDX_SUPPLY_QUERY_STORE on SUPPLY_QUERY (STORE_ID)^
create index IDX_SUPPLY_QUERY_CONTACT on SUPPLY_QUERY (CONTACT_ID)^
-- end SUPPLY_QUERY
-- begin SUPPLY_COMPANY
create unique index IDX_SUPPLY_COMPANY_UK_NAME on SUPPLY_COMPANY (NAME) where DELETE_TS is null ^
-- end SUPPLY_COMPANY
-- begin SUPPLY_DIVISION
alter table SUPPLY_DIVISION add constraint FK_SUPPLY_DIVISION_COMPANY foreign key (COMPANY_ID) references SUPPLY_COMPANY(ID)^
create index IDX_SUPPLY_DIVISION_COMPANY on SUPPLY_DIVISION (COMPANY_ID)^
-- end SUPPLY_DIVISION
-- begin SUPPLY_STORE
alter table SUPPLY_STORE add constraint FK_SUPPLY_STORE_DIVISION foreign key (DIVISION_ID) references SUPPLY_DIVISION(ID)^
create unique index IDX_SUPPLY_STORE_UK_NAME on SUPPLY_STORE (NAME) where DELETE_TS is null ^
create index IDX_SUPPLY_STORE_DIVISION on SUPPLY_STORE (DIVISION_ID)^
-- end SUPPLY_STORE
-- begin SUPPLY_MEASURE_UNITS
create unique index IDX_SUPPLY_MEASURE_UNITS_UK_NAME on SUPPLY_MEASURE_UNITS (NAME) where DELETE_TS is null ^
create unique index IDX_SUPPLY_MEASURE_UNITS_UK_CODE on SUPPLY_MEASURE_UNITS (CODE) where DELETE_TS is null ^
-- end SUPPLY_MEASURE_UNITS
-- begin SUPPLY_URGENCY
create unique index IDX_SUPPLY_URGENCY_UK_NAME on SUPPLY_URGENCY (NAME) where DELETE_TS is null ^
-- end SUPPLY_URGENCY
-- begin SUPPLY_STAGE_TERM
alter table SUPPLY_STAGE_TERM add constraint FK_SUPPLY_STAGE_TERM_URGENCY foreign key (URGENCY_ID) references SUPPLY_URGENCY(ID)^
create index IDX_SUPPLY_STAGE_TERM_URGENCY on SUPPLY_STAGE_TERM (URGENCY_ID)^
-- end SUPPLY_STAGE_TERM
-- begin SUPPLY_QUERY_WORKFLOW_DETAIL
alter table SUPPLY_QUERY_WORKFLOW_DETAIL add constraint FK_SUPPLY_QUERY_WORKFLOW_DETAIL_QUERY_WORKFLOW foreign key (QUERY_WORKFLOW_ID) references SUPPLY_QUERY_WORKFLOW(ID)^
create index IDX_SUPPLY_QUERY_WORKFLOW_DETAIL_QUERY_WORKFLOW on SUPPLY_QUERY_WORKFLOW_DETAIL (QUERY_WORKFLOW_ID)^
-- end SUPPLY_QUERY_WORKFLOW_DETAIL
-- begin SUPPLY_EMPLOYEE
alter table SUPPLY_EMPLOYEE add constraint FK_SUPPLY_EMPLOYEE_USER foreign key (USER_ID) references SEC_USER(ID)^
create unique index IDX_SUPPLY_EMPLOYEE_UK_USER_ID on SUPPLY_EMPLOYEE (USER_ID) where DELETE_TS is null ^
create index IDX_SUPPLY_EMPLOYEE_USER on SUPPLY_EMPLOYEE (USER_ID)^
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
create index IDX_SUPPLY_QUERIES_POSITION_ON_QUERY on SUPPLY_QUERIES_POSITION (QUERY_ID)^
create index IDX_SUPPLY_QUERIES_POSITION_ON_NOMENCLATURE on SUPPLY_QUERIES_POSITION (NOMENCLATURE_ID)^
create index IDX_SUPPLY_QUERIES_POSITION_ON_MEASURE_UNIT on SUPPLY_QUERIES_POSITION (MEASURE_UNIT_ID)^
create index IDX_SUPPLY_QUERIES_POSITION_ON_STORE on SUPPLY_QUERIES_POSITION (STORE_ID)^
create index IDX_SUPPLY_QUERIES_POSITION_ON_SPEC_NOMENCLATURE on SUPPLY_QUERIES_POSITION (SPEC_NOMENCLATURE_ID)^
create index IDX_SUPPLY_QUERIES_POSITION_ON_NOMECLATURE_CHANGE on SUPPLY_QUERIES_POSITION (NOMECLATURE_CHANGE_ID)^
create index IDX_SUPPLY_QUERIES_POSITION_ON_POSITION on SUPPLY_QUERIES_POSITION (POSITION_ID)^
create index IDX_SUPPLY_QUERIES_POSITION_ON_SRC_STORE on SUPPLY_QUERIES_POSITION (SRC_STORE_ID)^
create index IDX_SUPPLY_QUERIES_POSITION_ON_VOTE_RESULT on SUPPLY_QUERIES_POSITION (VOTE_RESULT_ID)^
-- end SUPPLY_QUERIES_POSITION
-- begin SUPPLY_NOMENCLATURE
alter table SUPPLY_NOMENCLATURE add constraint FK_SUPPLY_NOMENCLATURE_UNIT foreign key (UNIT_ID) references SUPPLY_MEASURE_UNITS(ID)^
alter table SUPPLY_NOMENCLATURE add constraint FK_SUPPLY_NOMENCLATURE_PARENT foreign key (PARENT_ID) references SUPPLY_NOMENCLATURE(ID)^
create unique index IDX_SUPPLY_NOMENCLATURE_UK_ARTICLE on SUPPLY_NOMENCLATURE (ARTICLE) where DELETE_TS is null ^
create unique index IDX_SUPPLY_NOMENCLATURE_UK_NAME on SUPPLY_NOMENCLATURE (NAME) where DELETE_TS is null ^
create index IDX_SUPPLY_NOMENCLATURE_UNIT on SUPPLY_NOMENCLATURE (UNIT_ID)^
create index IDX_SUPPLY_NOMENCLATURE_PARENT on SUPPLY_NOMENCLATURE (PARENT_ID)^
-- end SUPPLY_NOMENCLATURE
-- begin SUPPLY_ANALOGS
alter table SUPPLY_ANALOGS add constraint FK_SUPPLY_ANALOGS_NOMENCLATURE foreign key (NOMENCLATURE_ID) references SUPPLY_NOMENCLATURE(ID)^
alter table SUPPLY_ANALOGS add constraint FK_SUPPLY_ANALOGS_ANALOG foreign key (ANALOG_ID) references SUPPLY_NOMENCLATURE(ID)^
create index IDX_SUPPLY_ANALOGS_NOMENCLATURE on SUPPLY_ANALOGS (NOMENCLATURE_ID)^
create index IDX_SUPPLY_ANALOGS_ANALOG on SUPPLY_ANALOGS (ANALOG_ID)^
-- end SUPPLY_ANALOGS
-- begin SUPPLY_POSITIONS_ANALOGS
alter table SUPPLY_POSITIONS_ANALOGS add constraint FK_SUPPLY_POSITIONS_ANALOGS_ANALOG foreign key (ANALOG_ID) references SUPPLY_NOMENCLATURE(ID)^
alter table SUPPLY_POSITIONS_ANALOGS add constraint FK_SUPPLY_POSITIONS_ANALOGS_QUERIES_POSITION foreign key (QUERIES_POSITION_ID) references SUPPLY_QUERIES_POSITION(ID)^
create index IDX_SUPPLY_POSITIONS_ANALOGS_ANALOG on SUPPLY_POSITIONS_ANALOGS (ANALOG_ID)^
create index IDX_SUPPLY_POSITIONS_ANALOGS_QUERIES_POSITION on SUPPLY_POSITIONS_ANALOGS (QUERIES_POSITION_ID)^
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
alter table SUPPLY_POSITION_SUPPLIER add constraint FK_SUPPLY_POSITION_SUPPLIER_POSITION foreign key (POSITION_ID) references SUPPLY_QUERIES_POSITION(ID)^
alter table SUPPLY_POSITION_SUPPLIER add constraint FK_SUPPLY_POSITION_SUPPLIER_SUPPLIER foreign key (SUPPLIER_ID) references SUPPLY_SUPPLIERS(ID)^
create index IDX_SUPPLY_POSITION_SUPPLIER_POSITION on SUPPLY_POSITION_SUPPLIER (POSITION_ID)^
create index IDX_SUPPLY_POSITION_SUPPLIER_SUPPLIER on SUPPLY_POSITION_SUPPLIER (SUPPLIER_ID)^
-- end SUPPLY_POSITION_SUPPLIER
-- begin SUPPLY_VOTE
alter table SUPPLY_VOTE add constraint FK_SUPPLY_VOTE_ON_POSITION foreign key (POSITION_ID) references SUPPLY_QUERIES_POSITION(ID)^
alter table SUPPLY_VOTE add constraint FK_SUPPLY_VOTE_ON_EMP foreign key (EMP_ID) references SEC_USER(ID)^
alter table SUPPLY_VOTE add constraint FK_SUPPLY_VOTE_ON_SUGGESTION foreign key (SUGGESTION_ID) references SUPPLY_SUPPLIERS_SUGGESTION(ID)^
create index IDX_SUPPLY_VOTE_ON_POSITION on SUPPLY_VOTE (POSITION_ID)^
create index IDX_SUPPLY_VOTE_ON_EMP on SUPPLY_VOTE (EMP_ID)^
create index IDX_SUPPLY_VOTE_ON_SUGGESTION on SUPPLY_VOTE (SUGGESTION_ID)^
-- end SUPPLY_VOTE
