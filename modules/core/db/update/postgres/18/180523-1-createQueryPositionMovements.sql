create table SUPPLY_QUERY_POSITION_MOVEMENTS (
    ID uuid,
    VERSION integer not null,
    CREATE_TS timestamp,
    CREATED_BY varchar(50),
    UPDATE_TS timestamp,
    UPDATED_BY varchar(50),
    DELETE_TS timestamp,
    DELETED_BY varchar(50),
    --
    POSITION_ID uuid not null,
    STAGE varchar(50) not null,
    USER_ID uuid not null,
    TIMESTAMP_ timestamp not null,
    --
    primary key (ID)
);
