alter table SUPPLY_QUERY rename column contact_id to contact_id__u92596 ;
drop index IDX_SUPPLY_QUERY_CONTACT ;
alter table SUPPLY_QUERY drop constraint FK_SUPPLY_QUERY_CONTACT ;
alter table SUPPLY_QUERY add column CONTACT_ID uuid ;
alter table SUPPLY_QUERY add column EXT_ID varchar(255) ;
