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
    QUERIES_POSITION_ID uuid,
    --
    primary key (ID)
);
