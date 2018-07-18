create table SUPPLY_QUERY_POSITION_STAGE_DATA (
    ID uuid,
    VERSION integer not null,
    CREATE_TS timestamp,
    CREATED_BY varchar(50),
    UPDATE_TS timestamp,
    UPDATED_BY varchar(50),
    DELETE_TS timestamp,
    DELETED_BY varchar(50),
    --
    POSITION_ID uuid,
    STAGE varchar(50),
    --
    primary key (ID)
);
