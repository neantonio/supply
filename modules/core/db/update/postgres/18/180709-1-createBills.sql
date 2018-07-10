create table SUPPLY_BILLS (
    ID uuid,
    VERSION integer not null,
    CREATE_TS timestamp,
    CREATED_BY varchar(50),
    UPDATE_TS timestamp,
    UPDATED_BY varchar(50),
    DELETE_TS timestamp,
    DELETED_BY varchar(50),
    --
    NUMBER_ varchar(20) not null,
    COMPANY_ID uuid,
    SUPPLIER_ID uuid not null,
    TIME_PAYMENT timestamp,
    PRICE double precision,
    SUM_CONTROL boolean,
    IMAGE_BILL_ID uuid,
    --
    primary key (ID)
);
