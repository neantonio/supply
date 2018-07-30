alter table SUPPLY_EMPLOYEE rename column ext_id to ext_id__u55199 ;
alter table SUPPLY_EMPLOYEE rename column full_name to full_name__u86736 ;
alter table SUPPLY_EMPLOYEE rename column name to name__u22618 ;
alter table SUPPLY_EMPLOYEE rename column email to email__u87335 ;
-- update SUPPLY_EMPLOYEE set USER_ID = <default_value> where USER_ID is null ;
alter table SUPPLY_EMPLOYEE alter column USER_ID set not null ;
