alter table SUPPLY_SETTINGS add constraint FK_SUPPLY_SETTINGS_ON_QUERY_WORKFLOW foreign key (QUERY_WORKFLOW_ID) references SUPPLY_QUERY_WORKFLOW(ID);
create index IDX_SUPPLY_SETTINGS_ON_QUERY_WORKFLOW on SUPPLY_SETTINGS (QUERY_WORKFLOW_ID);
