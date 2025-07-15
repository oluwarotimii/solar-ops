✦ Okay, this is a fantastic way to think about the mobile application and how permissions will drive its
  functionality. You're essentially asking for a blueprint of the mobile app's user experience and the underlying
  security model.


  Here's a description of what the mobile app experience would be like for Supervisors and Technicians, the
  specific permissions required for each action, and how these permissions will dynamically control the UI.

  ---

  Mobile Application Experience: Roles & Permissions

  The mobile application will provide a tailored experience for Supervisors and Technicians, with UI elements and
  functionalities appearing or disappearing based on the user's assigned role and its associated permissions.

  1. Technician Mobile App Experience


  The Technician's app is focused on executing assigned tasks, tracking progress, and communicating.


   * Dashboard/Home Screen:
       * Displays a list of "My Assigned Jobs" (jobs assigned directly to them).
       * Shows "My Assigned Maintenance Tasks."
       * Provides quick access to "Notifications."
       * UI Impact: Only these sections will be visible. No "Create Job," "Manage Users," or "Live Tracking"
         options.


   * Job Details View:
       * View job title, description, location, scheduled date, instructions.
       * Action: Update Job Status: Buttons like "Start Job," "Mark In Progress," "Complete Job," "On Hold."
       * Action: GPS Tracking: Buttons to "Start Journey," "End Journey," and automatic background GPS logging.
       * Action: Site Check-in/Check-out: Buttons to "Check-in" upon arrival and "Check-out" upon departure.
       * UI Impact: Status update buttons are enabled/disabled based on current job status and jobs:update
         permission. Journey and check-in/out buttons are visible if tracking:start_journey, tracking:end_journey,
         tracking:checkin are granted.


   * Maintenance Details View:
       * View maintenance task details, site location, scheduled date.
       * Action: Update Maintenance Status: Buttons to update the status (e.g., "Mark Completed").
       * UI Impact: Status update buttons are enabled/disabled based on current task status and maintenance:update
         permission.


   * Notifications:
       * View a list of received notifications (e.g., new job assignments, system alerts).
       * Mark notifications as read or delete them.
       * UI Impact: Notification list is visible. "Mark Read" and "Delete" options are available if
         notifications:mark_read and notifications:delete are granted.

  2. Supervisor Mobile App Experience


  The Supervisor's app provides oversight, management capabilities for their team, and access to broader
  operational data. They will have all Technician capabilities, plus additional management tools.


   * Dashboard/Home Screen:
       * Displays "My Assigned Jobs" and "My Assigned Maintenance Tasks" (like a Technician).
       * New Section: Team Overview: Shows a summary of their supervised technicians' statuses (e.g., "Active," "On
         Job," "Available").
       * New Section: Live Technician Tracking: A map view showing real-time locations of their supervised
         technicians.
       * New Section: Team Jobs: A list of all jobs assigned to any technician they supervise.
       * New Section: Reports: Access to high-level operational reports.
       * UI Impact: All Technician sections are visible. Additionally, "Team Overview," "Live Technician Tracking,"
         and "Reports" sections are visible if users:read, tracking:read, and reports:read are granted,
         respectively.


   * Job Management (New Capabilities):
       * Action: Create Job: A form to create new jobs, including assigning them to technicians.
       * Action: Assign/Reassign Job: Ability to assign or reassign jobs to technicians.
       * UI Impact: A "Create Job" button/flow is visible if jobs:create is granted. Assignment options are
         available within job creation/editing if jobs:create or jobs:update is granted.


   * Maintenance Management (New Capabilities):
       * Action: Create Maintenance Task: A form to create new maintenance tasks and assign them to technicians.
       * UI Impact: A "Create Maintenance Task" button/flow is visible if maintenance:create is granted.


   * Job Type Management (New Capabilities):
       * Action: Create Job Type: A form to define new job types.
       * UI Impact: A "Create Job Type" button/flow is visible if job_types:create is granted.


   * Notifications (New Capabilities):
       * Action: Send Notification: Ability to send custom notifications to individual technicians or groups.
       * UI Impact: A "Send Notification" button/flow is visible if notifications:send is granted.

  ---

  Required Permissions for Each Role


  Here's a mapping of the capabilities to the specific permissions needed. These are the permissions you would
  assign to the "Supervisor" and "Technician" roles in your new Role Management dashboard.

  Technician Role Permissions:


   * `jobs:read:assigned`: To view only jobs assigned to them.
   * `jobs:update`: To update the status of their assigned jobs (e.g., "in_progress", "completed").
   * `maintenance:read`: To view their assigned maintenance tasks.
   * `maintenance:update`: To update the status of their assigned maintenance tasks.
   * `tracking:start_journey`: To initiate a work journey.
   * `tracking:end_journey`: To conclude a work journey.
   * `tracking:log_gps`: For automatic GPS logging during a journey.
   * `tracking:checkin`: To check-in/out at job sites.
   * `notifications:read`: To receive and view notifications.
   * `notifications:mark_read`: To mark notifications as read.
   * `notifications:delete`: To delete notifications.
   * `notifications:subscribe`: To subscribe to push notifications.

  Supervisor Role Permissions:


   * `jobs:create`: To create new jobs.
   * `jobs:read:all`: To view all jobs in the system (for assignment and oversight).
   * `jobs:update`: To update job details (including re-assignment).
   * `job_types:create`: To create new job types.
   * `job_types:read`: To view existing job types.
   * `maintenance:create`: To create new maintenance tasks.
   * `maintenance:read`: To view all maintenance tasks.
   * `maintenance:update`: To update maintenance tasks.
   * `users:read`: To view the list of technicians and their basic profiles.
   * `tracking:read`: To view live tracking data for all technicians.
   * `reports:read`: To access and view various system reports.
   * `notifications:read`: To receive and view notifications.
   * `notifications:send`: To send notifications to technicians.
   * `notifications:mark_read`: To mark notifications as read.
   * `notifications:delete`: To delete notifications.
   * `notifications:subscribe`: To subscribe to push notifications.


  Note on "No Delete" for Supervisors: The permissions listed above for Supervisors explicitly exclude
  jobs:delete, job_types:delete, users:delete, roles:delete, and maintenance:delete. This aligns with your
  requirement that Supervisors should not be able to delete anything.