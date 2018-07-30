alter table SUPPLY_SETTINGS add constraint FK_SUPPLY_SETTINGS_ON_STAGE_TERM foreign key (STAGE_TERM_ID) references SUPPLY_STAGE_TERM(ID);
create index IDX_SUPPLY_SETTINGS_ON_STAGE_TERM on SUPPLY_SETTINGS (STAGE_TERM_ID);