create table SUPPLY_STAGE_TERM (
    ID uuid,
    VERSION integer not null,
    CREATE_TS timestamp,
    CREATED_BY varchar(50),
    UPDATE_TS timestamp,
    UPDATED_BY varchar(50),
    DELETE_TS timestamp,
    DELETED_BY varchar(50),
    --
    URGENCY_ID uuid not null,
    STAGE varchar(50) not null,
    TIME_ integer,
    --
    primary key (ID)
);
