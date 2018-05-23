-- begin SUPPLY_QUERY
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
    IN_WORK boolean,
    NUMBER_ varchar(20) not null,
    TIME_CREATION timestamp,
    COMMENT_ text,
    URGENCY_ID uuid not null,
    WORKFLOW_ID uuid not null,
    ORIGIN varchar(50) not null,
    CAUSE varchar(50) not null,
    PERIDIOCITY varchar(50) not null,
    WHOLE_QUERY_WORKOUT boolean,
    COMPANY_ID uuid not null,
    DIVISION_ID uuid not null,
    STORE_ID uuid not null,
    CONTACT_ID uuid,
    --
    primary key (ID)
)^
-- end SUPPLY_QUERY
-- begin SUPPLY_COMPANY
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
)^
-- end SUPPLY_COMPANY
-- begin SUPPLY_DIVISION
create table SUPPLY_DIVISION (
    ID uuid,
    VERSION integer not null,
    CREATE_TS timestamp,
    CREATED_BY varchar(50),
    UPDATE_TS timestamp,
    UPDATED_BY varchar(50),
    DELETE_TS timestamp,
    DELETED_BY varchar(50),
    --
    COMPANY_ID uuid not null,
    NAME varchar(50) not null,
    --
    primary key (ID)
)^
-- end SUPPLY_DIVISION
-- begin SUPPLY_STORE
create table SUPPLY_STORE (
    ID uuid,
    VERSION integer not null,
    CREATE_TS timestamp,
    CREATED_BY varchar(50),
    UPDATE_TS timestamp,
    UPDATED_BY varchar(50),
    DELETE_TS timestamp,
    DELETED_BY varchar(50),
    --
    NAME varchar(50) not null,
    DIVISION_ID uuid,
    --
    primary key (ID)
)^
-- end SUPPLY_STORE
-- begin SUPPLY_MEASURE_UNITS
create table SUPPLY_MEASURE_UNITS (
    ID uuid,
    VERSION integer not null,
    CREATE_TS timestamp,
    CREATED_BY varchar(50),
    UPDATE_TS timestamp,
    UPDATED_BY varchar(50),
    DELETE_TS timestamp,
    DELETED_BY varchar(50),
    --
    CODE varchar(255) not null,
    NAME varchar(5) not null,
    FULL_NAME varchar(25),
    --
    primary key (ID)
)^
-- end SUPPLY_MEASURE_UNITS
-- begin SUPPLY_URGENCY
create table SUPPLY_URGENCY (
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
    --
    primary key (ID)
)^
-- end SUPPLY_URGENCY
-- begin SUPPLY_STAGE_TERM
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
)^
-- end SUPPLY_STAGE_TERM
-- begin SUPPLY_QUERY_WORKFLOW_DETAIL
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
    VALIDATION text,
    VALIDATION_SCRIPT text,
    CONDITIONS text,
    SCRIPT text,
    QUERY_WORKFLOW_ID uuid,
    --
    primary key (ID)
)^
-- end SUPPLY_QUERY_WORKFLOW_DETAIL
-- begin SUPPLY_QUERY_WORKFLOW
create table SUPPLY_QUERY_WORKFLOW (
    ID uuid,
    VERSION integer not null,
    CREATE_TS timestamp,
    CREATED_BY varchar(50),
    UPDATE_TS timestamp,
    UPDATED_BY varchar(50),
    DELETE_TS timestamp,
    DELETED_BY varchar(50),
    --
    NAME varchar(50) not null,
    --
    primary key (ID)
)^
-- end SUPPLY_QUERY_WORKFLOW
-- begin SUPPLY_EMPLOYEE
create table SUPPLY_EMPLOYEE (
    ID uuid,
    VERSION integer not null,
    CREATE_TS timestamp,
    CREATED_BY varchar(50),
    UPDATE_TS timestamp,
    UPDATED_BY varchar(50),
    DELETE_TS timestamp,
    DELETED_BY varchar(50),
    --
    USER_ID uuid not null,
    --
    primary key (ID)
)^
-- end SUPPLY_EMPLOYEE
-- begin SUPPLY_QUERIES_POSITION
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
    MEASURE_UNIT_ID uuid not null,
    QUANTITY varchar(255) not null,
    ANALOGS_ALLOWED boolean,
    STORE_ID uuid,
    POSITION_USEFULNESS boolean,
    POSITION_USEFULNESS_TS timestamp,
    SPEC_NOMENCLATURE_ID uuid,
    NOMECLATURE_CHANGE_ID uuid,
    ANALOGS_CORRECTION_FLAG boolean,
    NOM_CONTROL_FLAG boolean,
    NOM_CONTROL_FLAG_TS timestamp,
    --
    primary key (ID)
)^
-- end SUPPLY_QUERIES_POSITION
-- begin SUPPLY_NOMENCLATURE
create table SUPPLY_NOMENCLATURE (
    ID uuid,
    VERSION integer not null,
    CREATE_TS timestamp,
    CREATED_BY varchar(50),
    UPDATE_TS timestamp,
    UPDATED_BY varchar(50),
    DELETE_TS timestamp,
    DELETED_BY varchar(50),
    --
    NAME varchar(50) not null,
    ISGROUP boolean,
    FULL_NAME varchar(255),
    ARTICLE varchar(25),
    UNIT_ID uuid,
    PARENT_ID uuid,
    WEIGHT decimal(10, 3),
    DIMENSIONS varchar(30),
    --
    primary key (ID)
)^
-- end SUPPLY_NOMENCLATURE
-- begin SUPPLY_ANALOGS
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
)^
-- end SUPPLY_ANALOGS
-- begin SUPPLY_POSITIONS_ANALOGS
create table SUPPLY_POSITIONS_ANALOGS (
    ID uuid,
    VERSION integer not null,
    CREATE_TS timestamp,
    CREATED_BY varchar(50),
    UPDATE_TS timestamp,
    UPDATED_BY varchar(50),
    DELETE_TS timestamp,
    DELETED_BY varchar(50),
    --
    ANALOG_ID uuid,
    QUERIES_POSITION_ID uuid,
    --
    primary key (ID)
)^
-- end SUPPLY_POSITIONS_ANALOGS
-- begin SUPPLY_QUERY_POSITION_MOVEMENTS
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
    --
    primary key (ID)
)^
-- end SUPPLY_QUERY_POSITION_MOVEMENTS
