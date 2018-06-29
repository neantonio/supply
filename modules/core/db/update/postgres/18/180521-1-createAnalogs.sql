create table SUPPLY_ANALOGS (
    ID uuid,
    VERSION integer not null,
    CREATE_TS timestamp,
    CREATED_BY varchar(50),
    UPDATE_TS timestamp,
    UPDATED_BY varchar(50),
    DELETE_TS timestamp,
    DELETED_BY varchar(50),
    --
    NOMENCLATURE_ID uuid,
    ANALOG_ID uuid,
    --
    primary key (ID)
);
