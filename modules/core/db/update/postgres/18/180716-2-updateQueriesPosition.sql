alter table SUPPLY_QUERIES_POSITION add column COMMENT_ varchar(1000) ;
alter table SUPPLY_QUERIES_POSITION add column EXT_ID varchar(255) ;
alter table SUPPLY_QUERIES_POSITION alter column MEASURE_UNIT_ID drop not null ;
