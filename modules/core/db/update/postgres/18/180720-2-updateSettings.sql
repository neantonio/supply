alter table SUPPLY_SETTINGS add column ANYTHING uuid ^
update SUPPLY_SETTINGS set ANYTHING = newid() where ANYTHING is null ;
alter table SUPPLY_SETTINGS alter column ANYTHING set not null ;
