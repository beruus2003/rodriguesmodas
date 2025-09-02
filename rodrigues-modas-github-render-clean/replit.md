# Overview

This is a Brazilian e-commerce application for "Rodrigues Modas," specializing in women's intimate apparel (lingerie). The application is built as a full-stack web application with a React frontend and Express.js backend, featuring a comprehensive product catalog, shopping cart functionality, and order management system. The application supports both customer shopping experiences and administrative management capabilities.

# User Preferences

Preferred communication style: Simple, everyday language.
Login credentials: User requests admin login for store owner "Camila567" with password "Js180620"
Product display: Products organized in 3x3 horizontal grid layout

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing with dedicated pages for Home, Products, and Admin
- **UI Framework**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack React Query for server state management and custom hooks for local state
- **Form Handling**: React Hook Form with Zod validation for type-safe form validation
- **Authentication**: Custom authentication system with role-based access control (customer/admin)

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Session Management**: In-memory storage with plans for PostgreSQL session store (connect-pg-simple)
- **API Design**: RESTful API endpoints following conventional HTTP methods
- **Development**: Hot reload with Vite integration for seamless development experience

## Data Storage Solutions
- **Primary Database**: PostgreSQL configured through Drizzle ORM
- **ORM**: Drizzle with Zod schema validation for type safety
- **Session Storage**: Currently in-memory with fallback to PostgreSQL sessions
- **Database Migrations**: Drizzle Kit for schema migrations and database management

## Authentication and Authorization
- **Authentication Provider**: Supabase integration configured with DATABASE_URL
- **Authorization Model**: Role-based access control with "customer" and "admin" roles
- **Session Management**: In-memory storage with Supabase credentials configured
- **Access Control**: Route-level protection for admin functionality
- **Database Status**: Supabase credentials configured but using in-memory storage due to connectivity optimization

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL driver for database connectivity
- **drizzle-orm**: Type-safe ORM for database operations
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/**: Complete set of UI primitives for accessible components
- **react-hook-form**: Form state management and validation
- **zod**: Runtime type validation and schema definition

### UI and Styling
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library for consistent iconography
- **embla-carousel-react**: Carousel component for product galleries

### Development Tools
- **vite**: Fast build tool and development server
- **typescript**: Type safety across the entire application
- **drizzle-kit**: Database schema management and migrations
- **esbuild**: Fast JavaScript bundler for production builds

### Third-Party Integrations
- **Supabase**: Authentication service (requires setup and configuration)
- **Replit**: Development environment with specialized plugins for runtime error handling
- **Google Fonts**: Inter font family for consistent typography
- **Font Awesome**: Additional icon library for enhanced UI elements

### Payment and Communication
- **Mercado Pago Integration**: Complete transparent checkout with test credentials configured
- **WhatsApp Integration**: Direct customer communication for order processing
- **PIX Payment**: Brazilian instant payment system via Mercado Pago
- **Credit/Debit Cards**: Full support via Mercado Pago SDK with test cards
- **QR Code Generation**: For PIX payment processing workflows

The architecture emphasizes type safety throughout the stack, modern React patterns, and a scalable database design suitable for e-commerce operations. The application is designed to be easily deployable on various platforms while maintaining development flexibility through Vite's hot reload capabilities.

## Recent Changes (August 20, 2025)

### Final Production Preparation Changes
- **Contact Information Updated**: Email changed to contact.rodriguesmoda@gmail.com
- **Location Updated**: Changed to Fortaleza - CE
- **Social Media Updated**: Instagram link updated to @rodriguesmoda___, Facebook removed
- **WhatsApp Integration**: Confirmed +55 85 99180-2352 across all contact points
- **Header Design**: Changed background to gradient-primary, "Rodrigues Modas" displays horizontally
- **Newsletter Removal**: Replaced newsletter signup with contact information section
- **Railway Deploy Ready**: Created deployment package with instructions

### Major Shopping Experience Changes
- **No-Login Shopping**: Removed login requirement for customers to use shopping cart
- **Guest Cart System**: Simplified cart using guest userId for non-authenticated users
- **WhatsApp-Only Checkout**: Replaced payment gateway with direct WhatsApp integration
- **Simplified Authentication**: Login now only for store owner/admin (Camila567)
- **Enhanced WhatsApp Messages**: Improved message template with product details and formatting

### Cart System Overhaul
- **Guest Cart Support**: Cart works without user authentication using guest userId
- **Database Integration**: All carts use same backend system with guest/user distinction
- **WhatsApp Integration**: Custom message template with order details sent to WhatsApp
- **Simplified Checkout**: Single-step checkout process redirecting to WhatsApp

### Authentication Simplification
- **Admin-Only Login**: Removed customer registration, kept only owner login
- **Streamlined Header**: Simplified header with cart access for all, admin login for owner
- **Owner-Focused UI**: Admin interface specifically designed for store owner management

### UI/UX Improvements (Previous)
- **Store Owner Login**: Added dedicated admin login for store owner "Camila567" (password: "Js180620")
- **Product Management UI**: Replaced table-based product management with modern card-based grid layout
- **Product Display**: Organized products in responsive 3x3 grid layout for better visual management
- **Enhanced Product Cards**: Each product card shows image, name, price, stock, colors/sizes count, and edit/delete actions
- **Improved Admin UX**: Better visual hierarchy and more intuitive product management interface
- **Grid Layout**: Products now display in responsive grid (1 column mobile → 2 columns tablet → 3 columns desktop)
- **Visual Product Management**: Card-based interface with hover effects and better visual feedback
- **Streamlined Actions**: Direct edit and delete buttons on each product card for faster management
- **Status Indicators**: Clear visual badges for product status (active/inactive) and stock levels