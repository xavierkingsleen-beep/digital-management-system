# Digital Hostel Management System

A full-stack web application designed to digitize and automate the complete operational workflow of a residential hostel. The system serves two primary roles — hostel administrators (wardens) and students — providing each with a dedicated interface tailored to their responsibilities.

The platform eliminates paper-based processes, reduces manual intervention, and introduces real-time tracking of student movement, attendance, fees, complaints, and leave requests. Every action in the system is validated, logged, and traceable.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Key Objectives](#2-key-objectives)
3. [Core Modules](#3-core-modules)
4. [System Architecture](#4-system-architecture)
5. [Database Design](#5-database-design)
6. [System Workflow](#6-system-workflow)
7. [API Design Overview](#7-api-design-overview)
8. [Frontend Overview](#8-frontend-overview)
9. [Tech Stack](#9-tech-stack)
10. [Validation and Security](#10-validation-and-security)
11. [Real-World Benefits](#11-real-world-benefits)
12. [Limitations](#12-limitations)
13. [Future Enhancements](#13-future-enhancements)
14. [Testing Scenarios](#14-testing-scenarios)
15. [Getting Started](#15-getting-started)
16. [Conclusion](#16-conclusion)

---

## 1. Project Overview

The Digital Hostel Management System is a centralized platform built to manage all aspects of hostel administration through a structured, role-based digital interface. It replaces traditional manual processes — paper registers, physical gate logs, verbal complaint tracking — with a unified system that provides real-time visibility and automated enforcement.

The system is designed around two core principles: accountability and automation. Every student action — entering, exiting, raising a complaint, applying for leave — is recorded with a timestamp and validated against defined rules. Administrators receive a live view of hostel operations without needing to be physically present at every checkpoint.

The platform is built for engineering and professional colleges where hostel discipline, fee management, and student safety are operational priorities.

---

## 2. Key Objectives

- Replace paper-based hostel registers with a structured digital system
- Track student movement in real time using GPS-based location validation
- Automate attendance derivation from actual student movement rather than manual marking
- Provide administrators with a live dashboard showing current hostel occupancy and alerts
- Enforce gate pass discipline by requiring location verification at exit and return
- Eliminate fake attendance by tying presence status directly to physical location
- Streamline fee collection, complaint resolution, and leave approval through digital workflows
- Maintain a complete audit trail of all student and admin actions

---

## 3. Core Modules

### 3.1 Authentication and User Roles

The system supports two distinct roles: Student and Admin. Each role has a separate login interface and access scope.

Students register with their personal and academic details. New registrations are placed in a pending state and require admin approval before the student can log in. This prevents unauthorized access from unverified individuals.

Admins log in through a separate portal and have full visibility and control over all student data, requests, and system settings.

Role-based access control is enforced at both the API level and the frontend routing level. A student cannot access admin routes, and an admin cannot impersonate a student.

The system also includes a device binding feature. When a student logs in for the first time, their device is registered. Subsequent logins from a different device are blocked. If a student needs to switch devices, the admin initiates a reset by sending a one-time OTP to the student's registered email. The student verifies the OTP on a dedicated page, which binds the new device and allows login.

### 3.2 Student Management

Administrators can view all registered students, their profile details, room assignments, fee status, and account approval status. Students are categorized as Approved, Pending, or Rejected.

Each student profile stores:
- Full name, email, roll number, register number
- Department, year of study
- Phone number and parent phone number
- Blood group
- Assigned room
- Fee payment status
- Account status (Pending / Approved / Rejected)

Admins can approve or reject pending registrations directly from the Students panel. Rejected students can re-register using the same email, which resets their status to Pending for re-review.

### 3.3 Room Management

The room management module handles the assignment of students to hostel rooms. Each room has a defined capacity, floor, and type. Administrators can create rooms, assign students, and remove students from rooms.

The system enforces capacity limits — a room cannot be assigned more students than its defined capacity. Before assigning a student, the system checks whether the student is already assigned to another room, preventing duplicate assignments.

When a room is deleted, all student references to that room are automatically cleared, preventing dangling data. Room assignment and removal operations include rollback logic to handle partial failures, ensuring the room list and student records remain consistent.

### 3.4 Gate Pass System

The gate pass module is the most operationally critical component of the system. It governs how students leave and return to the hostel, and it directly drives the attendance system.

**Application:** A student submits a gate pass request specifying the reason, planned exit time, and expected return time. Only one active or pending gate pass is allowed at a time.

**Admin Review:** The admin reviews pending requests and either approves or rejects them. A rejection requires a written reason. Approved passes are visible to the student.

**Student Exit:** After approval, the student initiates exit from within the application. The system requests the student's current GPS location. The exit is only permitted if the student is within 250 meters of the hostel coordinates. This prevents students from marking exit remotely. On successful validation, the gate pass status changes to Exited and the exit timestamp is recorded.

**Student Return:** The student marks their return from within the application. The system again validates GPS location — the student must be within 250 meters of the hostel. Additionally, a minimum gap of 10 minutes from the exit time is enforced to prevent immediate false returns. On successful validation, the gate pass status changes to Returned and the return timestamp is recorded. If the student returns after the expected return time, the record is flagged as a late return.

**Overdue Detection:** If a student's expected return time passes and their status is still Exited, the system automatically marks the gate pass as Overdue. The admin dashboard surfaces overdue students with their exit time, expected return time, and contact information.

**Admin Visibility:** Administrators can view all gate passes filtered by status. A dedicated Overdue tab highlights students who have not returned on time. The admin does not control exit or return — those actions belong exclusively to the student and are validated by location.

### 3.5 Movement-Based Attendance System

The attendance system in this platform does not rely on manual marking as the source of truth. Instead, attendance is derived automatically from student movement as recorded by the gate pass system.

**Core Logic:**
- A student who is inside the hostel is considered Present
- A student who has exited via a gate pass is considered Absent for the duration of their absence
- If a student never exits, they are considered Present for the entire day without any manual action required

**Absence Logging:** When a student marks exit, an absence log entry is created with the exit time as the start of the absence period. When the student marks return, the absence log is closed with the return time. This produces a precise record of how long the student was outside.

**Attendance Window:** The system tracks attendance within a defined window of 6:00 AM to 10:00 PM. Movements outside this window are recorded but do not affect the daily attendance calculation.

**Manual Confirmation:** Students have the option to tap a "Mark Present" button to confirm their presence inside the hostel. This is a supplementary action — it does not override the movement-based state. It is useful for administrative verification purposes. The button requires GPS validation and is only available when the student is inside the hostel and the attendance window is open.

**Admin View:** The admin attendance panel shows a live status table with each student's current state (INSIDE or OUTSIDE), total absent duration for the selected date, and whether they have manually confirmed their presence. The panel defaults to the live status view and also provides a historical daily view.

### 3.6 Complaint Management

Students can raise complaints about hostel facilities, infrastructure, or conduct. Each complaint includes a category, description, location, priority level (Low, Medium, High), and an optional photo attachment.

Admins view all complaints in a filterable list. Each complaint can be updated with a status (Pending, In Progress, Resolved) and an admin response message. The priority badge is visible to the admin to help triage urgent issues.

Students can track the status of their complaints and view admin responses in real time.

### 3.7 Leave Requests

Students can apply for leave by specifying the leave type (Regular or Weekend), start and end dates, reason, and parent contact number. The parent contact number is validated to be exactly 10 digits.

Admins review pending leave requests and can approve or reject them. Rejections require a written reason. Approved and rejected leave requests are visible to the student with the admin's message.

The system validates that the end date is not before the start date at both the frontend and backend levels.

### 3.7.1 Leave-to-Attendance Integration (Runtime Overlay)

The leave system is integrated with attendance through a runtime overlay mechanism. This is a deliberate architectural decision: leave data is never written into the attendance collection or the absence log. Instead, leave status is computed dynamically at the API response layer and used to override the attendance view for the duration of the approved leave period.

**Core Principle**

Leave is implemented as a view-layer override, not a database mutation. The attendance system continues to operate on its own data. The leave system contributes only to the computed response returned to the client.

**Activation Logic**

When a leave request is approved:

- On the day of approval: no change to attendance. The student is tracked normally.
- From the next calendar day at 06:00 AM: the student's attendance status becomes ON_LEAVE.
- Until the leave end date at 10:00 PM: the ON_LEAVE status is maintained.
- After the leave window closes: the system automatically returns to normal movement-based attendance without any manual intervention.

**Runtime Behavior During ON_LEAVE**

- The attendance API returns `currentStatus: "ON_LEAVE"` instead of INSIDE or OUTSIDE.
- No absence log entries are created for the leave period.
- The Mark Present button is disabled on the student interface.
- Gate pass actions are blocked or ignored while the student is on leave.
- The student sees a clear ON LEAVE banner with the leave type and end date.

**Technical Design**

The implementation is contained in a single utility module (`utils/leaveOverlay.js`) that performs a read-only query against the `leaverequests` collection. This module:

1. Queries for an approved leave record where `endDate >= today` for the given student.
2. Computes the activation window: `leaveStart = startDate + 1 day at 06:00`, `leaveEnd = endDate at 22:00`.
3. Returns `{ onLeave: true, leave }` if the current server time falls within the window.
4. Returns `{ onLeave: false }` in all other cases, including any query failure.

The overlay is called from two attendance endpoints:

- `GET /attendance/today-status` — student-facing status endpoint. If on leave, returns the ON_LEAVE response immediately without querying absence logs.
- `GET /attendance/daily-unified` — admin-facing daily view. Computes an `onLeaveSet` for all students with active leaves and applies it to each student's status in the response.
- `POST /attendance/mark` — blocks the request with a descriptive error if the student is currently on leave.

**Safety and Fail-Safe Design**

- If the leave query fails for any reason, the overlay returns `{ onLeave: false }` and the existing attendance system operates without interruption.
- No database writes occur as a result of leave activation or deactivation.
- No cron jobs or background processes are involved.
- No data is duplicated between the leave and attendance collections.
- The gatepass system is completely unmodified.
- The absence log collection is completely unmodified.

**Admin Impact**

- Administrators can view all leave requests in the Leave Requests panel.
- In the Attendance Monitoring panel, students on approved leave appear with an ON LEAVE badge in the live status table.
- No changes to existing admin workflows are required.
- The admin does not need to take any action to activate or deactivate leave status — it is computed automatically.

**Integration Boundaries**

| System | Modified | Notes |
|---|---|---|
| LeaveRequest collection | Read only | Source of leave data |
| Attendance collection | Not modified | Operates independently |
| AbsenceLog collection | Not modified | Operates independently |
| GatePass system | Not modified | Operates independently |
| Attendance API responses | Extended | ON_LEAVE injected at response layer |

### 3.8 Fee Management

The fee management module handles hostel fee records for each student per semester. Each fee record includes room fee, mess fee, maintenance fee, and electricity fee. The system calculates the total automatically.

**Fee Templates:** Admins can create reusable fee templates and apply them to all students in bulk. The bulk apply operation skips students who already have a fee record for the same semester, preventing duplicates. The operation uses atomic batch insertion to prevent partial data in case of failure.

**Fine Management:** Admins can add a fine to any fee record. When a fine is added to an already-paid record, the system recalculates the outstanding amount and reopens the payment for the fine portion.

**Payment Flow:** Students pay fees through a Razorpay-integrated payment flow. The backend creates a Razorpay order, the student completes payment through the Razorpay checkout, and the backend verifies the payment signature before marking the fee as paid. Every successful payment is recorded as a transaction with the Razorpay payment ID, amount, method, and timestamp.

**Payment Status:** Fee records use a unified payment status field (Paid, Pending, Partial, Overdue) that reflects the actual payment state based on amounts rather than a simple boolean flag.

**Admin Transactions View:** Admins can view all payment transactions, filter by student, and see the exact date and time of each payment.

### 3.9 Hostel Information

The hostel information module provides a centralized repository for:
- Announcements from the admin
- Mess menu (weekly schedule)
- Emergency contact numbers
- Important links

Admins manage all content in this section. Students view it in a read-only format. Announcements support priority levels (Low, Medium, High) which are visually indicated to students.

### 3.10 Admin Dashboard

The admin dashboard provides a real-time operational overview of the hostel. It displays:
- Total registered students
- Pending complaints count
- Pending leave requests count
- Total rooms
- Pending fee records
- Students present today
- Students currently outside (via gate pass)

The dashboard also shows the five most recent complaints and leave requests with their current status, giving the admin immediate awareness of pending actions without navigating to individual modules.

---

## 4. System Architecture

The system follows a standard three-tier architecture with a clear separation of concerns between the presentation layer, application layer, and data layer.

```
Client (React SPA)
        |
        | HTTP / REST API
        |
Express.js Server (Node.js)
        |
        | Mongoose ODM
        |
MongoDB Database
```

**Frontend** handles all user interface rendering, form validation, state management, and API communication. It does not contain business logic. All decisions — whether a student can exit, whether a fee is valid, whether a gate pass can be approved — are made on the backend.

**Backend** is the single source of truth. It enforces all business rules, validates all inputs, checks GPS coordinates, manages authentication tokens, and writes to the database. No client-side action takes effect without backend validation.

**Database** stores all persistent data in structured collections. Relationships between collections are maintained through MongoDB ObjectId references and populated on demand.

**Movement-Based Attendance** is a cross-cutting concern that spans the gate pass and attendance systems. The gate pass route writes to the AbsenceLog collection on exit and closes the log on return. The attendance route reads from AbsenceLog to compute current status and absent duration. There is no duplication of logic between the two systems.

---

## 5. Database Design

### Users
Stores all registered users (students and admins).

| Field | Type | Description |
|---|---|---|
| name | String | Full name |
| email | String | Unique login email |
| password | String | Bcrypt hashed |
| role | String | student or admin |
| rollNumber | String | Academic roll number |
| registerNumber | String | College register number |
| phone | String | 10-digit contact number |
| parentPhone | String | 10-digit parent contact |
| bloodGroup | String | Blood group |
| department | String | Academic department |
| year | String | Year of study |
| roomId | ObjectId | Reference to Room |
| feeStatus | String | Paid or Pending |
| status | String | PENDING, APPROVED, REJECTED |
| deviceId | String | Bound device fingerprint |

### Rooms
Stores hostel room definitions.

| Field | Type | Description |
|---|---|---|
| roomNumber | String | Unique room identifier |
| capacity | Number | Maximum occupancy |
| floor | String | Floor location |
| type | String | Room type |
| students | Array | References to User |

### GatePass
Records each gate pass request and its lifecycle.

| Field | Type | Description |
|---|---|---|
| student | ObjectId | Reference to User |
| reason | String | Purpose of exit |
| fromTime | Date | Planned exit time |
| toTime | Date | Expected return time |
| status | String | Pending, Approved, Rejected, Exited, Returned, Overdue |
| exitTime | Date | Actual GPS-validated exit time |
| returnTime | Date | Actual GPS-validated return time |
| isLate | Boolean | True if returned after toTime |
| adminRemark | String | Admin approval or rejection note |

### AbsenceLog
Records absence periods derived from gate pass movement.

| Field | Type | Description |
|---|---|---|
| student | ObjectId | Reference to User |
| date | String | YYYY-MM-DD of the exit |
| gatePass | ObjectId | Reference to GatePass |
| fromTime | Date | Exit time (absence start) |
| toTime | Date | Return time (absence end), null if still outside |

### Attendance
Records manual presence confirmations (supplementary to movement tracking).

| Field | Type | Description |
|---|---|---|
| student | ObjectId | Reference to User |
| date | String | YYYY-MM-DD |
| slot | String | morning (single daily confirmation) |
| status | String | Present |
| markedAt | Date | Confirmation timestamp |
| room | ObjectId | Room at time of confirmation |

### HostelFee
Stores fee records per student per semester.

| Field | Type | Description |
|---|---|---|
| student | ObjectId | Reference to User |
| semester | String | Semester identifier |
| roomFee | Number | Room charge |
| messFee | Number | Mess charge |
| maintenanceFee | Number | Maintenance charge |
| electricityFee | Number | Electricity charge |
| totalAmount | Number | Sum of all charges |
| fineAmount | Number | Additional fine if any |
| paidAmount | Number | Amount paid so far |
| paymentStatus | String | Paid, Pending, Partial, Overdue |
| paidAt | Date | Payment timestamp |
| paymentId | String | Razorpay payment ID |

### PaymentTransaction
Records each payment event.

| Field | Type | Description |
|---|---|---|
| fee | ObjectId | Reference to HostelFee |
| student | ObjectId | Reference to User |
| amount | Number | Amount paid in this transaction |
| method | String | UPI, Card, etc. |
| transactionId | String | Razorpay or internal ID |
| status | String | Success, Failed, Pending |

### Issue (Complaints)
Stores student complaints.

| Field | Type | Description |
|---|---|---|
| student | ObjectId | Reference to User |
| category | String | Type of complaint |
| description | String | Detailed description |
| location | String | Room or area |
| priority | String | Low, Medium, High |
| photo | String | Uploaded image path |
| status | String | Pending, In Progress, Resolved |
| adminResponse | String | Admin resolution message |

### LeaveRequest
Stores leave applications.

| Field | Type | Description |
|---|---|---|
| student | ObjectId | Reference to User |
| leaveType | String | Regular or Weekend |
| startDate | Date | Leave start |
| endDate | Date | Leave end |
| reason | String | Purpose of leave |
| parentContact | String | 10-digit parent number |
| status | String | Pending, Approved, Rejected |
| adminReason | String | Admin decision note |

### DeviceResetLog
Audit trail for device binding resets.

| Field | Type | Description |
|---|---|---|
| student | ObjectId | Reference to User |
| resetBy | ObjectId | Admin who initiated reset |
| action | String | OTP_SENT, RESET_COMPLETE |
| note | String | Contextual note |

---

## 6. System Workflow

### Student Registration and Approval

1. Student visits the registration page and submits personal and academic details
2. Account is created with status PENDING
3. Student sees a confirmation screen indicating that admin approval is required
4. Admin reviews the pending registration in the Students panel
5. Admin approves or rejects the registration
6. If approved, the student can log in
7. If rejected, the student can re-register with the same email, which resets the status to PENDING

### Gate Pass and Movement Tracking

1. Student logs in and navigates to the Gate Pass section
2. Student submits a gate pass request with reason, planned exit time, and expected return time
3. Admin reviews the request and approves or rejects it with an optional remark
4. After approval, the student sees a "Mark Exit" button
5. Student taps Mark Exit — the application requests GPS location
6. Backend validates that the student is within 250 meters of the hostel
7. If valid: gate pass status changes to Exited, exit time is recorded, an AbsenceLog entry is created
8. If invalid: error message is shown, no state change occurs
9. Student is now tracked as OUTSIDE — attendance system reflects Absent for this period
10. When the student returns, they tap "Mark Return"
11. Backend validates GPS location (within 250 meters) and minimum 10-minute gap from exit
12. If valid: gate pass status changes to Returned, return time is recorded, AbsenceLog is closed
13. If the return is after the expected return time, the record is flagged as late
14. If the student does not return by the expected time, the system marks the gate pass as Overdue

### Fee Payment

1. Admin creates a fee record for a student or applies a fee template to all students
2. Student views the fee record in the Fees section
3. Student clicks Pay Now and reviews the fee breakdown
4. Student selects a payment method (UPI, Card, Net Banking)
5. Backend creates a Razorpay order with the outstanding amount
6. Razorpay checkout opens in the browser
7. Student completes payment through Razorpay
8. Razorpay sends a callback to the frontend with payment details
9. Frontend sends the payment details to the backend for signature verification
10. Backend verifies the Razorpay signature cryptographically
11. If valid: fee record is marked as Paid, transaction is recorded, student fee status is updated
12. If invalid: payment is recorded as Failed, no fee status change occurs

### Complaint Resolution

1. Student raises a complaint with category, description, location, priority, and optional photo
2. Admin views the complaint in the Complaints panel
3. Admin updates the status (In Progress or Resolved) and adds a response message
4. Student sees the updated status and admin response in their complaints list

---

## 7. API Design Overview

### Authentication APIs
- Register a new student account
- Log in as student or admin
- Retrieve the current authenticated user's profile
- Update student profile fields
- Initiate and verify device reset via OTP

### Gate Pass APIs
- Submit a new gate pass request
- Retrieve own gate pass history (student)
- Retrieve all gate passes (admin)
- Approve or reject a gate pass (admin)
- Mark exit with GPS validation (student)
- Mark return with GPS and time validation (student)
- Retrieve currently outside students (admin)
- Retrieve overdue students (admin)
- Sync overdue status (admin)

### Attendance APIs
- Mark manual presence confirmation with GPS (student)
- Retrieve today's unified status including absence logs (student)
- Retrieve own absence log history (student)
- Retrieve daily unified attendance for all students (admin)
- Retrieve weekend attendance records (admin)

### Fee APIs
- Retrieve own fee records (student)
- Retrieve all fee records (admin)
- Create a fee record (admin)
- Update fee payment status (admin)
- Apply fine to a fee record (admin)
- Create fee template (admin)
- Apply template to all students (admin)
- Retrieve payment transactions (student and admin)
- Create Razorpay payment order (student)
- Verify Razorpay payment signature (student)

### Complaint APIs
- Submit a complaint with optional photo (student)
- Retrieve own complaints (student)
- Retrieve all complaints (admin)
- Update complaint status and response (admin)

### Leave APIs
- Submit a leave request (student)
- Retrieve own leave requests (student)
- Retrieve all leave requests (admin)
- Approve or reject a leave request (admin)

### Room APIs
- Create a room (admin)
- Retrieve all rooms (admin and student)
- Assign a student to a room (admin)
- Remove a student from a room (admin)
- Delete a room with cascade cleanup (admin)
- Retrieve own room with roommates (student)

### Student Management APIs
- Retrieve all approved students (admin)
- Retrieve pending students (admin)
- Approve a student registration (admin)
- Reject a student registration (admin)

### Hostel Information APIs
- Manage announcements, mess menu, emergency contacts, and important links (admin)
- Retrieve all hostel information (student)

---

## 8. Frontend Overview

### Student Interface

**Dashboard:** Displays a personalized welcome banner with the student's academic details, quick-access stat cards for complaints, leave requests, attendance, fee status, and room number, an attendance progress bar, recent announcements, and quick action buttons.

**Gate Pass:** Shows the current gate pass status with contextual action buttons. If a pass is approved, a "Mark Exit" button is shown. If the student is outside, a "Mark Return" button is shown. Both buttons trigger GPS validation. The full gate pass history is displayed below with status badges and timestamps.

**Attendance:** Shows the student's current INSIDE or OUTSIDE status derived from gate pass movement. Displays today's absence periods with live indicators, total absent duration, and an optional "Mark Present" confirmation button. Includes a full absence history.

**Fees:** Displays all fee records with a breakdown of charges, fine indicators, and payment status. Provides a multi-step payment flow integrated with Razorpay. Includes a payment history tab showing all past transactions.

**Complaints:** Allows students to raise complaints with category, priority, location, description, and photo. Displays all submitted complaints with status and admin responses.

**Leave:** Allows students to apply for leave with date range, reason, and parent contact. Displays all leave requests with status and admin decisions.

**Profile:** Displays all personal and academic details. Provides an edit form for phone numbers, blood group, department, and year.

**Room:** Shows the student's assigned room details and a list of roommates.

**Hostel Info:** Displays announcements, mess menu, emergency contacts, and important links in a tabbed interface.

### Admin Interface

**Dashboard:** Provides a real-time operational overview with stat cards, recent complaints, and recent leave requests.

**Students:** Three-tab panel showing approved students (with search), pending registrations (with approve/reject actions), and a device reset audit log. Each approved student has a "Reset Device" button that sends an OTP to the student's email.

**Gate Pass:** Shows all gate passes with status filters. Pending passes have a Review button for approval or rejection. An Overdue tab highlights students who have not returned on time with their contact details.

**Attendance:** Three-tab panel. The Live Status tab (default) shows all students with their current INSIDE or OUTSIDE status, absent duration, and confirmation status. The Daily History tab shows movement-based attendance for a selected date. The Weekend Records tab shows manual weekend confirmations.

**Fees:** Three-tab panel for fee records, fee templates, and payment transactions. Fee records support fine management and status updates. Templates can be applied to all students in bulk. Transactions can be filtered by student.

**Complaints:** Filterable list of all complaints with priority badges. Each complaint can be updated with a status and response message.

**Leave:** Filterable list of all leave requests with a review modal for approval or rejection.

**Rooms:** Room creation, student assignment, and removal interface.

**Hostel Info:** Full management interface for announcements, mess menu, emergency contacts, and links.

---

## 9. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Routing | React Router v6 |
| HTTP Client | Axios |
| UI Components | Lucide React (icons) |
| Notifications | React Hot Toast |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose ODM |
| Authentication | JSON Web Tokens (JWT) |
| Password Hashing | bcryptjs |
| File Uploads | Multer |
| Payment Gateway | Razorpay |
| Email | Nodemailer (Gmail SMTP) |
| Location | Browser Geolocation API |

---

## 10. Validation and Security

### Authentication
- JWT tokens with 7-day expiry are issued on login
- Tokens are stored in localStorage and sent as Bearer tokens on every API request
- The backend middleware verifies the token on every protected route
- A 401 response from any API automatically clears the token and redirects to the login page

### Role-Based Access Control
- Every API route is protected by the `protect` middleware which verifies the JWT
- Admin-only routes additionally check `req.user.role === 'admin'`
- Students cannot access admin routes at the API level regardless of frontend state

### Device Binding
- On first login, the student's device fingerprint is stored in the database
- Subsequent logins from a different device are blocked with a clear error message
- Device reset requires admin initiation and student OTP verification
- All reset actions are logged in the DeviceResetLog collection
- OTP requests are rate-limited to one per 60 seconds per student

### Location Validation
- GPS coordinates are validated for range (latitude -90 to 90, longitude -180 to 180) before use
- Distance from hostel is calculated using the Euclidean approximation scaled to meters
- Exit and return are only permitted within 250 meters of the hostel coordinates
- Location validation happens on the backend — the frontend cannot bypass it

### Input Validation
- Phone numbers are validated to be exactly 10 digits on both frontend and backend
- Fee amounts are validated to be non-negative
- Leave date ranges are validated for logical consistency
- Gate pass return time must be after exit time
- OTP rate limiting prevents email spam

### Payment Security
- Razorpay payment signatures are verified using HMAC-SHA256 on the backend
- Payment status is only updated after successful signature verification
- Failed verification attempts are recorded as failed transactions

---

## 11. Real-World Benefits

**Eliminates fake attendance:** Attendance is derived from GPS-validated movement. A student cannot mark themselves present without being physically inside the hostel.

**Prevents unauthorized exits:** Students cannot mark exit without being inside the hostel. The system records the exact time and validates location at both exit and return.

**Reduces administrative workload:** Fee templates allow bulk fee creation in one action. Complaint and leave workflows are handled digitally without paper forms or manual tracking.

**Provides real-time visibility:** Administrators see a live view of which students are inside and outside the hostel at any given moment, along with overdue alerts.

**Creates an audit trail:** Every action — gate pass request, exit, return, fee payment, complaint update, device reset — is timestamped and stored. This provides accountability for both students and administrators.

**Improves hostel discipline:** The combination of gate pass approval, GPS validation, and overdue detection creates a structured system that discourages unauthorized movement.

**Supports remote management:** Administrators can manage the hostel from any device without being physically present at the gate or office.

---

## 12. Limitations

**GPS accuracy dependency:** The system relies on the device's GPS accuracy. In areas with poor satellite coverage or inside buildings, GPS coordinates may drift, potentially causing false validation failures.

**Cannot prevent physical boundary violations:** The system validates location at the moment of marking exit or return. It cannot continuously track a student's location or prevent them from physically leaving without using the application.

**Device and permission requirements:** Students must use a device with GPS capability and must grant location permissions to the application. Denial of location permissions prevents exit and return marking.

**Network dependency:** All actions require an active internet connection. Offline scenarios are not supported.

**Single hostel configuration:** The hostel GPS coordinates and radius are currently hardcoded in the backend. Multi-hostel deployments would require configuration management.

---

## 13. Future Enhancements

**QR-based entry and exit:** Replace GPS validation with QR code scanning at physical gates for higher precision and faster processing.

**Biometric integration:** Integrate fingerprint or face recognition at entry points for tamper-proof attendance.

**WiFi-based presence detection:** Use hostel WiFi network connection as a secondary signal for presence verification.

**Push notifications:** Implement real-time push notifications for gate pass approvals, overdue alerts, and fee reminders.

**Advanced analytics:** Add charts and reports for attendance trends, fee collection rates, complaint resolution times, and student movement patterns.

**Multi-hostel support:** Extend the system to manage multiple hostel buildings under a single admin account with separate configurations per building.

**Mobile application:** Build native iOS and Android applications for improved GPS accuracy and background location tracking.

**Automated fee reminders:** Schedule automated email or SMS reminders for upcoming fee due dates.

---

## 14. Testing Scenarios

### Gate Pass — Normal Exit and Return
1. Student submits gate pass request
2. Admin approves the request
3. Student taps Mark Exit while inside hostel (within 250m)
4. System records exit time and creates absence log
5. Student returns after more than 10 minutes
6. Student taps Mark Return while inside hostel
7. System closes absence log and marks gate pass as Returned
8. Expected result: Gate pass status is Returned, absence log has both fromTime and toTime

### Gate Pass — Late Return
1. Student exits and does not return by the expected return time
2. System marks gate pass as Overdue
3. Admin sees the student in the Overdue tab
4. Student eventually returns and marks return
5. Expected result: Gate pass status is Returned, isLate flag is true

### Gate Pass — Invalid Location on Exit
1. Student taps Mark Exit from a location more than 250 meters from hostel
2. System returns error: "You must be inside hostel to mark exit"
3. Gate pass status remains Approved
4. Expected result: No state change, clear error message shown

### Gate Pass — Too Early Return
1. Student exits and attempts to mark return within 10 minutes
2. System returns error: "Too early to return. Please wait X more minute(s)"
3. Gate pass status remains Exited
4. Expected result: No state change, countdown shown in error message

### Attendance — Student Inside All Day
1. Student does not submit any gate pass
2. No absence log entries exist for the student
3. Admin views attendance for the day
4. Expected result: Student shows as INSIDE with 0 minutes absent

### Attendance — Student Outside for Part of Day
1. Student exits at 10:00 AM and returns at 1:00 PM
2. Absence log records fromTime 10:00 AM and toTime 1:00 PM
3. Admin views attendance for the day
4. Expected result: Student shows 180 minutes absent

### Fee Payment — Fine Added After Payment
1. Admin marks fee as Paid
2. Admin later adds a fine of 500
3. System recalculates outstanding amount as 500
4. Student sees "Pay Fine" button with the fine amount
5. Student completes payment through Razorpay
6. Expected result: Fee status returns to Paid, transaction recorded for fine amount

### Device Reset
1. Student attempts login from a new device
2. System blocks login with "unrecognized device" message
3. Admin clicks Reset Device for the student
4. System sends OTP to student's registered email
5. Student enters OTP on the device reset page
6. System binds the new device and clears the old one
7. Expected result: Student can log in from the new device

### Student Registration Approval
1. New student registers
2. Student sees "Waiting for admin approval" screen
3. Admin approves the registration
4. Student logs in successfully
5. Expected result: Student accesses the dashboard

---

## 15. Getting Started

### Prerequisites
- Node.js 18 or higher
- MongoDB 6.0 or higher
- A Razorpay account (test mode keys for development)
- A Gmail account with App Password enabled (for OTP emails)

### Environment Configuration

Create a `.env` file in the `backend` directory:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/hostel_digital
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_SECRET=your_razorpay_secret
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
```

### Installation

```bash
# Install backend dependencies
cd hostel-management/backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Seed Admin Account

```bash
cd hostel-management/backend
node seed.js
```

### Seed Announcements (Optional)

```bash
node seedAnnouncements.js
```

### Running the Application

```bash
# Start backend (terminal 1)
cd hostel-management/backend
npm run dev

# Start frontend (terminal 2)
cd hostel-management/frontend
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend API at `http://localhost:5000`.

### Hostel GPS Configuration

The hostel coordinates are defined in `backend/routes/gatepass.js` and `backend/routes/attendance.js`. Update these values to match your hostel's actual location:

```javascript
const HOSTEL_LAT = 8.72267;
const HOSTEL_LNG = 77.760906;
const RADIUS_METERS = 250;
```

---

## 16. Conclusion

The Digital Hostel Management System transforms traditional hostel administration into a structured, automated, and accountable operation. By tying attendance directly to GPS-validated student movement rather than manual marking, the system eliminates the most common source of data manipulation in hostel management.

The gate pass module serves as the operational backbone — every exit and return is validated, timestamped, and linked to an absence record. Administrators gain real-time visibility into hostel occupancy without manual intervention. Students interact with a straightforward interface that guides them through each action with clear feedback.

The system is designed to be extended. The modular architecture, clean API boundaries, and separation between movement tracking and attendance calculation make it straightforward to add new features — biometric integration, QR scanning, push notifications — without restructuring the existing codebase.

This is not a prototype. It is a production-ready system built with real-world operational constraints in mind: GPS validation, payment signature verification, device binding, rate limiting, cascade-safe database operations, and atomic bulk writes. Every component has been designed to handle failure gracefully and maintain data consistency.
