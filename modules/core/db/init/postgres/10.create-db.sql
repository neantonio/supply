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
    WORKFLOW_ID uuid,
    ORIGIN varchar(50),
    CAUSE varchar(50),
    PERIDIOCITY varchar(50),
    WHOLE_QUERY_WORKOUT boolean,
    COMPANY_ID uuid not null,
    DIVISION_ID uuid not null,
    STORE_ID uuid not null,
    CONTACT_ID uuid,
    EXT_ID varchar(255),
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
    EXT_ID varchar(255),
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
    EXT_ID varchar(255),
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
    EXT_ID varchar(255),
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
    CODE varchar(255),
    NAME varchar(5) not null,
    FULL_NAME varchar(25),
    EXT_ID varchar(255),
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
    EXT_ID varchar(255),
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
    USER_ID uuid,
    POSITION_ varchar(255),
    EMAIL varchar(255),
    NAME varchar(50),
    FULL_NAME varchar(255),
    EXT_ID varchar(255),
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
    BILLS_FLAG boolean,
    STORE_CONTROL_FLAG boolean,
    CURRENT_STAGE varchar(50) not null,
    POSITION_TYPE varchar(50) not null,
    NUMBER_ARTICLE varchar(25),
    NOMENCLATURE_ID uuid,
    SPECIFICATION varchar(255),
    MEASURE_UNIT_ID uuid,
    QUANTITY double precision not null,
    ANALOGS_ALLOWED boolean,
    COMMENT_ varchar(1000),
    STORE_ID uuid,
    POSITION_USEFULNESS boolean,
    POSITION_USEFULNESS_TS timestamp,
    SPEC_NOMENCLATURE_ID uuid,
    START_MINIMAL_PRICE double precision,
    NOMECLATURE_CHANGE_ID uuid,
    ANALOGS_CORRECTION_FLAG boolean,
    NOM_CONTROL_FLAG boolean,
    NOM_CONTROL_FLAG_TS timestamp,
    BILLS_FLAG_TS timestamp,
    IN_STORE boolean,
    STORE_CONTROL_FLAG_TS timestamp,
    SUPPLY_WORKOUT_TYPE varchar(50),
    POSITION_ID uuid,
    SRC_STORE_ID uuid,
    SUP_SELECTION_FLAG boolean,
    SUP_SELECTION_FLAG_TS timestamp,
    ANALYSIS_RESULT varchar(50),
    ANALYSIS_FLAG boolean,
    ANALYSIS_FLAG_TS timestamp,
    PRICE_REDUCE boolean,
    MINIMAL_PRICE double precision,
    VOTE_RESULT_ID uuid,
    BILL_QUERY boolean,
    BILLS_ID uuid,
    DELIVERY_ID uuid,
    EXT_ID varchar(255),
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
    EXT_ID varchar(255),
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
    FINISH_TS timestamp,
    STAGE varchar(50) not null,
    USER_ID uuid not null,
    --
    primary key (ID)
)^
-- end SUPPLY_QUERY_POSITION_MOVEMENTS
-- begin SUPPLY_SUPPLIERS_SUGGESTION
create table SUPPLY_SUPPLIERS_SUGGESTION (
    ID uuid,
    VERSION integer not null,
    CREATE_TS timestamp,
    CREATED_BY varchar(50),
    UPDATE_TS timestamp,
    UPDATED_BY varchar(50),
    DELETE_TS timestamp,
    DELETED_BY varchar(50),
    --
    POS_SUP_ID uuid,
    QUANTITY double precision not null,
    PRICE double precision not null,
    SUP_ADDRESS varchar(255),
    TERM integer not null,
    --
    primary key (ID)
)^
-- end SUPPLY_SUPPLIERS_SUGGESTION
-- begin SUPPLY_SUPPLIERS
create table SUPPLY_SUPPLIERS (
    ID uuid,
    VERSION integer not null,
    CREATE_TS timestamp,
    CREATED_BY varchar(50),
    UPDATE_TS timestamp,
    UPDATED_BY varchar(50),
    DELETE_TS timestamp,
    DELETED_BY varchar(50),
    --
    NAME varchar(50),
    EMAIL varchar(255),
    FULL_NAME varchar(255),
    --
    primary key (ID)
)^
-- end SUPPLY_SUPPLIERS
-- begin SUPPLY_POSITION_SUPPLIER
create table SUPPLY_POSITION_SUPPLIER (
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
    SUGGESTION_REQUEST_SEND boolean,
    SELECTED boolean,
    SUPPLIER_ID uuid,
    --
    primary key (ID)
)^
-- end SUPPLY_POSITION_SUPPLIER
-- begin SUPPLY_VOTE
create table SUPPLY_VOTE (
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
    EMP_ID uuid,
    SUGGESTION_ID uuid,
    WEIGHT integer,
    VOTE_TS timestamp,
    --
    primary key (ID)
)^
-- end SUPPLY_VOTE
-- begin SUPPLY_BILLS
create table SUPPLY_BILLS (
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
    PRICE double precision,
    COMPANY_ID uuid,
    SUPPLIER_ID uuid not null,
    TIME_PAYMENT timestamp,
    AMOUNT double precision,
    SUM_CONTROL boolean,
    IMAGE_BILL_ID uuid,
    --
    primary key (ID)
)^
-- end SUPPLY_BILLS
-- begin SUPPLY_PROCURATION
create table SUPPLY_PROCURATION (
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
    EMPLOYEE_ID uuid,
    DATE_ date,
    --
    primary key (ID)
)^
-- end SUPPLY_PROCURATION
-- begin SUPPLY_QUERY_POSITION_STAGE_DATA
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
)^
-- end SUPPLY_QUERY_POSITION_STAGE_DATA
-- begin SUPPLY_QUERY_POSITION_STAGE_DATA_ITEM
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
)^
-- end SUPPLY_QUERY_POSITION_STAGE_DATA_ITEM
-- begin SUPPLY_DELIVERY
create table SUPPLY_DELIVERY (
    ID uuid,
    VERSION integer not null,
    CREATE_TS timestamp,
    CREATED_BY varchar(50),
    UPDATE_TS timestamp,
    UPDATED_BY varchar(50),
    DELETE_TS timestamp,
    DELETED_BY varchar(50),
    --
    DELIVERY_PLAN date not null,
    NUMBER_ varchar(20) not null,
    QUANTITY double precision not null,
    --
    primary key (ID)
)^
-- end SUPPLY_DELIVERY
-- begin SUPPLY_DELIVERY_LINE
create table SUPPLY_DELIVERY_LINE (
    ID uuid,
    VERSION integer not null,
    CREATE_TS timestamp,
    CREATED_BY varchar(50),
    UPDATE_TS timestamp,
    UPDATED_BY varchar(50),
    DELETE_TS timestamp,
    DELETED_BY varchar(50),
    --
    DELIVERY_ID uuid,
    QUANTITY double precision not null,
    DELIVERY_DAY date not null,
    --
    primary key (ID)
)^
-- end SUPPLY_DELIVERY_LINE
-- begin SUPPLY_QUERY_POSITION_STAGE_DATA_ITEM_LINK
create table SUPPLY_QUERY_POSITION_STAGE_DATA_ITEM_LINK (
    QUERY_POSITION_STAGE_DATA_ID uuid,
    QUERY_POSITION_STAGE_DATA_ITEM_ID uuid,
    primary key (QUERY_POSITION_STAGE_DATA_ID, QUERY_POSITION_STAGE_DATA_ITEM_ID)
)^
-- end SUPPLY_QUERY_POSITION_STAGE_DATA_ITEM_LINK
-- begin SUPPLY_QUERIES_POSITION_TOKEN_LINK
create table SUPPLY_QUERIES_POSITION_TOKEN_LINK (
    ID uuid,
    VERSION integer not null,
    CREATE_TS timestamp,
    CREATED_BY varchar(50),
    UPDATE_TS timestamp,
    UPDATED_BY varchar(50),
    DELETE_TS timestamp,
    DELETED_BY varchar(50),
    --
    TOKEN varchar(255),
    --
    primary key (ID)
)^
-- end SUPPLY_QUERIES_POSITION_TOKEN_LINK
-- begin SUPPLY_QUERIES_POSITION_TOKEN_LINK_QUERIES_POSITION_LINK
create table SUPPLY_QUERIES_POSITION_TOKEN_LINK_QUERIES_POSITION_LINK (
    QUERIES_POSITION_TOKEN_LINK_ID uuid,
    QUERIES_POSITION_ID uuid,
    primary key (QUERIES_POSITION_TOKEN_LINK_ID, QUERIES_POSITION_ID)
)^
-- end SUPPLY_QUERIES_POSITION_TOKEN_LINK_QUERIES_POSITION_LINK
