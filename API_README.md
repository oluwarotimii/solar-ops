# Solar Field Operations Mobile App API Documentation

This document outlines the API endpoints available for the Solar Field Operations mobile application, focusing on access for **Supervisors** and **Technicians**. All authenticated requests require a valid JWT token to be sent as an `httpOnly` cookie after successful login.

## Authentication

### `POST /api/auth/login`

*   **Description:** Authenticates a user and returns a JWT token.
*   **Access:** Public
*   **Request Body:**
    ```json
    {
        "email": "user@example.com",
        "password": "yourpassword"
    }
    ```
*   **Response Body (Success - 200 OK):**
    ```json
    {
        "user": {
            "id": "user-id",
            "email": "user@example.com",
            "firstName": "John",
            "lastName": "Doe",
            "roleId": "role-id",
            "status": "active",
            "createdAt": "timestamp",
            "updatedAt": "timestamp",
            "role": {
                "id": "role-id",
                "name": "Technician",
                "isAdmin": false,
                "permissions": {}
            }
        },
        "email": "user@example.com"
    }
    ```
    *   **Note:** A `token` cookie will be set in the response. The mobile app client should handle this cookie automatically for subsequent requests.
*   **Response Body (Error - 400/401/500):**
    ```json
    {
        "error": "Error message"
    }
    ```

### `POST /api/auth/register`

*   **Description:** Registers a new user with a 'pending' status. Requires admin approval to become 'active'.
*   **Access:** Public
*   **Request Body:**
    ```json
    {
        "email": "newuser@example.com",
        "password": "newpassword",
        "firstName": "New",
        "lastName": "User",
        "phone": "+2348012345678"
    }
    ```
*   **Response Body (Success - 200 OK):**
    ```json
    {
        "message": "Registration successful. Awaiting approval.",
        "userId": "new-user-id"
    }
    ```
*   **Response Body (Error - 400/409/500):**
    ```json
    {
        "error": "Error message"
    }
    ```

## User Management

### `GET /api/users`

*   **Description:** Retrieves a list of all users.
*   **Access:** Admin Only
*   **Response Body (Success - 200 OK):**
    ```json
    [
        {
            "id": "user-id",
            "email": "user@example.com",
            "firstName": "John",
            "lastName": "Doe",
            "phone": "+234...",
            "roleId": "role-id",
            "status": "active",
            "createdAt": "timestamp",
            "updatedAt": "timestamp",
            "role": {
                "id": "role-id",
                "name": "Technician",
                "isAdmin": false,
                "permissions": {}
            }
        }
    ]
    ```

### `PATCH /api/users/{id}/status`

*   **Description:** Updates the status of a specific user.
*   **Access:** Admin Only
*   **Request Body:**
    ```json
    {
        "status": "active" | "pending" | "suspended" | "deactivated"
    }
    ```
*   **Response Body (Success - 200 OK):**
    ```json
    {
        "id": "user-id",
        "status": "active"
    }
    ```

### `GET /api/users/technicians`

*   **Description:** Retrieves a list of all active technicians with their statistics.
*   **Access:** Authenticated (Supervisors and Technicians can access)
*   **Response Body (Success - 200 OK):**
    ```json
    [
        {
            "id": "tech-id",
            "firstName": "Emeka",
            "lastName": "Okafor",
            "email": "tech1@demo.com",
            "phone": "+234...",
            "status": "active",
            "stats": {
                "totalJobs": 10,
                "completedJobs": 8,
                "avgRating": 4.5,
                "totalEarned": 500000
            }
        }
    ]
    ```

## Job Management

### `GET /api/jobs`

*   **Description:** Retrieves a list of jobs. Admins see all jobs; Technicians see only jobs assigned to them.
*   **Access:** Authenticated (Supervisors and Technicians can access)
*   **Response Body (Success - 200 OK):**
    ```json
    [
        {
            "id": "job-id",
            "title": "Solar Panel Installation",
            "description": "Install 20 panels...",
            "jobType": {
                "id": "job-type-id",
                "name": "Solar Installation",
                "color": "#10B981"
            },
            "assignedUser": {
                "firstName": "Emeka",
                "lastName": "Okafor"
            },
            "status": "assigned",
            "priority": "high",
            "locationAddress": "15 Ahmadu Bello Way, Lagos",
            "scheduledDate": "2025-07-15T00:00:00.000Z",
            "jobValue": 750000,
            "estimatedDuration": 480
        }
    ]
    ```

### `POST /api/jobs`

*   **Description:** Creates a new job.
*   **Access:** Admin Only
*   **Request Body:**
    ```json
    {
        "title": "New Job Title",
        "description": "Job description",
        "jobTypeId": "job-type-id",
        "locationAddress": "123 Main St, City",
        "priority": "medium",
        "scheduledDate": "2025-08-01",
        "estimatedDuration": 240,
        "jobValue": 150000,
        "instructions": "Special instructions",
        "assignedTechnicians": [
            {
                "technicianId": "tech-id",
                "sharePercentage": 100,
                "role": "lead"
            }
        ]
    }
    ```
*   **Response Body (Success - 200 OK):**
    ```json
    {
        "id": "new-job-id",
        "message": "Job created successfully"
    }
    ```

### `DELETE /api/jobs/{id}`

*   **Description:** Deletes a job.
*   **Access:** Admin Only
*   **Response Body (Success - 200 OK):**
    ```json
    {
        "message": "Job deleted successfully"
    }
    ```

## Job Types

### `GET /api/job-types`

*   **Description:** Retrieves a list of all available job types.
*   **Access:** Authenticated (Supervisors and Technicians can access)
*   **Response Body (Success - 200 OK):**
    ```json
    [
        {
            "id": "job-type-id",
            "name": "Solar Installation",
            "description": "New solar panel installation",
            "color": "#10B981"
        }
    ]
    ```

### `POST /api/job-types`

*   **Description:** Creates a new job type.
*   **Access:** Admin Only
*   **Request Body:**
    ```json
    {
        "name": "New Job Type",
        "description": "Description of new job type",
        "color": "#RRGGBB"
    }
    ```
*   **Response Body (Success - 201 Created):**
    ```json
    {
        "id": "new-job-type-id",
        "name": "New Job Type",
        "description": "Description of new job type",
        "color": "#RRGGBB"
    }
    ```

### `DELETE /api/job-types/{id}`

*   **Description:** Deletes a job type.
*   **Access:** Admin Only
*   **Response Body (Success - 200 OK):**
    ```json
    {
        "message": "Job deleted successfully"
    }
    ```

## Maintenance

### `GET /api/maintenance`

*   **Description:** Retrieves a list of maintenance tasks.
*   **Access:** Authenticated (Supervisors and Technicians can access)
*   **Response Body (Success - 200 OK):**
    ```json
    [
        {
            "id": "task-id",
            "title": "Monthly Panel Cleaning",
            "description": "Clean all solar panels...",
            "siteLocation": "100 Herbert Macaulay Way, Lagos",
            "assignedTo": "tech-id",
            "assignedUser": {
                "firstName": "Emeka",
                "lastName": "Okafor"
            },
            "createdBy": "admin-id",
            "createdUser": {
                "firstName": "John",
                "lastName": "Admin"
            },
            "status": "scheduled",
            "priority": "medium",
            "scheduledDate": "2025-07-15T00:00:00.000Z",
            "recurrenceType": "monthly",
            "recurrenceInterval": 1
        }
    ]
    ```

### `POST /api/maintenance`

*   **Description:** Creates a new maintenance task.
*   **Access:** Authenticated (Supervisors and Technicians can access)
*   **Request Body:**
    ```json
    {
        "title": "New Maintenance Task",
        "description": "Task description",
        "siteLocation": "Site address",
        "assignedTo": "technician-id",
        "scheduledDate": "2025-08-01",
        "priority": "high",
        "recurrenceType": "monthly",
        "recurrenceInterval": 1
    }
    ```
*   **Response Body (Success - 200 OK):**
    ```json
    {
        "id": "new-task-id",
        "message": "Maintenance task created successfully"
    }
    ```

### `PATCH /api/maintenance/{id}/status`

*   **Description:** Updates the status of a maintenance task. If the task is recurring and completed, it creates the next occurrence.
*   **Access:** Authenticated (Supervisors and Technicians can access)
*   **Request Body:**
    ```json
    {
        "status": "scheduled" | "in_progress" | "completed" | "overdue"
    }
    ```
*   **Response Body (Success - 200 OK):**
    ```json
    {
        "message": "Task status updated successfully"
    }
    ```

## Tracking

### `GET /api/tracking/technicians`

*   **Description:** Retrieves real-time location and job status for active technicians.
*   **Access:** Authenticated (Supervisors and Technicians can access)
*   **Response Body (Success - 200 OK):**
    ```json
    [
        {
            "user": {
                "id": "tech-id",
                "firstName": "Emeka",
                "lastName": "Okafor",
                "email": "tech1@demo.com",
                "phone": "+234..."
            },
            "currentJob": {
                "id": "job-id",
                "title": "Solar Panel Installation",
                "locationAddress": "15 Ahmadu Bello Way, Lagos",
                "status": "in_progress"
            },
            "lastGPSLog": {
                "latitude": 6.4281,
                "longitude": 3.4219,
                "timestamp": "2025-07-10T10:30:00.000Z",
                "journeyType": "active"
            },
            "status": "active",
            "isTracking": true,
            "journeyStartTime": "2025-07-10T09:00:00.000Z"
        }
    ]
    ```

### `POST /api/tracking/start-journey`

*   **Description:** Records the start of a technician's journey.
*   **Access:** Authenticated (Technicians can access)
*   **Request Body:**
    ```json
    {
        "jobId": "job-id",
        "latitude": 6.4281,
        "longitude": 3.4219
    }
    ```
*   **Response Body (Success - 200 OK):**
    ```json
    {
        "success": true,
        "message": "Journey tracking started"
    }
    ```

### `POST /api/tracking/end-journey`

*   **Description:** Records the end of a technician's journey.
*   **Access:** Authenticated (Technicians can access)
*   **Request Body:**
    ```json
    {
        "jobId": "job-id",
        "latitude": 6.4281,
        "longitude": 3.4219
    }
    ```
*   **Response Body (Success - 200 OK):**
    ```json
    {
        "success": true,
        "message": "Journey tracking ended - back to base"
    }
    ```

### `POST /api/tracking/gps`

*   **Description:** Logs a technician's GPS location.
*   **Access:** Authenticated (Technicians can access)
*   **Request Body:**
    ```json
    {
        "jobId": "job-id",
        "latitude": 6.4281,
        "longitude": 3.4219,
        "accuracy": 10,
        "journeyType": "active"
    }
    ```
*   **Response Body (Success - 200 OK):**
    ```json
    {
        "success": true,
        "message": "GPS location logged successfully"
    }
    ```

### `POST /api/tracking/checkin`

*   **Description:** Records a technician's check-in or check-out at a job site.
*   **Access:** Authenticated (Technicians can access)
*   **Request Body:**
    ```json
    {
        "jobId": "job-id",
        "type": "checkin" | "checkout",
        "latitude": 6.4281,
        "longitude": 3.4219,
        "notes": "Arrived at site"
    }
    ```
*   **Response Body (Success - 200 OK):**
    ```json
    {
        "success": true,
        "message": "Successfully checked in"
    }
    ```

## Notifications

### `GET /api/notifications`

*   **Description:** Retrieves a list of notifications for the authenticated user.
*   **Access:** Authenticated (Supervisors and Technicians can access)
*   **Response Body (Success - 200 OK):**
    ```json
    []
    ```
    *   **Note:** This endpoint currently returns an empty array as a placeholder. In a full implementation, it would return a list of notification objects.

### `POST /api/notifications/send`

*   **Description:** Sends a notification to a specific recipient.
*   **Access:** Authenticated (Supervisors and Technicians can access)
*   **Request Body:**
    ```json
    {
        "title": "Notification Title",
        "message": "Notification message content",
        "type": "job_assignment" | "maintenance_reminder" | "system_alert",
        "recipientId": "user-id"
    }
    ```
*   **Response Body (Success - 200 OK):**
    ```json
    {
        "message": "Notification sent successfully"
    }
    ```

### `PATCH /api/notifications/{id}/read`

*   **Description:** Marks a specific notification as read.
*   **Access:** Authenticated (Supervisors and Technicians can access)
*   **Response Body (Success - 200 OK):**
    ```json
    {
        "message": "Notification marked as read"
    }
    ```

### `DELETE /api/notifications/{id}`

*   **Description:** Deletes a specific notification.
*   **Access:** Authenticated (Supervisors and Technicians can access)
*   **Response Body (Success - 200 OK):**
    ```json
    {
        "message": "Notification deleted"
    }
    ```

### `POST /api/notifications/subscribe`

*   **Description:** Subscribes a user to push notifications.
*   **Access:** Authenticated (Supervisors and Technicians can access)
*   **Request Body:**
    ```json
    {
        "subscription": {
            "endpoint": "...",
            "keys": {
                "p256dh": "...",
                "auth": "..."
            }
        }
    }
    ```
*   **Response Body (Success - 200 OK):**
    ```json
    {
        "success": true,
        "message": "Push subscription saved successfully"
    }
    ```

## Reports

### `GET /api/dashboard/reports`

*   **Description:** Retrieves various dashboard statistics and reports.
*   **Access:** Authenticated (Supervisors and Technicians can access)
*   **Query Parameters:**
    *   `type`: `overview` (default) | `jobs` | `technicians` | `trends`
    *   `range`: `7` (last 7 days) | `30` (last 30 days) | `90` (last 90 days) | `365` (last year)
*   **Response Body (Success - 200 OK):**
    ```json
    {
        "totalJobs": 100,
        "activeJobs": 10,
        "completedJobs": 90,
        "activeTechnicians": 5,
        "pendingMaintenance": 3,
        "totalRevenue": 15000000,
        "jobTypeStats": [], // Only if type=jobs
        "technicianPerformance": [], // Only if type=technicians
        "monthlyTrends": [] // Only if type=trends
    }
    ```

## Settings

### `GET /api/settings`

*   **Description:** Retrieves system settings.
*   **Access:** Authenticated (Supervisors and Technicians can access)
*   **Response Body (Success - 200 OK):**
    ```json
    {}
    ```
    *   **Note:** This endpoint currently returns an empty object as a placeholder. In a full implementation, it would return various system settings.

### `PUT /api/settings`

*   **Description:** Updates system settings.
*   **Access:** Admin Only
*   **Request Body:** (Example - actual fields depend on implementation)
    ```json
    {
        "companyName": "Solar Ops Inc.",
        "emailNotifications": true,
        "autoAssignJobs": false
    }
    ```
*   **Response Body (Success - 200 OK):**
    ```json
    {
        "message": "Settings updated successfully"
    }
    ```

## Roles

### `GET /api/roles`

*   **Description:** Retrieves a list of all available user roles.
*   **Access:** Admin Only
*   **Response Body (Success - 200 OK):**
    ```json
    [
        {
            "id": "role-id",
            "name": "Super Admin"
        }
    ]
    ```