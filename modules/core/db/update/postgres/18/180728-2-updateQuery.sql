alter table SUPPLY_QUERY rename column ext_id to ext_id__u76651 ;
alter table SUPPLY_QUERY rename column contact_id to contact_id__u42261 ;
drop index IDX_SUPPLY_QUERY_ON_CONTACT ;
alter table SUPPLY_QUERY drop constraint FK_SUPPLY_QUERY_ON_CONTACT ;
alter table SUPPLY_QUERY add column CONTACT_ID uuid ;
-- update SUPPLY_QUERY set WORKFLOW_ID = <default_value> where WORKFLOW_ID is null ;
alter table SUPPLY_QUERY alter column WORKFLOW_ID set not null ;
update SUPPLY_QUERY set ORIGIN = 'TransactionSystem' where ORIGIN is null ;
alter table SUPPLY_QUERY alter column ORIGIN set not null ;
update SUPPLY_QUERY set CAUSE = 'Calculation' where CAUSE is null ;
alter table SUPPLY_QUERY alter column CAUSE set not null ;
update SUPPLY_QUERY set PERIDIOCITY = 'Onetime' where PERIDIOCITY is null ;
alter table SUPPLY_QUERY alter column PERIDIOCITY set not null ;
