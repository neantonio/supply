alter table SUPPLY_QUERIES_POSITION rename column delivery_id to delivery_id__u73525 ;
drop index IDX_SUPPLY_QUERIES_POSITION_ON_DELIVERY ;
alter table SUPPLY_QUERIES_POSITION rename column bills_flag_ts to bills_flag_ts__u35635 ;
alter table SUPPLY_QUERIES_POSITION rename column bills_flag to bills_flag__u54085 ;
