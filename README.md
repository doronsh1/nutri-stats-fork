# NutriStats - Pro Athlete Nutrition Planning & Analytics Platform

[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-3.0+-003B57?style=flat&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![JWT](https://img.shields.io/badge/JWT-Authentication-000000?style=flat&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![Express](https://img.shields.io/badge/Express.js-4.18+-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.0+-7952B3?style=flat&logo=bootstrap&logoColor=white)](https://getbootstrap.com/)

A comprehensive web-based nutrition tracking and analytics platform specifically designed for professional athletes and sports nutrition professionals. This application provides advanced meal planning, macro tracking, weight management, and performance analytics to optimize athletic nutrition strategies.

> **Related Project:** [NutriStats-FrontEnd Automation](https://github.com/yourusername/NutriStats-FrontEnd-Automation) - Comprehensive E2E testing suite for this application.

## 🎯 Overview

NutriStats is engineered to meet the demanding nutritional requirements of professional athletes, providing precise macro tracking, performance-oriented meal planning, and comprehensive analytics. Built with vanilla JavaScript and modern web technologies, it offers a robust, scalable solution for sports nutrition management.

## ✨ Core Features

### 🏃‍♂️ Professional Athlete Nutrition Planning
- **Precision Macro Tracking** - Track up to 6 meals per day with exact macro calculations
- **Performance-Based Meal Timing** - Schedule meals around training and competition
- **Advanced Calorie Cycling** - Support for periodized nutrition plans
- **Real-time Nutritional Analysis** - Instant calculations for calories, carbs, protein, fat
- **Custom Macro Ratios** - Tailored to sport-specific requirements
- **Weekly Nutrition Periodization** - Plan nutrition cycles for training phases

### 📊 Advanced Analytics & Reporting
- **Performance Nutrition Reports** - Comprehensive analytics with visual charts
- **Macro Distribution Analysis** - Detailed breakdown with customizable targets
- **Training Phase Tracking** - Nutrition alignment with training cycles
- **Progress Monitoring** - Goal tracking and performance correlation
- **Trend Analysis** - Weekly and monthly nutrition patterns
- **Export Capabilities** - Data export for sports science teams

### ⚖️ Precision Weight Management
- **Daily Weight Tracking** - Monitor weight fluctuations and trends
- **Body Composition Analysis** - Track changes over training cycles
- **Performance Weight Correlation** - Link weight changes to performance metrics
- **Competition Weight Planning** - Manage weight cuts and gains strategically
- **Visual Progress Charts** - Comprehensive weight progression analytics
- **Historical Data Management** - Long-term weight trend analysis

### 🥗 Professional Food Database
- **Sports Nutrition Database** - Comprehensive food database with precise nutritional data
- **Custom Food Creation** - Add sport-specific supplements and foods
- **Batch Food Management** - Efficient database management tools
- **Nutritional Search & Filter** - Advanced search capabilities
- **Inline Editing** - Quick modifications for accuracy
- **Import/Export Functions** - Share databases between professionals

### ⚙️ Advanced Configuration
- **Multi-Unit Support** - Metric/Imperial system flexibility
- **Personalized Targets** - Individual macro and calorie goals
- **Training Phase Settings** - Adjust nutrition for different training phases
- **User Role Management** - Support for athletes and nutrition professionals
- **Data Persistence** - Reliable SQLite database storage

### 🔐 Enterprise-Grade Security
- **JWT Authentication** - Stateless, secure token-based authentication
- **Password Security** - Bcrypt hashing with configurable salt rounds
- **Rate Limiting** - Protection against brute force attacks
- **Input Validation** - Comprehensive data sanitization
- **API Security** - Protected endpoints with proper authorization
- **Session Management** - Secure token lifecycle management

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Stats
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env file with your secure values
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000`

## 🌐 Live Demo

Experience NutriStats in action with our live deployment on Google Cloud Platform:

**🔗 Demo URL:** [http://34.59.48.42:8080](http://34.59.48.42:8080)

**Demo Credentials:**
- **Email:** demo@nutristats.com
- **Password:** NutriStats1

> **Note:** This is a demonstration environment deployed on Google Cloud Platform. Feel free to explore all features including meal tracking, weight management, food database, and analytics reporting.

### Demo Features Available:
- ✅ Complete meal tracking and macro calculations
- ✅ Weight tracking with visual analytics
- ✅ Food database management
- ✅ Comprehensive nutrition reports
- ✅ User settings and preferences
- ✅ All authentication and security features

## Security Configuration

### Environment Variables
Create a `.env` file with the following secure configurations:

```env
# JWT Configuration (REQUIRED for production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-make-it-long-and-random
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-secret-key-change-this-in-production-make-it-different
JWT_REFRESH_EXPIRES_IN=7d

# Database Configuration
DB_TYPE=sqlite
DB_PATH=./src/data/nutrition_app.db

# Server Configuration
NODE_ENV=production
PORT=3000

# Security Configuration
BCRYPT_SALT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_TIME_MINUTES=15
```

### Security Features
- **JWT Authentication**: Stateless token-based authentication
- **Password Security**: Bcrypt hashing with 12 salt rounds
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive data sanitization
- **SQL Injection Protection**: Parameterized queries
- **Token Verification**: Database-backed token validation

### Production Security Checklist
- [ ] Change all default secrets in `.env`
- [ ] Use HTTPS in production
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper CORS settings
- [ ] Set up database backups
- [ ] Monitor authentication logs
- [ ] Implement proper logging

## Usage

### Getting Started
1. Open the application in your browser
2. Create an account or log in
3. Navigate to **Settings** to configure your preferences
4. Use the **Foods DB** page to manage your food database
5. Track your meals on the **Diary** page
6. Monitor progress on the **Reports** page
7. Log weight changes in the **Weight** section

### Daily Tracking
- Select a day using the navigation buttons
- Click on any meal section to add food items
- Use the search function to find foods from your database
- Adjust portions using the amount input
- View real-time calculations in the totals section

### Weight Management
- Navigate to the Weight Tracking section
- Enter your current weight
- View statistics including latest change, total change, and averages
- Track progress over time with visual charts

### Food Management
- Add new foods with complete nutritional information
- Edit existing entries with inline editing
- Search through your food database
- Delete items you no longer need

### Reports & Analytics
- View comprehensive nutrition reports
- Analyze daily and weekly patterns
- Monitor macro distribution
- Track progress towards goals

## Project Structure

```
Stats/
├── public/                 # Frontend files
│   ├── components/        # Reusable HTML components
│   ├── css/              # Stylesheets
│   │   ├── common.css    # Shared styles
│   │   ├── components/   # Component-specific styles
│   │   └── pages/        # Page-specific styles
│   ├── js/               # JavaScript modules
│   │   ├── components/   # UI components
│   │   ├── pages/        # Page-specific logic
│   │   └── utils/        # Utility functions
│   ├── docs/             # Documentation site
│   │   ├── features/     # Feature documentation
│   │   ├── guides/       # How-to guides
│   │   └── getting-started/ # Setup guides
│   └── *.html            # Main pages
├── src/                   # Backend source code
│   ├── database/         # Database services and models
│   │   ├── userService.js
│   │   ├── weightService.js
│   │   ├── settingsService.js
│   │   ├── foodService.js
│   │   └── mealService.js
│   ├── routes/           # API routes
│   │   ├── authRoutes.js
│   │   ├── dailyMealsRoutes.js
│   │   ├── foodsRoutes.js
│   │   ├── settingsRoutes.js
│   │   └── weightRoutes.js
│   ├── middleware/       # Express middleware
│   │   └── auth.js
│   └── data/            # SQLite database storage
├── scripts/              # Utility scripts
├── server.js             # Express server
└── package.json          # Dependencies
```

## 🛠️ Technology Stack

### Frontend Architecture
- **Vanilla JavaScript (ES6+)** - Pure JavaScript implementation for optimal performance
- **HTML5** - Semantic markup and modern web standards
- **CSS3** - Advanced styling with custom properties and animations
- **Bootstrap 5** - Responsive UI framework for professional interface
- **Chart.js** - Data visualization for analytics and reporting
- **Modular Design** - Component-based architecture for maintainability

### Backend Infrastructure
- **Node.js** - High-performance JavaScript runtime
- **Express.js** - Robust web application framework
- **SQLite3** - Lightweight, reliable database for data persistence
- **JWT (JSON Web Tokens)** - Stateless authentication system
- **bcryptjs** - Industry-standard password hashing
- **UUID** - Unique identifier generation for data integrity

### Security & Performance
- **JWT Authentication** - Secure, scalable user authentication
- **Password Hashing** - Bcrypt with configurable salt rounds
- **Input Validation** - Comprehensive data sanitization
- **Rate Limiting** - API protection against abuse
- **SQL Injection Protection** - Parameterized queries
- **Session Management** - Secure token lifecycle

### Development Features
- **RESTful API Design** - Clean, predictable API endpoints
- **Modular Architecture** - Organized, maintainable codebase
- **Environment Configuration** - Flexible deployment settings
- **Error Handling** - Comprehensive error management
- **Logging System** - Detailed application monitoring
- **Database Migrations** - Version-controlled schema management

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout (protected)
- `GET /api/auth/profile` - Get current user profile (protected)
- `PUT /api/auth/profile` - Update user profile (protected)
- `GET /api/auth/verify` - Verify JWT token validity
- `POST /api/auth/refresh` - Refresh access token
- `PUT /api/auth/change-password` - Change user password (protected)

### Foods
- `GET /api/foods` - Retrieve all foods for user
- `POST /api/foods` - Add new food item
- `PUT /api/foods/:id` - Update food item
- `DELETE /api/foods/:id` - Delete food item

### Meals
- `GET /api/daily-meals/:day` - Get meals for specific day
- `POST /api/daily-meals/:day` - Save meals for specific day

### Settings
- `GET /api/settings` - Get user settings
- `POST /api/settings` - Update user settings

### Weight Tracking
- `GET /api/weight` - Get all weight entries for user
- `POST /api/weight` - Add new weight entry
- `PUT /api/weight/:id` - Update weight entry
- `DELETE /api/weight/:id` - Delete weight entry

## 🗄️ Database Management

NutriStats uses SQLite with a robust migration system for safe schema updates in both development and production environments.

### Database Schema

The application uses SQLite with the following main tables:
- **users** - User accounts and authentication
- **foods** - Food database with nutritional information
- **meals** - Daily meal tracking data
- **weight_entries** - Weight tracking records
- **user_measurements** - Body measurements tracking (waist, thigh, arm)
- **settings** - User preferences and configuration
- **migration_history** - Database version control and migration tracking

### Migration System

The database uses a version-controlled migration system that ensures safe updates:

**Check migration status:**
```bash
node scripts/migrate-database.js --status
```

**Run migrations (with dry-run first):**
```bash
node scripts/migrate-database.js --dry-run
node scripts/migrate-database.js
```

**For production environments:**
```bash
# Via SSH on production server
ssh user@server "cd /path/to/app && node scripts/migrate-database.js --status"
ssh user@server "cd /path/to/app && node scripts/migrate-database.js"

# Or using standalone script for better connection handling
node scripts/standalone-migration.js /path/to/database.db --status
```

### Key Features
- ✅ **Version Control** - Track all database changes
- ✅ **Safe Updates** - Dry-run mode to preview changes
- ✅ **Rollback Support** - Undo migrations if needed
- ✅ **Production Ready** - Handles connection timing issues
- ✅ **Zero Downtime** - Incremental schema updates

For detailed database management instructions, see [DATABASE.md](DATABASE.md).

## 🚀 Professional Applications

### For Athletes
- **Competition Preparation** - Precise nutrition planning for peak performance
- **Training Periodization** - Align nutrition with training phases
- **Weight Management** - Strategic weight cuts and gains
- **Recovery Optimization** - Post-training nutrition tracking
- **Performance Correlation** - Link nutrition to performance outcomes

### For Sports Nutritionists
- **Client Management** - Track multiple athlete nutrition plans
- **Data Analysis** - Comprehensive reporting and analytics
- **Meal Planning** - Create and manage detailed nutrition protocols
- **Progress Monitoring** - Track client adherence and results
- **Professional Reporting** - Generate detailed nutrition reports

### For Sports Teams
- **Team Nutrition Management** - Coordinate nutrition across team members
- **Performance Analytics** - Team-wide nutrition and performance correlation
- **Standardized Protocols** - Implement consistent nutrition strategies
- **Data Sharing** - Collaborate between nutritionists and coaches

## 📈 Key Metrics & Analytics

- **Macro Distribution Analysis** - Detailed carb/protein/fat breakdowns
- **Caloric Periodization** - Training phase-specific calorie tracking
- **Weight Trend Analysis** - Performance weight correlation
- **Adherence Tracking** - Nutrition plan compliance monitoring
- **Performance Correlation** - Link nutrition data to athletic performance
- **Historical Comparisons** - Long-term trend analysis

## 🎯 Target Users

- **Professional Athletes** - Elite performers requiring precise nutrition
- **Sports Nutritionists** - Professionals managing athlete nutrition
- **Strength & Conditioning Coaches** - Coaches integrating nutrition with training
- **Sports Science Teams** - Research and performance optimization teams
- **Athletic Programs** - University and professional sports programs

## 📚 Documentation

The application includes comprehensive built-in documentation:
- **Quick Start Guide** - Get up and running quickly
- **Feature Documentation** - Detailed feature explanations
- **Best Practices** - Professional nutrition tracking guidelines
- **API Documentation** - Complete endpoint reference
- **User Guides** - Step-by-step tutorials

## 🔗 Related Projects

- **[NutriStats-FrontEnd Automation](https://github.com/yourusername/NutriStats-FrontEnd-Automation)** - Comprehensive E2E testing suite with Playwright automation framework

## 📄 License

This project is designed for professional sports nutrition applications. Contact for licensing information.

## 📞 Contact

For professional inquiries, collaboration opportunities, or technical questions, please reach out through GitHub or professional channels.

---

**Optimizing Athletic Performance Through Precision Nutrition** 🏆