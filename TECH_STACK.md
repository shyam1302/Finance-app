# Wealth OS: Project & Technology Overview

Welcome to the technical overview of **Wealth OS**, a futuristic, high-performance financial management terminal designed to bring enterprise-grade aesthetics and functionality to personal finance tracking.

This document serves as a comprehensive guide to understanding what the platform does and the technologies powering it under the hood.

---

## 🚀 What is Wealth OS?

Wealth OS acts as your personal command center. It abandons the traditional, boring dashboard design of standard financial apps and instead uses an intense, cyber-thematic, "Deep Space / Terminal" aesthetic. 

### Key Features
- **Holographic Command Center:** Track Net Worth, Goals, Budgets, and structural financial data in a dashboard that looks like a high-tech flight computer or a terminal node.
- **Entry Portal 2.0:** A complete, interactive authentication flow modeled as an "Entry Node," complete with simulated biometric verifications, rapid data counters, and page-flip 3D animations.
- **Dynamic HUDs:** Enjoy real-time, SVG-based analytical rings tracking your overall "Health Score," automated number counters, and deep-space atmospheric breathing UI gradients.
- **Data Visualizations:** Comprehensive charts detailing financial metrics, powered by Chart.js.

---

## 🛠️ The Technology Stack

The application is architected as a modern, decoupled Full-Stack platform. It consists of a frontend graphical terminal and a secure backend API orchestrator.

### Frontend Architecture (The Visual Terminal)
The frontend drives the cyber-aesthetic and handles all complex UI state, routing, and data fetching with absolute minimal latency.

- **Core Framework:** React 19 + Vite 8
  - Ensures lightning-fast HMR (Hot Module Replacement) and optimized production builds.
- **Styling & Theming:** Tailwind CSS v4
  - Used for dynamic utility classes, glassmorphism, Brutalist Terminal styling, complex CSS variables, and deeply nested animations.
  - Enhanced by `clsx` and `tailwind-merge` for dynamic class manipulation.
- **State & Data Management:** 
  - `@tanstack/react-query`: Handles asynchronous state management, caching, and background synchronization against the backend API.
- **Routing:** React Router DOM (v7)
- **Data Visualization:** Chart.js with `react-chartjs-2` for rendering complex financial geometry.
- **Network / API Sync:** Axios (configured with intercepts for JWT token injection and refresh cycles).
- **Iconography:** Lucide-React (supplying the minimal, terminal-style icons).

### Backend Architecture (The Core Engine)
The backend acts as the secure master control node, handling authentication, database validation, and heavy data lifting.

- **Runtime & Framework:** Node.js + Express 5
- **Database:** PostgreSQL
  - Interfaced natively through the `pg` driver for maximum query performance.
- **Authentication & Security:**
  - **JWT (JSON Web Tokens):** Handles stateless access and refresh token cycles.
  - **Bcrypt:** Encrypts and securely salts user biometric keys (passwords).
  - **Helmet & CORS:** Secures HTTP headers and origin policies.
  - **Rate Limiting:** Protects the endpoints from DDoSing or brute force attempts.
- **Data Validation:** Joi
  - Ensures all incoming structural data matches the expected financial schemas before hitting the PostgreSQL DB.
- **Logging:** Morgan

---

## 📂 Repository Structure

The project is structured as a monorepo containing two main sectors:

1. `/frontend/` - Contains all React architecture, React Query hooks, styling, and UI components.
2. `/backend/` - Contains everything related to Express routes, PostgreSQL database logic, JWT generation, and endpoint validation.
3. `/postman/` - Contains the collection files for rapid testing of the backend API endpoints.

---

## 🏁 Summary

Wealth OS represents a leap forward in how we visually interact with our personal finances. By leveraging modern React methodologies, TanStack Query for optimal data handling, and a rock-solid Node/PostgreSQL backend layer, it ensures data integrity while providing an unmatched user experience.
