alter table SUPPLY_STORE add constraint FK_SUPPLY_STORE_DIVISION foreign key (DIVISION_ID) references SUPPLY_DIVISION(ID);
create unique index IDX_SUPPLY_STORE_UK_NAME on SUPPLY_STORE (NAME) where DELETE_TS is null ;
create index IDX_SUPPLY_STORE_DIVISION on SUPPLY_STORE (DIVISION_ID);
