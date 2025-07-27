# NutriStats Database

## Database File Location
- **File**: `src/data/nutrition_app.db`
- **Type**: SQLite database
- **Status**: Tracked in git repository

## Why Database is Tracked
The SQLite database file is intentionally included in the git repository for the following reasons:

1. **Demo Data**: Contains pre-populated demo data for the "NutriStats" user
2. **Easy Setup**: New developers can clone and run immediately without setup
3. **Consistent State**: Everyone gets the same initial data and structure
4. **Small Size**: SQLite files are typically small and suitable for git tracking

## Demo User
- **Username**: NutriStats
- **Email**: demo@nutristats.com
- **Purpose**: Showcases app functionality with realistic weekly meal data
- **Data**: Includes 7 days of meals with green/yellow/red status distribution

## Database Schema
The database includes the following main tables:
- `users` - User accounts and authentication
- `foods` - Global food database (shared)
- `user_foods` - User-specific food customizations
- `user_meals` - Daily meal tracking data
- `user_settings` - User preferences and settings
- `user_daily_macros` - Daily macro targets per user
- `weight_entries` - Weight tracking data

## Regenerating Demo Data
To regenerate the demo data:
```bash
npm run demo-data
```

## Database Migrations
Database schema updates are handled automatically on server startup through the initialization scripts in `src/database/init.js`.