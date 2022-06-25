CREATE TABLE IF NOT EXISTS addr_pub_keys (
    eth_address CHAR(42) PRIMARY KEY,
    public_key VARCHAR(65) NOT NULL
);