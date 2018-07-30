-- update SUPPLY_BILLS set SUPPLIER_ID = <default_value> where SUPPLIER_ID is null ;
alter table SUPPLY_BILLS alter column SUPPLIER_ID set not null ;
