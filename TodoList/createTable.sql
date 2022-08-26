CREATE USER [{identityName}] FROM EXTERNAL PROVIDER;
go
sp_addrolemember  'db_datareader',  '{identityName}';
go
sp_addrolemember  'db_datawriter',  '{identityName}';
go

CREATE SCHEMA Todo;

CREATE TABLE Todo.Tasks (
    taskId INT IDENTITY PRIMARY KEY,
    dueDate DATETIME NOT NULL,
    currentStatus NVARCHAR(32) NOT NULL default 'Not Started',
    taskContent NVARCHAR(256) NOT NULL,
    creatorId UNIQUEIDENTIFIER NOT NULL
);

CREATE TABLE Todo.SharedItems (
    taskId INT NOT NULL,
    userId UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT SharedWith PRIMARY KEY (taskId, userId),
    FOREIGN KEY (taskId) REFERENCES Todo.Tasks(taskId) ON DELETE CASCADE 
);
