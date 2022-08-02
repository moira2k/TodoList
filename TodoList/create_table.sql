CREATE SCHEMA Todo;

CREATE TABLE Todo.Users (
    userId INT IDENTITY PRIMARY KEY,
    ADDId NVARCHAR(128) NOT NULL,
    userName NVARCHAR(128) NOT NULL,
    profileImage NVARCHAR(256) NOT NULL
);

INSERT INTO Todo.Users (ADDId, userName, profileImage)
    VALUES
        ('test', 'Matt Hidinger','https://pbs.twimg.com/profile_images/3647943215/d7f12830b3c17a5a9e4afcc370e3a37e_400x400.jpeg'),
        ('test', 'Alice', 'https://messagecardplayground.azurewebsites.net/assets/person_w1.png'),
        ('test', 'Nicole', 'https://messagecardplayground.azurewebsites.net/assets/person_w2.png'),
        ('test', 'Bob', 'https://messagecardplayground.azurewebsites.net/assets/person_m1.png');

CREATE TABLE Todo.Tasks (
    taskId INT IDENTITY PRIMARY KEY,
    taskTime NVARCHAR(128) NOT NULL,
    taskStatus NVARCHAR(32) NOT NULL default 'Not Started',
    taskContent NVARCHAR(256),
    creatorId INT NOT NULL,
);

-- enum: 'Not Started' 0, 'Processing' 1, 'Finished' 2
INSERT INTO Todo.Tasks (taskTime, taskStatus, taskContent, creatorId)
    VALUES
        ('2022-07-21T18:33:12+08:00', 'Not Started', 'a meeting with supplier representatives in Room602, Building01', 1),
        ('2022-02-22T18:33:12+08:00', 'Processing', 'Follow up orders from X Companies and remind shipments', 1),
        ('2022-08-02T18:33:12+08:00', 'Not Started', 'Follow up orders from X Companies', 3);

CREATE TABLE Todo.Participants (
    Id INT IDENTITY PRIMARY KEY,
    taskId INT NOT NULL,
    participantId INT NOT NULL
);

INSERT INTO Todo.Participants (taskId, participantId)
    VALUES
        (1, 2),
        (1, 3),
        (2, 2);

CREATE TABLE Todo.SharedTabs (
    Id INT IDENTITY PRIMARY KEY,
    userId INT NOT NULL,
    taskId INT NOT NULL
);

INSERT INTO Todo.SharedTabs (userId, taskId)
    VALUE (1, 3);
