alter table SUPPLY_SETTINGS add constraint FK_SUPPLY_SETTINGS_ON_ANALOGS foreign key (ANALOGS_ID) references SUPPLY_ANALOGS(ID);
create index IDX_SUPPLY_SETTINGS_ON_ANALOGS on SUPPLY_SETTINGS (ANALOGS_ID);