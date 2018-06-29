alter table SUPPLY_EMPLOYEE add constraint FK_SUPPLY_EMPLOYEE_USER foreign key (USER_ID) references SEC_USER(ID);
create unique index IDX_SUPPLY_EMPLOYEE_UK_USER_ID on SUPPLY_EMPLOYEE (USER_ID) where DELETE_TS is null ;
create index IDX_SUPPLY_EMPLOYEE_USER on SUPPLY_EMPLOYEE (USER_ID);
