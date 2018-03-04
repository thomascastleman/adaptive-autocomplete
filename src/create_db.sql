DROP DATABASE IF EXISTS adaptive_complete;
CREATE DATABASE adaptive_complete;

USE adaptive_complete;

-- stable tree backup
CREATE TABLE stable_tree (
	uid INT NOT NULL AUTO_INCREMENT,
	data VARCHAR(1),
	probability FLOAT,
	uid_parent INT,
	PRIMARY KEY (uid)
);

-- temporary table for safe updating of tree serialization
CREATE TABLE swap_tree LIKE stable_tree;

-- modifications table
CREATE TABLE modifications (
	word VARCHAR(32),
	delta INT
);

-- new words
CREATE TABLE novelty (
	word VARCHAR(32),
	user_frequency INT
);




-- debug
INSERT INTO stable_tree (uid, data, probability, uid_parent) VALUES (1, 'v', 2.4, 0);
INSERT INTO stable_tree (uid, data, probability, uid_parent) VALUES (2, 'b', 5.3, 0);
INSERT INTO stable_tree (uid, data, probability, uid_parent) VALUES (3, 'n', 2.1, 1);