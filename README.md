# 🎯 Mentorship Platform

A comprehensive mentorship management platform built with Next.js, Supabase, and OpenAI integration. This platform facilitates mentor-mentee relationships through AI-powered meeting summaries, analytics, and user management.

## ✨ Features

### 🔐 **Authentication & User Management**
- **User Registration & Login** - Secure authentication with Supabase
- **Role-based Access** - Separate interfaces for mentors and mentees
- **Profile Management** - Comprehensive user profiles with expertise tracking
- **Dynamic Navigation** - Context-aware navbar that adapts to user state

### 📝 **Meeting Logging & AI Summarization**
- **Smart Meeting Logs** - Role-based questionnaires for mentors and mentees
- **AI-Powered Summaries** - OpenAI GPT integration for automatic meeting summaries
- **Next Steps Generation** - AI suggests follow-up discussion topics
- **Session Tracking** - Complete meeting history and progress tracking

### 📊 **Analytics Dashboard**
- **Survey Analytics** - Comprehensive analysis of mentor and mentee feedback
- **Progress Tracking** - Visual representation of mentorship progress
- **Data Visualization** - Interactive charts and metrics using Recharts

### 🎨 **Modern UI/UX**
- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **Landing Page** - Professional marketing site with feature highlights
- **Component Library** - Reusable UI components with Radix UI
- **Dark/Light Mode Ready** - Flexible theming system

## 🛠️ **Tech Stack**

### **Frontend**
- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives

### **Backend & Database**
- **Supabase** - Backend-as-a-Service with PostgreSQL
- **Supabase Auth** - Authentication and user management
- **Real-time Subscriptions** - Live data updates

### **AI & Integrations**
- **OpenAI GPT-3.5-turbo** - Meeting summarization and analysis
- **Google Calendar API** - Meeting scheduling (ready for integration)
- **WhatsApp Integration** - Meeting sharing via Twilio (planned)

### **Development Tools**
- **ESLint** - Code linting and quality
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Supabase account
- OpenAI API key

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/singapore25/Team-8.git
   cd Team-8
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```bash
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key

   # Google Calendar API (Optional - for meeting scheduling)
   GOOGLE_CALENDAR_CLIENT_ID=your_client_id
   GOOGLE_CALENDAR_CLIENT_SECRET=your_client_secret
   GOOGLE_CALENDAR_REFRESH_TOKEN=your_refresh_token
   ```

4. **Database Setup**
   ```bash
   # Generate TypeScript types from Supabase
   npm run codegen
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 **Project Structure**

```
Team-8/
├── app/                          # Next.js App Router
│   ├── analytics/               # Analytics dashboard
│   ├── api/                     # API routes
│   │   ├── profile/            # User profile management
│   │   ├── sessions/           # Meeting session storage
│   │   └── summarize/          # AI summarization
│   ├── logging/                # Meeting logging interface
│   ├── login/                  # Authentication pages
│   ├── profile/                # User profile management
│   └── signup/                 # User registration
├── components/                  # React components
│   ├── global_navbar/          # Navigation component
│   ├── landing_page/           # Marketing site components
│   ├── questionnaire/          # Meeting feedback forms
│   └── ui/                     # Reusable UI components
├── lib/                         # Utility libraries
│   ├── algo/                   # Matching algorithms
│   ├── supabase/               # Database client
│   └── utils.ts                # Helper functions
└── public/                     # Static assets
```

## 🔧 **Available Scripts**

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run codegen      # Generate TypeScript types from Supabase
```

## 🎯 **Key Features Deep Dive**

### **Meeting Logging System**
- **Role-based Questionnaires**: Different questions for mentors vs mentees
- **Star Ratings**: Enjoyment and satisfaction tracking
- **Progress Monitoring**: Track mentee development over time
- **AI Summarization**: Automatic meeting summaries with next steps

### **Analytics & Reporting**
- **Survey Data Analysis**: Comprehensive feedback analysis
- **Progress Visualization**: Charts and metrics for mentorship tracking
- **Export Capabilities**: Data export for external analysis

### **User Experience**
- **Responsive Design**: Works seamlessly on all devices
- **Intuitive Navigation**: Context-aware interface
- **Real-time Updates**: Live data synchronization
- **Accessibility**: WCAG compliant components

## 🔐 **Security & Privacy**

- **Secure Authentication**: Supabase Auth with JWT tokens
- **Data Encryption**: All data encrypted in transit and at rest
- **Role-based Access**: Proper authorization for different user types
- **Environment Variables**: Sensitive data stored securely

## 🚧 **Roadmap**

### **Phase 1: Core Features** ✅
- [x] User authentication and profiles
- [x] Meeting logging and AI summarization
- [x] Analytics dashboard
- [x] Responsive UI/UX

### **Phase 2: Advanced Features** 🚧
- [ ] Google Meet integration for scheduling
- [ ] WhatsApp notifications via Twilio
- [ ] Advanced matching algorithms
- [ ] Mobile app development

### **Phase 3: Enterprise Features** 📋
- [ ] Multi-tenant support
- [ ] Advanced analytics and reporting
- [ ] Integration with external calendar systems
- [ ] API for third-party integrations

## 👥 **Team**

- **Frontend Development**: React, Next.js, TypeScript
- **Backend Development**: Supabase, PostgreSQL
- **AI Integration**: OpenAI GPT-3.5-turbo
- **UI/UX Design**: Tailwind CSS, Radix UI
