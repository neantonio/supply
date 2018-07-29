alter table SUPPLY_SETTINGS rename column anything to anything__u79829 ;
alter table SUPPLY_SETTINGS alter column anything__u79829 drop not null ;
alter table SUPPLY_SETTINGS add column BYTES bytea ^
update SUPPLY_SETTINGS set BYTES = '' where BYTES is null ;
alter table SUPPLY_SETTINGS alter column BYTES set not null ;
