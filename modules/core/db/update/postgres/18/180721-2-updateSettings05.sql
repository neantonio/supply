alter table SUPPLY_SETTINGS add constraint FK_SUPPLY_SETTINGS_ON_SUPPLIERS foreign key (SUPPLIERS_ID) references SUPPLY_SUPPLIERS(ID);
create index IDX_SUPPLY_SETTINGS_ON_SUPPLIERS on SUPPLY_SETTINGS (SUPPLIERS_ID);