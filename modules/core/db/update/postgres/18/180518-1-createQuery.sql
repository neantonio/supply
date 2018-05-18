create table SUPPLY_QUERY (
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
    TIME_CREATION timestamp,
    COMMENT_ text,
    URGENCY_ID uuid,
    WORKFLOW_ID uuid not null,
    ORIGIN varchar(50) not null,
    CAUSE varchar(50) not null,
    PERIDIOCITY varchar(50) not null,
    WHOLE_QUERY_WORKOUT boolean,
    COMPANY_ID uuid not null,
    DIVISION_ID uuid not null,
    STORE_ID uuid not null,
    --
    primary key (ID)
);
