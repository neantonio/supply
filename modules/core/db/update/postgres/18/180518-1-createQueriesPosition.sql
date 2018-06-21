create table SUPPLY_QUERIES_POSITION (
    ID uuid,
    VERSION integer not null,
    CREATE_TS timestamp,
    CREATED_BY varchar(50),
    UPDATE_TS timestamp,
    UPDATED_BY varchar(50),
    DELETE_TS timestamp,
    DELETED_BY varchar(50),
    --
    QUERY_ID uuid not null,
    CURRENT_STAGE varchar(50) not null,
    POSITION_TYPE varchar(50) not null,
    NUMBER_ARTICLE varchar(25),
    NOMENCLATURE_ID uuid,
    SPECIFICATION varchar(255),
    MEASURE_UNIT_ID uuid,
    QUANTITY varchar(255) not null,
    ANALOGS_ALLOWED boolean,
    --
    primary key (ID)
);
