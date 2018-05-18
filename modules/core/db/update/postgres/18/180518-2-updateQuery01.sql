alter table SUPPLY_QUERY add constraint FK_SUPPLY_QUERY_CONTACT foreign key (CONTACT_ID) references SEC_USER(ID);
create index IDX_SUPPLY_QUERY_CONTACT on SUPPLY_QUERY (CONTACT_ID);
