create table SUPPLY_QUERY_WORKFLOW_DETAIL (
    ID uuid,
    VERSION integer not null,
    CREATE_TS timestamp,
    CREATED_BY varchar(50),
    UPDATE_TS timestamp,
    UPDATED_BY varchar(50),
    DELETE_TS timestamp,
    DELETED_BY varchar(50),
    --
    SOURCE_STAGE varchar(50) not null,
    DEST_STAGE varchar(50) not null,
    PRIORITY integer,
    CONDITIONS text,
    SCRIPT text,
    QUERY_WORKFLOW_ID uuid,
    --
    primary key (ID)
);
