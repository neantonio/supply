alter table SUPPLY_NOMENCLATURE add column ISGROUP boolean ;
alter table SUPPLY_NOMENCLATURE add column FULL_NAME varchar(255) ;
alter table SUPPLY_NOMENCLATURE add column ARTICLE varchar(25) ;
alter table SUPPLY_NOMENCLATURE add column UNIT_ID uuid ;
alter table SUPPLY_NOMENCLATURE add column PARENT_ID uuid ;
alter table SUPPLY_NOMENCLATURE add column WEIGHT decimal(10, 3) ;
alter table SUPPLY_NOMENCLATURE add column DIMENSIONS varchar(30) ;
