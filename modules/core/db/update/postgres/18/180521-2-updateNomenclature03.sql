alter table SUPPLY_NOMENCLATURE add constraint FK_SUPPLY_NOMENCLATURE_PARENT foreign key (PARENT_ID) references SUPPLY_NOMENCLATURE(ID);
create index IDX_SUPPLY_NOMENCLATURE_PARENT on SUPPLY_NOMENCLATURE (PARENT_ID);
