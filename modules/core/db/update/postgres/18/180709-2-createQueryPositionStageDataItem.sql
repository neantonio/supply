alter table SUPPLY_QUERY_POSITION_STAGE_DATA_ITEM add constraint FK_SUPPLY_QUERYPOSITSTAGEDATAITEM_ON_QUERY_POSITION_STAGE_DATA foreign key (QUERY_POSITION_STAGE_DATA_ID) references SUPPLY_QUERY_POSITION_STAGE_DATA(ID);
alter table SUPPLY_QUERY_POSITION_STAGE_DATA_ITEM add constraint FK_SUPPLY_QUERY_POSITION_STAGE_DATA_ITEM_ON_USER foreign key (USER_ID) references SEC_USER(ID);
create index IDX_SUPPLY_QUERPOSISTAGDATAITEM_ON_QUERY_POSITION_STAGE_DATA on SUPPLY_QUERY_POSITION_STAGE_DATA_ITEM (QUERY_POSITION_STAGE_DATA_ID);
create index IDX_SUPPLY_QUERY_POSITION_STAGE_DATA_ITEM_ON_USER on SUPPLY_QUERY_POSITION_STAGE_DATA_ITEM (USER_ID);