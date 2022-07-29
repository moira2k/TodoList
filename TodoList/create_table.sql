CREATE TABLE Todo.Users
(
    userId INT IDENTITY PRIMARY KEY,
    ADDId NVARCHAR(128) NOT NULL,
    userName NVARCHAR(128) NOT NULL,
    profileImage NVARCHAR(256) NOT NULL
);

CREATE TABLE Todo.Tasks
(
    taskId INT IDENTITY PRIMARY KEY,
    taskTime NVARCHAR(128) NOT NULL,
    taskStatus TinyInt NOT NULL default 0,
    taskContent NVARCHAR(256),
    creatorId NVARCHAR(128) NOT NULL,
);

CREATE TABLE Todo.Participants 
(
    Id INT IDENTITY PRIMARY KEY,
    taskId INT NOT NULL,
    participantId INT NOT NULL
);

CREATE TABLE Todo.SharedTabs
(
    Id INT IDENTITY PRIMARY KEY,
    userId INT NOT NULL,
    taskId INT NOT NULL
);