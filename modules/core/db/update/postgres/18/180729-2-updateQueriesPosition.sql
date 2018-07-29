alter table SUPPLY_QUERIES_POSITION rename column ext_id to ext_id__u89206 ;
alter table SUPPLY_QUERIES_POSITION rename column comment_ to comment___u59634 ;
-- update SUPPLY_QUERIES_POSITION set MEASURE_UNIT_ID = <default_value> where MEASURE_UNIT_ID is null ;
alter table SUPPLY_QUERIES_POSITION alter column MEASURE_UNIT_ID set not null ;
