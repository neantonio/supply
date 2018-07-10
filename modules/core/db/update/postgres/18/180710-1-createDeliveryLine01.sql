create table SUPPLY_DELIVERY_LINE (
    ID uuid,
    VERSION integer not null,
    CREATE_TS timestamp,
    CREATED_BY varchar(50),
    UPDATE_TS timestamp,
    UPDATED_BY varchar(50),
    DELETE_TS timestamp,
    DELETED_BY varchar(50),
    --
    DELIVERY_ID uuid,
    QUANTITY double precision not null,
    DELIVERY_DAY date not null,
    --
    primary key (ID)
);
