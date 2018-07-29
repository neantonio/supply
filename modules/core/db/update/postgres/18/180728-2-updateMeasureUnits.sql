alter table SUPPLY_MEASURE_UNITS rename column ext_id to ext_id__u21192 ;
-- update SUPPLY_MEASURE_UNITS set CODE = <default_value> where CODE is null ;
alter table SUPPLY_MEASURE_UNITS alter column CODE set not null ;
