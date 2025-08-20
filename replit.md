# Kanban Board Application

## Overview

This is a modern Kanban board application built with React and Express.js that provides project management capabilities with advanced features like AI assistance, dark/light theme support, and comprehensive task management. The application follows a full-stack architecture with a TypeScript-based Express backend serving a React frontend with drag-and-drop functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Framework**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS styling
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Drag & Drop**: Hello Pangea DnD (react-beautiful-dnd successor) for kanban board interactions
- **Animations**: Framer Motion for smooth UI transitions and micro-interactions
- **Styling**: Tailwind CSS with custom CSS variables for theming, glass morphism effects, and responsive design

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with structured error handling and request logging middleware
- **Development Setup**: Vite middleware integration for hot module replacement in development
- **Database Layer**: Abstracted storage interface allowing for multiple storage implementations (currently in-memory with database-ready structure)

### Data Storage & Schema
- **ORM**: Drizzle ORM configured for PostgreSQL with Neon Database serverless driver
- **Schema Design**: Normalized relational structure with tables for boards, columns, tasks, dependencies, and comments
- **Data Types**: UUID primary keys, timestamps for audit trails, arrays for tags, and enum-like fields for priority/status
- **Database Features**: Support for task dependencies, comments, progress tracking, and due dates

### Authentication & Session Management
- **Session Store**: Connect-pg-simple for PostgreSQL-backed session storage
- **Security**: Configured for production with secure session handling

### Theme System
- **Implementation**: React Context-based theme provider with localStorage persistence
- **Styling**: CSS custom properties (variables) for seamless dark/light mode switching
- **Components**: All UI components support both themes with automatic color adaptation

### AI Integration
- **Provider**: OpenAI API integration for intelligent task suggestions and workflow optimization
- **Features**: Board analysis, task prioritization suggestions, deadline predictions, and workflow improvements
- **Architecture**: Dedicated AI assistant component with suggestion categorization and action recommendations

## External Dependencies

### Core Frontend Libraries
- **React Ecosystem**: React 18, React DOM, React Hook Form with Zod validation
- **UI Components**: Radix UI primitives (dialogs, dropdowns, tooltips, etc.)
- **Styling**: Tailwind CSS, class-variance-authority for component variants, clsx for conditional classes
- **Drag & Drop**: @hello-pangea/dnd for kanban board functionality
- **Animations**: Framer Motion for transitions and micro-interactions
- **Date Handling**: date-fns for date formatting and manipulation

### Backend Dependencies
- **Server Framework**: Express.js with middleware for JSON parsing and URL encoding
- **Database**: Drizzle ORM with @neondatabase/serverless driver for PostgreSQL
- **Session Management**: express-session with connect-pg-simple store
- **Validation**: Zod for runtime type checking and API validation
- **AI Services**: OpenAI SDK for GPT integration

### Development Tools
- **Build System**: Vite with React plugin and TypeScript support
- **Database Tools**: Drizzle Kit for schema migrations and database management
- **Code Quality**: TypeScript for type safety, ESLint configuration via Replit tools
- **Development Utilities**: tsx for running TypeScript files, esbuild for production bundling

### Third-Party Services
- **Database**: Neon Database (serverless PostgreSQL)
- **AI Provider**: OpenAI API for intelligent suggestions
- **Hosting**: Configured for Replit deployment with development banner integration
- **Fonts**: Google Fonts (Inter, DM Sans, Fira Code, Geist Mono, Architects Daughter)

### UI Enhancement Libraries
- **Command Palette**: cmdk for search and command functionality
- **Carousel**: Embla Carousel React for image/content carousels
- **Charts**: Recharts for data visualization (configured but not actively used)
- **Utilities**: nanoid for unique ID generation, lucide-react for icons