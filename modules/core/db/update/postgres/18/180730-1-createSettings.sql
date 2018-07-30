create table SUPPLY_SETTINGS (
    ID uuid,
    VERSION integer not null,
    CREATE_TS timestamp,
    CREATED_BY varchar(50),
    UPDATE_TS timestamp,
    UPDATED_BY varchar(50),
    DELETE_TS timestamp,
    DELETED_BY varchar(50),
    --
    KEY_ varchar(50) not null,
    SAVED_OBJECT text,
    SAVED_ENUM text,
    TEXT varchar(50),
    BOOLEAN_VALUE boolean,
    BIG_DECIMAL_VALUE decimal(19, 2),
    DATE_TIME_VALUE timestamp,
    DATE_VALUE date,
    DOUBLE_VALUE double precision,
    INTEGER_VALUE integer,
    LONG_VALUE bigint,
    TIME_VALUE time,
    --
    primary key (ID)
);
