# ‘To-do List’ Feature Specification

## Overview 

Adaptive Card tabs are a new way to build tabs in Teams. Compare to embed web content in an IFrame,  designing adaptive cards is simpler and requires less prerequisite. Now we have some examples, e.g. "to-do list App", using the react framework for front-end development but lack an entire teams app example of using Adaptive Card. We want to create a to-do list using adaptive cards and some other tools and document the pros and cons of adaptive cards. The goal of the project is to provide developer experience and demonstrate the use of our technology.

## Technologies and tools

### Adaptive Cards

Adaptive Cards are platform-agnostic snippets of UI, authored in JSON, that apps and services can openly exchange. When delivered to a specific app, the JSON is transformed into native UI that automatically adapts to its surroundings. It helps design and integrate light-weight UI for all major platforms and frameworks.

References: https://adaptivecards.io/

### Single Sign-On (SSO)

SSO within Teams is an authentication method that uses an app user's Teams identity to provide them access to your app. A user who has logged into Teams doesn't need to log in again to your app within the Teams environment. With only a consent required from the app user, the Teams app retrieves access details for them from Azure Active Directory (AD). After the app user has given consent, they can access the app even from other devices without having to be validated again.

References: https://docs.microsoft.com/en-us/microsoftteams/platform/concepts/authentication/authentication

### People Picker

People Picker helps users to search and select users in Adaptive Card. It works across chats, channels, task modules, and tabs. People Picker supports the following features: searches single or multiple users、selects single or multiple users、reassigns to single or multiple users、prepopulates the name of selected users.

References: https://docs.microsoft.com/en-us/microsoftteams/platform/task-modules-and-cards/cards/people-picker?tabs=desktop#dataset

### Microsoft Graph

Microsoft Graph is the gateway to data and intelligence in Microsoft 365. It provides a unified programmability model that you can use to access the tremendous amount of data in Microsoft 365, Windows, and Enterprise Mobility + Security. Microsoft Teams can utilize Teams data with Microsoft Graph to automate team lifecycles, Resource-specific consent and so on.

References: https://docs.microsoft.com/en-us/graph/toolkit/overview

## Use Case Diagram

<center><img src=".\images\UseCaseDiagram.png" alt="UseCaseDiagram" style="zoom:20%;" /></center>

## Scenario

### Baseline Scenario: Manage to-do item in Tab

<center><img src=".\images\scenario1.PNG" alt="scenario1" style="zoom: 20%;" /></center>

​	To-do Tab is consist of a "To-do List Card" (Figure 1-1) and a "To-do Item Card" (Figure 1-2), showing the To-do item you created.

​	"To-do List Card" Show all the to-do items. Click on the to-do item, the following "To-do Item Card" shows the details.

 	1. If you want to edit the to-do item, you can click the drop-down button. Modification options will be expanded. You can change date, status, participants and content of the task. Complete the changes and send click the Confirm button. 
 	2. If you want to delete the item, click the corresponding trash button.
 	3. Add a new to-do item. You cannot set the status, the default is not started.

### Scenario 2 (Sub): create to-do item based on a Chat message

<center><img src=".\images\scenario2.PNG" alt="scenario2" style="zoom: 20%;" /></center>

1. Right click on the mouse, select "More actions" to create a request of a new To-do Item. The "New To-do Item Card" will pop up and the message text will be filled with the initial content text.

### Scenario 3 (Sub): share to-do item with chat members / meeting members

<center><img src=".\images\scenario3.PNG" alt="scenario3" style="zoom: 20%;" /></center>

1. You can share your to-do item with others in the "To-do Item Card" of your own "To-do Tab". If you share it with User A, the to-do item will show up in the User A's "To-do Shared With Me Tab". He can track your progress on this to-do item.

### Scenario 4 (Sub): Daily Notification

<center><img src=".\images\scenario4.PNG" alt="scenario4" style="zoom: 20%;" /></center>

1. The To-do Notification Bot will notify users of their Daily To-do List every morning.

## Features

1. [P0] Manage(create, update, delete) to-do items

   ​    1.1 Request and respond to these actions in "To-do List Tab"

2. [P0] Add to do item based on chat message

3. [P1] Share to-do item with others

   ​    3.1 view and track items in "Shared With Me Tab"

   ​    3.2 select the people to share with (People picker)

4. [P1] show user photos (with SSO)

5. [P2] Send notification

6. Stretch goal: Add source (chat name/meeting name) for to-do item