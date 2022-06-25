-- DROP TABLE auth;
-- DROP TABLE ics_data;

CREATE TABLE IF NOT EXISTS auth (
    eth_address char(64) PRIMARY KEY,
    secret_pass varchar(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS ics_data (
    eth_address CHAR(64) PRIMARY KEY,
    ics    BYTEA NOT NULL
);