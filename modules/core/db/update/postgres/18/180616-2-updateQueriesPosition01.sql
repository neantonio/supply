alter table SUPPLY_QUERIES_POSITION add constraint FK_SUPPLY_QUERIES_POSITION_ON_QUERY foreign key (QUERY_ID) references SUPPLY_QUERY(ID);
create index IDX_SUPPLY_QUERIES_POSITION_ON_QUERY on SUPPLY_QUERIES_POSITION (QUERY_ID);
