alter table SUPPLY_EMPLOYEE rename column position_ to position___u89922 ;
alter table SUPPLY_EMPLOYEE rename column ext_id to ext_id__u22187 ;
alter table SUPPLY_EMPLOYEE rename column full_name to full_name__u26327 ;
alter table SUPPLY_EMPLOYEE rename column name to name__u69851 ;
alter table SUPPLY_EMPLOYEE rename column email to email__u97088 ;
-- update SUPPLY_EMPLOYEE set USER_ID = <default_value> where USER_ID is null ;
alter table SUPPLY_EMPLOYEE alter column USER_ID set not null ;
