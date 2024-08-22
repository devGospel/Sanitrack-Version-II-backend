## UserManagement Module Task
    - Register user (username, default password, email address, phone number, address(country, state, local gvt,), role,) (DONE - remember to remove the user_name and role_name from the userroles table)
    - Fire user (DONE)
    - get user profile (DONE)
    - edit user profile (cleaner, inspector) (DONE BUT REMEMBER TO TEST COS AT THE TIME OF WORKING, YOU USED MANAGER AND HE DOES NOT HAVE AN ADDRESS)
    - assign role(s) to users (admin) (DONE)
  
## Location Management (Admin)
    - add location (DONE)
    - view all location (DONE)
    - delete location (delete all the facilities/rooms under the location)
    - edit location (DONE)
  
## Facility Management (Admin)
    - add room/facility (DONE)
    - delete room/facility (remove the details of that room as well) (DONE)
    - add room based on location (DONE)
    - edit room (DONE)
    - view all rooms/facility based on flag (DONE)
    - add the start timer and end timer to store how long the staff used to clean a room
    - NB: when the staff deletes a room, do not delete it entirely. Just flag it to 'DELETE'. (DONE)
      - getting unassigned rooms for the purpose of assigning task, get only the 'PRESENT' rooms (DONE)
      <!-- - displaying rooms to cleaner, get only the present rooms ????? -->
      - when admin selects delete, get only 'DELETE' rooms (DONE)
      - do not allow admins to delete a room if it has been assigned to a cleaner and inspector (DONE)
  
## Evidence Management
    - When they click on the evidence tab, all the rooms are displayed to them:
      - using the tasks, use the assigned_room id and get the room name 
    - when they click on it, use the task id and get all the tasks.images and send to the frontend
  
## Task Management
    - Before admin updates a task, check if the image path has a url 
    - Before the admin deletes a task, check if the image path has a url

## Attendance
    - view time staff took to clean rooms assigned to them 
## File Manager
    - Download all the images uploaded 
    - filter documents based on file type 
    - 
## Notification Management 
# MVP Details

## Cleaner Details
- UserName: cleaner-testing
- Password: cleaner
- id: 65a3e4a08e1cd614e43c1c47

## Inspector Details
- UserName: inspector-testing
- Password: inspector
- id: 65a3e48d8e1cd614e43c1c44

## Room Id (Room E testing)
- Name: Room E testing 
- id: 65a3e53f8e1cd614e43c1c4e

## Core MVP Functionalities and their Status 

### Manager: 
    1. Creates users (DONE)
    2. Creates rooms (DONE)
    3. Creates Tasks (DONE)
    4. Assigns inspector to task/room (DONE)
    5. Assigns cleaner to task/room (DONE)

### Inspector: 
    1. Views assigned room (DONE)
    2. Views assigned room task (DONE)
    3. Checks of task (DONE)
    4. Send task not completed to cleaner (DONE): The cleaner sees tasks that isDone property is set to false
    5. Save task: that is, tick the task as complete and update isSubmitted property (DONE)

### Cleaner:
    1. View assigned rooms (DONE)
    2. View assigned rooms tasks (DONE)
    3. Upload task image (DONE)

## Basic Test Carried out
    1. create a room and a task and assign the task to inspector-testing and see if it works
    - What is expected is that only the tasks that 'isSubmitted' is set to false should show 

    2. After a task has been updated for a cleaner, she should not be able to see it anymore (DONE)

    3. If a task isSubmitted property has been set to true, the cleaner and the inspector should not see it 

    4. The inspector should only see images that he has not approved of (DONE)

    5. Cleaner logs in and sees room? (DONE)

    6. Cleaner should only see tasks that has not been done (isDone:false) (DONE)

    7. Cleaner should upload image of task done and the Task.image should contain the url 

    8. Inspector should login and see the rooms assigned to them. rooms that their isSubmitted task is set to false (DONE)

    9. Inspector should click on the room and see the images for the room: (DONE)
    - If no image_url is passed in the frontend, display a black image with disabled checkbox

    10. When the inspector clicks on the checkbox and clicks 'save' button, the details checked should be changed from isDone: false to isDone: true. (DONE)

    11. When all tasks has been set to isDone:true at the click of the button, the property 'isSubmitted' should be set to true and the inspector should not see it anymore. (DONE)


## workflow for login: (DONE)
    The user enters their username and password.
    Checks such as no user found, incorrect passwords, inactive staff is done. 
    If it all passes, we write the query to get the all the available roles for that user from the userrole table. 
        - if the length returned is more than 1, we return the list of available roles and display that in the frontend. when they select a role, we generate their token. 
        - if the role is only 1, we just generate their token and put their role_id in the token 
  
## workflow for rbac: (DONE)
    The admin adds the permissions and the roles. 
    They also assign roles to staffs and assign permissions to roles.
    I as the developer has a constant file that contains the role and their permissions(hand coded)

    In the route, before the user carries out an action, I pass in the valid permission for that route(middlewear) and if the logged in user does not have that permission (it is gotten by checking in the database using the role_id of the logged in user and then check the permissions column (this column contains the ids that references the main permission table)) if the permission the user wants to carry out is found in the permissions table, I allow them else throw an error