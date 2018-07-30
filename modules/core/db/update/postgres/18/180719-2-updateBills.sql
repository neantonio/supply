-- update SUPPLY_BILLS set COMPANY_ID = <default_value> where COMPANY_ID is null ;
alter table SUPPLY_BILLS alter column COMPANY_ID set not null ;
update SUPPLY_BILLS set TIME_PAYMENT = current_timestamp where TIME_PAYMENT is null ;
alter table SUPPLY_BILLS alter column TIME_PAYMENT set not null ;
update SUPPLY_BILLS set AMOUNT = 0 where AMOUNT is null ;
alter table SUPPLY_BILLS alter column AMOUNT set not null ;
update SUPPLY_BILLS set SUM_CONTROL = false where SUM_CONTROL is null ;
alter table SUPPLY_BILLS alter column SUM_CONTROL set not null ;
