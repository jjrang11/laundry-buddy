# Laundry Buddy – Claude.md

## Project Overview

Laundry Buddy is a web-based Kanban-style dashboard designed for laundry shops to manage and track laundry orders in real-time. The goal is to improve operational clarity, reduce errors, and standardize workflow before introducing automation (e.g., Messenger integration).

This MVP focuses on internal operations only (no external integrations yet).

---

## Tech Stack

### Frontend

- Framework: Next.js (React)
- Styling: Tailwind CSS
- UI Components: shadcn/ui (Radix-based)

### Backend

- Supabase

  - Database (PostgreSQL)
  - Auth
  - Realtime (for internal updates)

---

## User Roles

### Admin

- Manage pricing (price per kg)
- View all orders
- Create/edit orders

### Staff

- View orders
- Move orders across Kanban stages
- Create/edit orders

(No granular permissions for MVP)

---

## Core Features

### 1. Kanban Board

Columns:

1. New Order
2. For Pickup
3. Arrived at Shop
4. Washing
5. Drying
6. Folding / Ironing
7. Ready for Delivery
8. Out for Delivery
9. Completed

Capabilities:

- Drag-and-drop order cards
- Real-time updates
- Visual status tracking

---

### 2. Order Management

Each order contains:

- Customer Name
- Contact Number
- Order Type (Pickup / Walk-in)
- Address (if pickup/delivery)
- Weight (kg)
- Price per kg (snapshot at time of order)
- Total Price (auto-calculated)
- Notes
- Status
- Created At
- Updated At

---

### 3. Pricing Management (Admin Only)

- Set global price per kg
- Editable via settings screen
- New orders use latest price
- Existing orders retain their original price snapshot

---

### 4. Internal Notifications (Basic)

- Highlight new orders
- Real-time updates using Supabase subscriptions

---

## Database Schema (High-Level)

### users

- id
- email
- role (admin | staff)
- created_at

### orders

- id
- customer_name
- contact_number
- order_type (pickup | walkin)
- address
- weight
- price_per_kg
- total_price
- notes
- status
- created_at
- updated_at

### settings

- id
- price_per_kg
- updated_at

---

## Kanban Logic

- Orders are displayed grouped by status
- Drag-and-drop updates the `status` field
- Status updates persist in database
- UI reflects updates in real-time
- Do not implement ordering within columns for MVP

---

## UI Structure

### Pages

- /login
- /dashboard (Kanban board)
- /orders/[id] (optional detail view)
- /settings (admin only)

### Components

- KanbanBoard
- KanbanColumn
- OrderCard
- OrderModal (create/edit)
- PricingSettings

---

## Project Phases & Tasks

---

### Phase 1: Project Setup

#### Task 1.1 – Initialize Next.js App

- Agent: @frontend-developer
- Skills: @senior-frontend, @react-best-practices
- Setup project structure
- Install Tailwind + shadcn/ui

#### Task 1.2 – Setup Supabase

- Agent: @backend-architect
- Skills: @senior-backend
- Create project
- Configure auth
- Setup database tables

---

### Phase 2: Authentication

#### Task 2.1 – Auth UI

- Agent: @frontend-developer
- Skills: @react-best-practices
- Login page

#### Task 2.2 – Auth Logic

- Agent: @backend-architect
- Skills: @senior-backend
- Supabase auth integration
- Role handling (admin/staff)

---

### Phase 3: Kanban Board UI

#### Task 3.1 – Board Layout

- Agent: @ui-ux-designer
- Skills: @frontend-design
- Design column layout

#### Task 3.2 – Implement Kanban UI

- Agent: @frontend-developer
- Skills: @senior-frontend
- Columns + cards rendering

#### Task 3.3 – Drag & Drop

- Agent: @frontend-developer
- Skills: @react-best-practices
- Use @dnd-kit for drag-and-drop implementation
- Implement status-based movement (update `status` field on drop)
- Ensure smooth UX across columns

---

### Phase 4: Order Management

#### Task 4.1 – Create Order Modal

- Agent: @ui-ux-designer
- Skills: @frontend-design

#### Task 4.2 – Order CRUD

- Agent: @backend-architect
- Skills: @senior-backend
- Create, read, update orders

#### Task 4.3 – Frontend Integration

- Agent: @frontend-developer
- Skills: @senior-frontend
- Connect UI to backend

---

### Phase 5: Pricing System

#### Task 5.1 – Settings Table

- Agent: @backend-architect
- Skills: @senior-backend

#### Task 5.2 – Admin Settings UI

- Agent: @frontend-developer
- Skills: @react-best-practices

#### Task 5.3 – Pricing Logic

- Agent: @backend-architect
- Skills: @senior-backend
- Apply price per kg
- Snapshot pricing on order creation

---

### Phase 6: Realtime Updates

#### Task 6.1 – Supabase Subscriptions

- Agent: @backend-architect
- Skills: @senior-backend

#### Task 6.2 – UI Realtime Sync

- Agent: @frontend-developer
- Skills: @senior-frontend

---

### Phase 7: Internal Notifications

#### Task 7.1 – New Order Highlight

- Agent: @frontend-developer
- Skills: @react-best-practices

---

### Phase 8: Code Review & Cleanup

#### Task 8.1 – Full Review

- Agent: @code-reviewer
- Skills: @code-reviewer
- Ensure best practices
- Refactor where needed

---

## Future Enhancements (DO NOT BUILD YET)

- Messenger integration
- Automated order intake
- Customer notifications
- Staff assignment
- Analytics dashboard

---

## Key Principles

- Keep MVP simple
- Optimize for real-world usage
- Avoid premature automation
- Build for extensibility

---

## Agents & Skills Reference

### Frontend

#### @frontend-developer (Agent)

Responsible for implementing all frontend features including pages, components, state management, and integrations with backend services.

#### @senior-frontend (Skill)

Applies advanced frontend architecture, performance optimization, scalability, and clean code structuring.

#### @react-best-practices (Skill)

Ensures proper React patterns such as hooks usage, component composition, state management, and avoiding anti-patterns.

---

### UI/UX

#### @ui-ux-designer (Agent)

Responsible for designing user interfaces, layouts, and ensuring usability and clarity for non-technical staff users.

#### @frontend-design (Skill)

Focuses on spacing, visual hierarchy, accessibility, and clean integration with Tailwind + shadcn/ui components.

---

### Backend

#### @backend-architect (Agent)

Designs backend systems including database schema, API structure, and overall data flow.

#### @senior-backend (Skill)

Ensures scalable, secure, and maintainable backend logic including Supabase integration and data consistency.

---

### Code Review

#### @code-reviewer (Agent)

Reviews the entire codebase to ensure quality, maintainability, and adherence to best practices.

#### @code-reviewer (Skill)

Applies strict validation of code standards, identifies bugs, suggests refactors, and ensures production readiness.

---

## Notes for Claude Code

- Do not implement everything at once
- Execute tasks sequentially by phase
- Keep components modular
- Validate each phase before moving forward

---

End of Spec
