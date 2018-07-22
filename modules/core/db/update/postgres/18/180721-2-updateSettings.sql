alter table SUPPLY_SETTINGS rename column anything to anything__u06296 ;
alter table SUPPLY_SETTINGS alter column anything__u06296 drop not null ;
alter table SUPPLY_SETTINGS add column ANYTHING bytea ^
update SUPPLY_SETTINGS set ANYTHING = '' where ANYTHING is null ;
alter table SUPPLY_SETTINGS alter column ANYTHING set not null ;
