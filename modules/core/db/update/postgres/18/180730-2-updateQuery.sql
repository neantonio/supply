alter table SUPPLY_QUERY rename column contact_id to contact_id__u15141 ;
drop index IDX_SUPPLY_QUERY_ON_CONTACT ;
alter table SUPPLY_QUERY drop constraint FK_SUPPLY_QUERY_ON_CONTACT ;
alter table SUPPLY_QUERY add column CONTACT_ID uuid ;
alter table SUPPLY_QUERY add column EXT_ID varchar(255) ;
alter table SUPPLY_QUERY alter column WORKFLOW_ID drop not null ;
alter table SUPPLY_QUERY alter column ORIGIN drop not null ;
alter table SUPPLY_QUERY alter column CAUSE drop not null ;
alter table SUPPLY_QUERY alter column PERIDIOCITY drop not null ;
