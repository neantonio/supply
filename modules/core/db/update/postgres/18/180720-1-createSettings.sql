create table SUPPLY_SETTINGS (
    ID uuid,
    VERSION integer not null,
    CREATE_TS timestamp,
    CREATED_BY varchar(50),
    UPDATE_TS timestamp,
    UPDATED_BY varchar(50),
    DELETE_TS timestamp,
    DELETED_BY varchar(50),
    --
    KEY_ varchar(50) not null,
    VALUE_ varchar(50) not null,
    --
    primary key (ID)
);
