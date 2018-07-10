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
);
