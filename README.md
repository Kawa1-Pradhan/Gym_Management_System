# PROJECT ARTIFACT: GYM MANAGEMENT SYSTEM (GMS)

### Project Title
**Gym Management System (GMS)**
This project is a comprehensive web-based system designed to automate the operations of modern fitness facilities. The system provides a centralized platform for managing memberships, tracking attendance, booking specialized training sessions, and monitoring gym inventory through an intuitive digital interface.

### Project Objective
The main objective of this project is to develop a secure and efficient system that solves the problems of manual paperwork and data inaccuracies in gyms, thereby improving the user experience for both administrators and members.

### Features
The system provides the following features:
*   **Secure User Authentication:** Role-based login for Admins, Staff, and Members.
*   **Membership Management:** Digital enrollment and automated plan expiry tracking.
*   **Online Payment Integration:** Secure membership renewals via the Khalti Payment Gateway.
*   **Session Booking Engine:** Real-time reservation for limited facilities like Boxing and Sauna.
*   **Attendance & Rewards:** Digital check-in system with integrated reward points for consistency.
*   **Inventory Monitoring:** Real-time stock tracking with automated low-stock notifications.
*   **Broadcast System:** Global announcements and personal notifications for all users.

### Technologies Used
**Frontend**
*   React.js
*   Tailwind CSS
*   JavaScript (ES6+)

**Backend**
*   Node.js
*   Express.js

**Database**
*   MongoDB (NoSQL)

**Deployment**
*   Frontend: Vercel / Netlify
*   Backend: Render / Railway

### System Requirements
**Hardware**
*   Computer or smartphone with a modern processor.
*   Active internet connection for real-time data synchronization.

**Software**
*   Web browser such as Google Chrome, Firefox, or Microsoft Edge.
*   Node.js (for local development and testing).

### Installation and Setup
1.  **Clone the repository**
    `git clone https://github.com/Kawa1-Pradhan/Gym_Management_System.git`
2.  **Install dependencies**
    *   Navigate to the `/api` folder and run `npm install`
    *   Navigate to the `/client` folder and run `npm install`
3.  **Run the application**
    *   Start the backend: `npm run dev` (in the /api folder)
    *   Start the frontend: `npm run dev` (in the /client folder)

### Project Structure
```text
Gym_Management_System
│
├── api/ (Backend - Node.js/Express)
│   ├── src/models/
│   ├── src/routes/
│   └── src/controllers/
├── client/ (Frontend - React.js)
│   ├── src/components/
│   └── src/pages/
├── database/ (MongoDB Models)
└── documentation/ (FYP Report and Diagrams)
```

### Future Improvements
*   **Native Mobile Application:** Development of an Android/iOS app for push notifications.
*   **Biometric Integration:** Hardware connection for fingerprint or face-ID attendance.
*   **AI Personal Trainer:** Machine learning modules for personalized workout and diet plans.
*   **Multi-branch Support:** SaaS capability to manage multiple gym locations.

### Authors
**Kawal Bhagat Pradhanang**
BIT (Bachelor of Information Technology)
Itahari International College

### License
This project is created for educational purposes as part of a Final Year Project.
