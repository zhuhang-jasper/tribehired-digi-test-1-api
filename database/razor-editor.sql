-- Check DATABASE VERISON
SELECT VERSION() ;

/* DATABASE SETUP SCRIPTS */
DROP DATABASE IF EXISTS tribehired_digi_test;
CREATE DATABASE tribehired_digi_test CHARACTER SET 'utf8mb4' COLLATE 'utf8mb4_unicode_ci';

-- Create new USER for nodejs
CREATE USER 'digix_node'@'localhost' IDENTIFIED WITH mysql_native_password BY '!pass@digi!';
GRANT ALL PRIVILEGES ON tribehired_digi_test.* TO 'digix_node'@'localhost';
flush privileges;
SELECT user FROM mysql.user;

-- Create Account Table
DROP TABLE tribehired_digi_test.account;
CREATE TABLE tribehired_digi_test.account
(Id INT NOT NULL AUTO_INCREMENT,
Email VARCHAR(45) NOT NULL,
Name VARCHAR(45) NOT NULL,
Password VARCHAR(256) NOT NULL,
CreatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
UpdatedDate TIMESTAMP,
CreatedBy VARCHAR(25),
UpdatedBy VARCHAR(25),
PRIMARY KEY (Id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE UNIQUE INDEX Index_Account_Email_Unique ON tribehired_digi_test.account (Email);
CREATE INDEX Index_Account_Name ON tribehired_digi_test.account (Name);


-- Some useful queries
delete from account where 1=1;
