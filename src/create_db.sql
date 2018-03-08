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
	word VARCHAR(32) NOT NULL UNIQUE,
	delta INT
);

-- new words
CREATE TABLE novelty (
	word VARCHAR(32) NOT NULL UNIQUE,
	user_frequency INT
);

-- all words in stable tree
CREATE TABLE word_table (
	word VARCHAR(32)
);



-- -- -- debug !!

INSERT INTO novelty (word, user_frequency) 
VALUES ('new', 20), ('dab', 11), ('trendy', 12), ('fakeword', 15);

INSERT INTO modifications (word, delta)
VALUES ('test', 2), ('another', 3), ('this', -1);