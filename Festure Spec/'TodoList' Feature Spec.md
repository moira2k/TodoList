# ‘TodoList’ Feature Specification

## Overview 

Today corporate employees deal with abundant tasks and usually these tasks are concurrent processing. People immersed in some task always forget what they should more appropriately be doing at this time. For example, they should attend a meeting or prepare a talk. They should turn to complete Task A, which was assigned earlier and the pre-task was completed right now.

In those scenarios, a 'TodoList' is really suitable for busy people.A to-do item will be created from the app's tab or based on a message of chat or meeting. People can view their to-do items through the teams app, and turn to the other arranged thing in time.

## Architecture

<center><img src=".\images\architecture.svg" alt="Art" style="zoom:20%;" /></center>

## Use Case Diagram

<center><img src=".\images\UseCaseDiagram.svg" alt="Art" style="zoom:80%;" /></center>

## Scenario

### Baseline Scenario: Manage to-do item in Tab

<img src=".\images\todoList.PNG" alt="to-do-list" style="zoom: 67%;" />

1. Show all the to-do item in To-do List.
2. If want to know more details about the item, click the textTab. Then to-do item adaptive card occurred.

<img src=".\images\todoItem.PNG" alt="图像" style="zoom:67%;" />

1. Show the details about the item.

2. If want to update or delete the item, click the corresponding button.

<img src=".\images\updateTodoItem.PNG" alt="img" style="zoom:67%;" />

1. Confirm and then submit.

### Sub Scenario 1: create to-do item based on a Chat message

<img src=".\images\newTodoItem.PNG" alt="newTodoItem" style="zoom:67%;" />

1. Right click on the mouse, select more options to fill the new request of to-do item

### Sub Scenario 2: show to-do item in Chat

<img src=".\images\showTodoItem.PNG" alt="showTodoItem" style="zoom:67%;" />

1. Send the to-do item card in Chat

### Features

* (P0) manage(create, update, delete) to-do items, respond to submit actions in adaptive card
* (P0) add to-do item based on chat message
* (P1) share to-do items with chat members / meeting members
* (P1) show user photos (with SSO)
* (P2) send notifications to users in bot chat