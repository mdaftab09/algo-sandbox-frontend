> ⚙️ Note: This is the Frontend React repository. [Click here for the Java Backend repository](https://github.com/mdaftab09/algo-sandbox-backend)

🚀 Full-Stack Algo Sandbox

A real-time, distributed algorithm visualization engine. Unlike standard frontend-only visualizers, Algo Sandbox uses a Java Spring Boot backend to compute complex mathematical geometry and pathfinding logic, streaming the visualization frames live to a React client via WebSockets.

✨ Features

Sorting Algorithms: Bubble Sort & Quick Sort with step-by-step playback controls (Play, Pause, Skip).

Live Binary Search Tree: Dynamically calculates 2D geometry (X, Y coordinates) on the backend to animate floating tree nodes and SVG branches.

Dijkstra's Pathfinding: Real-time grid rendering with randomly generated walls. Features a radar-like search wave and an animated shortest-path breadcrumb trail.

Distributed Architecture: Thread-safe backend capable of instantly interrupting and resetting ghost threads on rapid client requests.

🏗️ System Architecture

Client (React.js): Acts as a thin client/renderer. Takes user input, sends configuration to the backend, and listens to the STOMP WebSocket topic.

Engine (Spring Boot): The heavy lifter. Runs the algorithms on isolated background threads to prevent server blocking.

Transport (WebSocket/STOMP): Pushes JSON frames (snapshots of the algorithm's current state) at 40ms intervals to the React client for fluid 60fps animations.

🛠️ Local Installation

Prerequisites

Java 17+

Node.js & npm

Maven

1. Start the Backend (Spring Boot)

Ensure you are in the backend repository directory.

cd algo-sandbox-backend
./mvnw spring-boot:run


The server will start on http://localhost:8080

2. Start the Frontend (React + Vite)

Ensure you are in the frontend repository directory.

cd algo-sandbox-frontend
npm install
npm run dev


The client will start on http://localhost:5173

💻 Tech Stack

Frontend: React, Vite, Tailwind CSS, Framer Motion, Lucide-React

Backend: Java 17, Spring Boot, Spring WebSocket, STOMP

Communication: REST APIs (for iterative init), WebSockets (for live data streaming)

🤝 Contributing

Contributions, issues, and feature requests are welcome!

Fork the Project

Create your Feature Branch (git checkout -b feature/AmazingFeature)

Commit your Changes (git commit -m 'Add some AmazingFeature')

Push to the Branch (git push origin feature/AmazingFeature)

Open a Pull Request
