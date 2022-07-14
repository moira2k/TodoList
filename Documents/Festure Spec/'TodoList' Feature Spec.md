# ‘To-do List’ Feature Specification

## Overview 

Today corporate employees deal with abundant tasks and usually these tasks are concurrent processing. People immersed in some task always forget what they should more appropriately be doing at this time. For example, they should attend a meeting or prepare a talk. They should turn to complete Task A, which was assigned earlier and the pre-task was completed right now.

In those scenarios, a 'To-do List' is really suitable for busy people. A to-do item will be created from the app's tab or based on a message of chat or meeting. People can view their to-do items through the teams app, and turn to the other arranged thing in time.

## Architecture

<center><img src=".\images\architecture.png" alt="Art" style="zoom:20%;" /></center>

## Use Case Diagram

<center><img src=".\images\UseCaseDiagram.png" alt="UseCaseDiagram" style="zoom:20%;" /></center>

## Scenario

### Baseline Scenario: Manage to-do item in Tab

<center><img src=".\images\scenario1.PNG" alt="scenario1" style="zoom: 20%;" /></center>

1. Show all the to-do item in To-do List.
2. If you want to edit the To-do Item, you can click the drop-down button. Modification options will be expanded. Complete the changes and send Confirm. If you want to delete the item, click the corresponding trash button.
3. Add a new To-do Item.

### Scenario 2 (Sub): create to-do item based on a Chat message

<center><img src=".\images\scenario2.PNG" alt="scenario2" style="zoom: 20%;" /></center>

1. Right click on the mouse, select "More actions" to create a request of a new To-do Item. And the message text will be filled with the initial content text.

### Scenario 3 (Sub): share to-do item with chat members / meeting members

<center><img src=".\images\scenario3.PNG" alt="scenario3" style="zoom: 20%;" /></center>

1. Send the To-do Item Card in Chat.

### Scenario 4 (Sub): Daily Notification

<center><img src=".\images\scenario4.PNG" alt="scenario4" style="zoom: 20%;" /></center>

1. A to-do List notification bot will notify users of their Daily To-do List every morning.

### Features

* (P0) manage(create, update, delete) to-do items, respond to submit actions in adaptive card
* (P0) add to-do item based on chat message
* (P1) send the To-do Item Card in Chat
* (P1) show user photos (with SSO)
* (P2) send notifications to users in bot chat