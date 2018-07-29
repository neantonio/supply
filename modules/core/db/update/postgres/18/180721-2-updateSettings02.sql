alter table SUPPLY_SETTINGS rename column bytes to bytes__u89801 ;
alter table SUPPLY_SETTINGS alter column bytes__u89801 drop not null ;
