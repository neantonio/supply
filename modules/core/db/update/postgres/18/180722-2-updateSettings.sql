alter table SUPPLY_SETTINGS add column TEXT varchar(50) ;
alter table SUPPLY_SETTINGS add column DIVISION_ID uuid ;
alter table SUPPLY_SETTINGS alter column VALUE_ drop not null ;
