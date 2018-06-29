alter table SUPPLY_QUERIES_POSITION add column STORE_ID uuid ;
alter table SUPPLY_QUERIES_POSITION add column POSITION_USEFULNESS boolean ;
alter table SUPPLY_QUERIES_POSITION add column POSITION_USEFULNESS_TS timestamp ;
alter table SUPPLY_QUERIES_POSITION add column SPEC_NOMENCLATURE_ID uuid ;
alter table SUPPLY_QUERIES_POSITION add column NOMECLATURE_CHANGE_ID uuid ;
alter table SUPPLY_QUERIES_POSITION add column ANALOGS_CORRECTION_FLAG boolean ;
alter table SUPPLY_QUERIES_POSITION add column NOM_CONTROL_FLAG boolean ;
alter table SUPPLY_QUERIES_POSITION add column NOM_CONTROL_FLAG_TS timestamp ;
