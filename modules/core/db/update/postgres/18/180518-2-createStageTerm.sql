alter table SUPPLY_STAGE_TERM add constraint FK_SUPPLY_STAGE_TERM_URGENCY foreign key (URGENCY_ID) references SUPPLY_URGENCY(ID);
create index IDX_SUPPLY_STAGE_TERM_URGENCY on SUPPLY_STAGE_TERM (URGENCY_ID);
