-- update SUPPLY_QUERY set URGENCY_ID = <default_value> where URGENCY_ID is null ;
alter table SUPPLY_QUERY alter column URGENCY_ID set not null ;
