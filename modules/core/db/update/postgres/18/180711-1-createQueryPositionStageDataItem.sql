create table SUPPLY_QUERY_POSITION_STAGE_DATA_ITEM (
    ID uuid,
    VERSION integer not null,
    CREATE_TS timestamp,
    CREATED_BY varchar(50),
    UPDATE_TS timestamp,
    UPDATED_BY varchar(50),
    DELETE_TS timestamp,
    DELETED_BY varchar(50),
    --
    ITEM_NAME varchar(255),
    QUERY_POSITION_STAGE_DATA_ID uuid,
    USER_ID uuid,
    ITEM_TYPE varchar(255),
    ITEM_VALUE varchar(255),
    --
    primary key (ID)
);
