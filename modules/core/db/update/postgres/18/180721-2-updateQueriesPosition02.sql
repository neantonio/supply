alter table SUPPLY_QUERIES_POSITION add constraint FK_SUPPLY_QUERIES_POSITION_BILLS foreign key (BILLS_ID) references SUPPLY_BILLS(ID);
create index IDX_SUPPLY_QUERIES_POSITION_BILLS on SUPPLY_QUERIES_POSITION (BILLS_ID);
