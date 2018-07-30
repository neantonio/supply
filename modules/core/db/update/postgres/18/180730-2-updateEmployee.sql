alter table SUPPLY_EMPLOYEE add column POSITION_ varchar(255) ;
alter table SUPPLY_EMPLOYEE add column EMAIL varchar(255) ;
alter table SUPPLY_EMPLOYEE add column NAME varchar(50) ;
alter table SUPPLY_EMPLOYEE add column FULL_NAME varchar(255) ;
alter table SUPPLY_EMPLOYEE add column EXT_ID varchar(255) ;
alter table SUPPLY_EMPLOYEE alter column USER_ID drop not null ;
