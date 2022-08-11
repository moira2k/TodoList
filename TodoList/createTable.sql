CREATE SCHEMA Todo;

CREATE TABLE Todo.Tasks (
    taskId INT IDENTITY PRIMARY KEY,
    taskTime NVARCHAR(128) NOT NULL,
    taskStatus NVARCHAR(32) NOT NULL default 'Not Started',
    taskContent NVARCHAR(256) NOT NULL,
    creatorAADId NVARCHAR(128) NOT NULL,
);

CREATE TABLE Todo.SharedTabs (
    Id INT IDENTITY PRIMARY KEY,
    userAADId NVARCHAR(128) NOT NULL,
    taskId INT NOT NULL
);

-- CREATE TABLE Todo.Users (
--     AADId NVARCHAR(128) PRIMARY KEY,
--     userId NVARCHAR(128) NOT NULL,
--     userName NVARCHAR(128) NOT NULL,
--     profileImage NVARCHAR(4000) NOT NULL DEFAULT 'data:image/png;base64,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'
-- );

-- INSERT INTO Todo.Users (AADId, userId, userName, profileImage)
--     VALUES
--         ('test1', 'account1', 'Matt Hidinger','https://pbs.twimg.com/profile_images/3647943215/d7f12830b3c17a5a9e4afcc370e3a37e_400x400.jpeg'),
--         ('test2', 'account2','Alice', 'https://messagecardplayground.azurewebsites.net/assets/person_w1.png'),
--         ('test3', 'account3', 'Nicole', 'https://messagecardplayground.azurewebsites.net/assets/person_w2.png'),
--         ('test4', 'account4', 'Bob', 'https://messagecardplayground.azurewebsites.net/assets/person_m1.png');

-- INSERT INTO Todo.Users (AADId, userId, userName)
--     VALUES
--         ('test5', 'account5', 'Smile');

-- delete participant feature
-- CREATE TABLE Todo.Participants (
--     Id INT IDENTITY PRIMARY KEY,
--     taskId INT NOT NULL,
--     participantAADId NVARCHAR(128) NOT NULL
-- );

-- INSERT INTO Todo.Participants (taskId, participantAADId)
--     VALUES
--         (1, 'test2'),
--         (1, 'test3'),
--         (1, 'test5'),
--         (2, 'test2'),
--         (3, 'test2'),
--         (3, 'test4');

-- enum: 'Not Started' 0, 'Processing' 1, 'Finished' 2
-- INSERT INTO Todo.Tasks (taskTime, taskStatus, taskContent, creatorAADId)
--     VALUES
--         ('2022-07-21T18:33:12+08:00', 'Not Started', 'a meeting with supplier representatives in Room602, Building01', 'test1'),
--         ('2022-02-22T18:33:12+08:00', 'Processing', 'Follow up orders from X Companies and remind shipments', 'test1'),
--         ('2022-08-02T18:33:12+08:00', 'Not Started', 'Follow up orders from X Companies', 'test3');

-- INSERT INTO Todo.SharedTabs (userAADId, taskId)
--     VALUES 
--         ('test1', 3),
--         ('test2', 1),
--         ('test3', 1),
--         ('test5', 1),
--         ('test2', 2),
--         ('test2', 3),
--         ('test4', 3);
