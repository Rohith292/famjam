# FamJam

**FamJam** is an interactive, collaborative mapping tool that empowers families to build and expand their digital family tree. With smart access controls, intuitive member insights, and shared album features, FamJam fosters meaningful connections across generations.

Key highlights:
- 🔐 Role-based access for secure collaboration
- 🧬 Member insights to reconnect with least-interacted relatives
- 🖼️ Album sharing within isolated family groups
- 💬 Built-in chatbot for instant queries about user activity and account details

## 🧠 Problem Statement

Most existing family tree platforms focus on genealogy and historical data entry, offering limited collaboration and rigid access models. Tools like FamilySearch and Gramps Web allow shared editing but lack granular permission control, group isolation, and interactive features.

**FamJam** bridges this gap by introducing:
- 🔐 Role-based access for secure, scalable collaboration
- 🧬 Member insights to reconnect with least-interacted relatives
- 🖼️ Album sharing within isolated family groups
- 💬 A built-in chatbot for instant user queries and activity tracking

By blending civic-style data modeling with intuitive UX and real-time collaboration, FamJam reimagines the family tree as a living, interactive space—not just a static archive.

## 💡 Solution Overview

**FamJam** reimagines the digital family tree as a dynamic, collaborative experience. Unlike traditional genealogy tools, FamJam introduces:

- 🌐 **Interactive Mapping**: Users can build and expand their family tree with real-time updates and visual clarity.
- 🔐 **Collaborative Access Controls**: Role-based permissions ensure secure sharing and editing across family members.
- 🧬 **Member Insights**: View detailed profiles and reconnect with least-interacted relatives using smart suggestions.
- 🖼️ **Album Sharing**: Share photos and memories within isolated family groups, preserving privacy and context.
- 🧭 **FamilyGroups Isolation**: Create distinct subgroups within the main tree for better organization and access control.
- 💬 **Built-in Chatbot**: Instantly query user account details, activity logs, and creation history for seamless navigation.

By combining backend precision with frontend clarity, FamJam offers a scalable, user-friendly platform for families to stay connected, organized, and engaged.

## 📖 Introduction

**FamJam** is a modern web application designed to help families stay connected through a collaborative, interactive mapping experience. It allows users to build and expand their family tree, share memories through albums, and manage access with precision.

Whether you're organizing generations of relatives or creating isolated family groups for specific branches, FamJam offers a secure and intuitive platform to visualize relationships, reconnect with lesser-known members, and preserve shared history.

Built with a strong focus on user experience and backend clarity, FamJam blends real-time collaboration, smart insights, and scalable architecture into one seamless tool.

## ⚙️ Functionality

FamJam offers a rich set of features designed to make family collaboration seamless, secure, and engaging:

- 🌳 **Interactive Family Tree Mapping**  
  Build and expand your family tree with real-time updates and visual clarity.

- 🔐 **Role-Based Access Control**  
  Assign custom permissions for viewing, editing, and inviting members—ensuring secure collaboration.

- 🧬 **Member Insights Engine**  
  View detailed member profiles and reconnect with least-interacted relatives using smart suggestions.

- 🖼️ **Album Sharing Within Groups**  
  Share photos and memories inside isolated family groups, preserving privacy and context.

- 🧭 **FamilyGroups Isolation**  
  Create distinct subgroups within the main tree to manage access and content independently.

- 💬 **Built-in Chatbot Assistant**  
  Instantly query user account details, activity logs, and creation history via a conversational interface.

- 🔍 **Search, Filter & Highlighting**  
  Easily locate members, albums, and invited users with dynamic search and filter tools.

- 📱 **Responsive UI**  
  Optimized for desktop and mobile, with intuitive navigation and state management via Zustand.

## 🧪 Methodology

FamJam was built with a modular, scalable architecture that balances backend precision with frontend clarity. The development approach focused on three core pillars:

### 1. 🔐 Permission-First Backend Design
- Role-based access logic is handled server-side using Node.js and MySQL.
- Each user action—viewing, editing, inviting—is validated against their assigned role and group context.
- FamilyGroups are isolated via relational mapping, ensuring clean separation of data and access.

### 2. 🧭 Context-Aware Frontend UX
- React + Zustand powers a responsive UI with dynamic state management.
- Invite flows, member highlights, and album sharing are designed to reflect backend permissions in real time.
- Search and filter tools help users navigate large trees and locate specific members or albums quickly.

### 3. 💬 Conversational Interface Layer
- A built-in chatbot provides instant access to user account details, activity logs, and creation history.
- The bot queries backend endpoints and formats responses for clarity, reducing friction in user navigation.

### 4. 🧱 Modular Component Structure
- UI components are reusable and context-aware, supporting rapid iteration and feature expansion.
- Backend routes are organized by functionality (auth, groups, albums, chatbot), enabling clean separation of concerns.

This methodology ensures FamJam remains robust, intuitive, and extensible—ready to scale across families, devices, and future modules.

## 📁 Folder Structure

FamJam follows a modular structure that separates concerns across frontend, backend, and data layers:


```
famjam/
├── client/                        # React frontend
│   └── src/
│       ├── components/            # Reusable UI components (TreeView, AlbumCard, InviteModal)
│       ├── pages/                 # Route-based views (Dashboard, MemberProfile, GroupView)
│       ├── store/                 # Zustand state management setup
│       ├── services/              # API calls and client-side logic
│       ├── assets/                # Static files and images
│       └── utils/                 # Helper functions and context-aware logic
│
├── server/                        # Node.js backend
│   └── src/
│       ├── controllers/           # Business logic for each route
│       ├── routes/                # API endpoints (auth, groups, albums, chatbot)
│       ├── middleware/            # Auth checks, permission validation
│       ├── models/                # MySQL ORM models and schema definitions
│       ├── lib/                   # Utility modules (e.g., token handlers, validators)
│       └── index.js               # Entry point for backend server
│
├── database/                      # SQL schema, seed files, and migration scripts
├── public/                        # Static assets served by frontend
├── README.md                      # Project documentation
└── package.json                   # Project metadata and dependencies
```
## 🧰 Tech Stack

FamJam is built on the MERN stack, chosen for its flexibility, scalability, and seamless integration between frontend and backend components.

| Technology      | Role in FamJam                                      |
|----------------|------------------------------------------------------|
| **MongoDB**     | NoSQL database for storing user profiles, group data, and album metadata. Enables flexible schema design for evolving family structures. |
| **Express.js**  | Backend framework for routing, middleware, and API logic. Handles authentication, permission validation, and chatbot endpoints. |
| **React.js**    | Frontend library for building dynamic, responsive UI. Powers the tree view, invite flows, and member insights dashboard. |
| **Node.js**     | Runtime environment for backend execution. Supports asynchronous operations and scalable server-side logic. |
| **Zustand**     | Lightweight state management for React. Manages UI state across components like search filters, invite modals, and chatbot interactions. |
| **Chatbot Engine** | Custom conversational layer for querying user activity and account details. Interfaces with backend APIs for real-time responses. |

## 🖼️ UI Snapshots

> 📽️ A short demo video or screenshots will be added here to showcase:
- Family tree mapping interface
- Invite flow and permission settings
- Album sharing within FamilyGroups
- Chatbot querying user activity

*Coming soon: screen recording walkthrough*

## 🚀 Installation & Running

To run FamJam locally, follow these steps:

### 1. 📦 Clone the Repository

```bash
git clone https://github.com/yourusername/famjam.git
cd famjam
```

### 2. 🧩 Install Dependencies

#### frontend

```bash
cd frontend
npm install
npm run dev
```

#### Backend

```bash
cd ../backend
npm install
node src/index.js
```

### 3. 🔐 Environment Setup

Create a `.env` file inside `backend/` with the following variables:

```
MONGODB_URI=Your_mongoDb_url

CLOUDINARY_CLOUD_NAME=Your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_secret_key

JWT_SECRET=your_jwt_secret_key
```

> ⚠️ Make sure your database is running and accessible before starting the backend.

### 4. 🚀 Start the Application

#### Backend

```bash
cd backend
npm src/index.js
```

#### Frontend

```bash
cd ../frontend
npm run dev
```

### 5. 🌐 Access the App

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

FamJam should now be running locally with full functionality. You can begin exploring the family tree builder, invite flows, album sharing, and chatbot features.

## Future Scope
FamJam can be enhanced in serveral ways such as:

**Chatbot functionality** provide more training samples and furuther imporvement for query based on familyGroups Section.
**Responsive UI** the current website lacks responsive ui for mobile applications so enhancing them is critical
**Forgot password** use of forgot password section to recover the user's forgotten password
**Addititonal Member details** enhancing the member details section with fields such as location,contact number etc

## 🤝 Contributing

Suggestions and ideas for future enhancements are always welcome. Feel free to open an issue or pull request.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---
