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

-- debug
INSERT INTO stable_tree (uid, data, probability, uid_parent) VALUES (1, 'v', 2.4, 0);

-- modifications table
CREATE TABLE modifications (
	word VARCHAR(32),
	delta INT
);

-- debug
INSERT INTO modifications (word, delta) VALUES ("testword", -2);


CREATE TABLE novelty (
	word VARCHAR(32),
	user_frequency INT
);

-- debug
INSERT INTO novelty (word, user_frequency) VALUES ("word", 50);