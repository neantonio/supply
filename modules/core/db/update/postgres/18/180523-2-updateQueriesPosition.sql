-- update SUPPLY_QUERIES_POSITION set MEASURE_UNIT_ID = <default_value> where MEASURE_UNIT_ID is null ;
alter table SUPPLY_QUERIES_POSITION alter column MEASURE_UNIT_ID set not null ;
