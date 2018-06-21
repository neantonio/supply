create table SUPPLY_COMPANY (
    ID uuid,
    VERSION integer not null,
    CREATE_TS timestamp,
    CREATED_BY varchar(50),
    UPDATE_TS timestamp,
    UPDATED_BY varchar(50),
    DELETE_TS timestamp,
    DELETED_BY varchar(50),
    --
    NAME varchar(25) not null,
    FULL_NAME varchar(255),
    INN varchar(13) not null,
    KPP varchar(13),
    --
    primary key (ID)
);
