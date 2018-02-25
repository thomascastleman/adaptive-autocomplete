DROP DATABASE IF EXISTS adaptive_complete;
CREATE DATABASE adaptive_complete;

USE adaptive_complete;

CREATE TABLE test (
	uid INT,
	content TEXT
);


INSERT INTO test (content) VALUES ("Here is some test content");