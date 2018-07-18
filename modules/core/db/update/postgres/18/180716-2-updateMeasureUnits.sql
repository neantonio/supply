alter table SUPPLY_MEASURE_UNITS add column EXT_ID varchar(255) ;
alter table SUPPLY_MEASURE_UNITS alter column CODE drop not null ;
