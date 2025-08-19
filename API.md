# NutriStats API Documentation

## Overview

The NutriStats API is a RESTful web service that provides nutrition tracking, meal planning, and health monitoring capabilities. All endpoints return JSON responses and use JWT-based authentication.

**Base URL:** `http://localhost:8080/api`

## Authentication

Most endpoints require authentication using JWT (JSON Web Tokens). Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Getting a Token

1. Register a new user with `POST /api/auth/register`
2. Login with existing credentials using `POST /api/auth/login`
3. Both endpoints return a JWT token in the response

## API Endpoints

### System/Health

#### Test API Connection
```http
GET /api/test
```
**Description:** Verify API is working  
**Authentication:** None required  
**Response:**
```json
{
  "message": "API is working"
}
```

#### Get Version Information
```http
GET /api/version
```
**Description:** Get application version and build information  
**Authentication:** None required  
**Response:**
```json
{
  "version": "1.0.0",
  "buildDate": "2024-01-01T00:00:00.000Z",
  "fullVersion": "v1.0.0"
}
```

---

### Authentication (`/api/auth`)

#### Register New User
```http
POST /api/auth/register
```
**Authentication:** None required  
**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "SecurePassword123",
  "confirmPassword": "SecurePassword123"
}
```
**Response (201):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### User Login
```http
POST /api/auth/login
```
**Authentication:** None required  
**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```
**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### Get User Profile
```http
GET /api/auth/profile
```
**Authentication:** Required  
**Response (200):**
```json
{
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Update User Profile
```http
PUT /api/auth/profile
```
**Authentication:** Required  
**Request Body:**
```json
{
  "name": "Updated Name"
}
```
**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "name": "Updated Name"
  }
}
```

#### Verify Token
```http
GET /api/auth/verify
```
**Authentication:** Required  
**Response (200):**
```json
{
  "valid": true,
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### Get Current User
```http
GET /api/auth/me
```
**Authentication:** Required  
**Response (200):**
```json
{
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### User Logout
```http
POST /api/auth/logout
```
**Authentication:** Required  
**Response (200):**
```json
{
  "message": "Logout successful"
}
```

---

### Foods Management (`/api/foods`)

All food endpoints require authentication.

#### Get All Foods
```http
GET /api/foods
GET /api/foods?search=apple
```
**Authentication:** Required  
**Query Parameters:**
- `search` (optional): Search term to filter foods
**Response (200):**
```json
{
  "foods": [
    {
      "item": "Apple",
      "calories": 95,
      "protein": 0.5,
      "carbs": 25,
      "fat": 0.3,
      "fiber": 4
    }
  ]
}
```

#### Search Foods
```http
GET /api/foods/search?q=apple
```
**Authentication:** Required  
**Query Parameters:**
- `q`: Search query
**Response (200):**
```json
{
  "foods": [
    {
      "item": "Apple",
      "calories": 95,
      "protein": 0.5,
      "carbs": 25,
      "fat": 0.3,
      "fiber": 4
    }
  ]
}
```

#### Add New Food
```http
POST /api/foods
```
**Authentication:** Required  
**Request Body:**
```json
{
  "item": "Custom Food",
  "calories": 100,
  "protein": 5,
  "carbs": 15,
  "fat": 2,
  "fiber": 3
}
```
**Response (201):** Returns the created food item

#### Update Food
```http
PUT /api/foods/:index
```
**Authentication:** Required  
**Path Parameters:**
- `index`: Index of the food item to update
**Request Body:** Same as Add New Food
**Response (200):** Returns the updated food item

#### Delete Food
```http
DELETE /api/foods/:index
```
**Authentication:** Required  
**Path Parameters:**
- `index`: Index of the food item to delete
**Response (204):** No content

---

### Daily Meals (`/api/daily-meals` or `/api/meals`)

All meal endpoints require authentication.

#### Get Daily Meals
```http
GET /api/daily-meals/:day
```
**Authentication:** Required  
**Path Parameters:**
- `day`: Day name (e.g., "monday", "tuesday")
**Response (200):**
```json
{
  "day": "monday",
  "meals": [
    {
      "id": 1,
      "time": "08:00",
      "items": [
        {
          "id": "uuid-string",
          "item": "Apple",
          "quantity": 1,
          "calories": 95,
          "protein": 0.5,
          "carbs": 25,
          "fat": 0.3
        }
      ]
    }
  ]
}
```

#### Update Meal Time
```http
PUT /api/daily-meals/:day/meals/:mealId/time
```
**Authentication:** Required  
**Path Parameters:**
- `day`: Day name
- `mealId`: Meal ID (1-6)
**Request Body:**
```json
{
  "time": "09:00"
}
```
**Response (200):**
```json
{
  "message": "Meal time updated successfully"
}
```

#### Add Item to Meal
```http
POST /api/daily-meals/:day/meals/:mealId/items
```
**Authentication:** Required  
**Path Parameters:**
- `day`: Day name
- `mealId`: Meal ID (1-6)
**Request Body:**
```json
{
  "item": "Apple",
  "quantity": 1,
  "calories": 95,
  "protein": 0.5,
  "carbs": 25,
  "fat": 0.3,
  "mealTime": "08:00"
}
```
**Response (200):** Returns the added item

#### Update Meal Item
```http
PUT /api/daily-meals/:day/meals/:mealId/items/:itemId
```
**Authentication:** Required  
**Path Parameters:**
- `day`: Day name
- `mealId`: Meal ID
- `itemId`: Item ID
**Request Body:** Same as Add Item to Meal
**Response (200):** Returns the updated item

#### Delete Meal Item
```http
DELETE /api/daily-meals/:day/meals/:mealId/items/:itemId
```
**Authentication:** Required  
**Path Parameters:**
- `day`: Day name
- `mealId`: Meal ID
- `itemId`: Item ID
**Response (200):**
```json
{
  "message": "Item deleted successfully"
}
```

#### Delete All Items from Meal
```http
DELETE /api/daily-meals/:day/meals/:mealId/items
```
**Authentication:** Required  
**Response (200):**
```json
{
  "message": "All items deleted successfully"
}
```

#### Update Daily Macros
```http
PUT /api/daily-meals/:day/macros
POST /api/daily-meals/:day/macros
```
**Authentication:** Required  
**Request Body:**
```json
{
  "proteinLevel": "moderate",
  "fatLevel": "low",
  "calorieAdjustment": 100
}
```
**Response (200):**
```json
{
  "message": "Daily macro settings updated successfully"
}
```

---

### User Settings (`/api/settings`)

#### Get User Settings
```http
GET /api/settings
```
**Authentication:** Required  
**Response (200):**
```json
{
  "userName": "John Doe",
  "sex": "male",
  "age": 30,
  "weight": 70,
  "height": 175,
  "activityLevel": "moderate",
  "bmr": 1800,
  "totalCalories": 2200,
  "mealInterval": 3
}
```

#### Update User Settings
```http
POST /api/settings
```
**Authentication:** Required  
**Request Body:**
```json
{
  "userName": "John Doe",
  "sex": "male",
  "age": 30,
  "weight": 70,
  "height": 175,
  "activityLevel": "moderate",
  "bmr": 1800,
  "totalCalories": 2200,
  "mealInterval": 3
}
```
**Response (200):**
```json
{
  "message": "Settings saved successfully"
}
```

---

### Weight Tracking (`/api/weight`)

#### Get Weight Entries
```http
GET /api/weight
```
**Authentication:** Required  
**Response (200):**
```json
{
  "entries": [
    {
      "id": "uuid-string",
      "date": "2024-01-01",
      "weight": 70.5,
      "note": "Morning weight"
    }
  ]
}
```

#### Add Weight Entry
```http
POST /api/weight
```
**Authentication:** Required  
**Request Body:**
```json
{
  "date": "2024-01-01",
  "weight": 70.5,
  "note": "Morning weight"
}
```
**Response (200):**
```json
{
  "message": "Weight entry saved successfully",
  "entry": {
    "id": "uuid-string",
    "date": "2024-01-01",
    "weight": 70.5,
    "note": "Morning weight"
  }
}
```

#### Update Weight Entry
```http
PUT /api/weight/:id
```
**Authentication:** Required  
**Path Parameters:**
- `id`: Weight entry ID
**Request Body:** Same as Add Weight Entry
**Response (200):** Returns success message and updated entry

#### Delete Weight Entry
```http
DELETE /api/weight/:id
```
**Authentication:** Required  
**Path Parameters:**
- `id`: Weight entry ID
**Response (200):**
```json
{
  "message": "Weight entry deleted successfully"
}
```

---

### Body Measurements (`/api/measurements`)

#### Get All Measurements
```http
GET /api/measurements
```
**Authentication:** Required  
**Response (200):**
```json
{
  "entries": [
    {
      "id": "uuid-string",
      "date": "2024-01-01",
      "measurementType": "Waist",
      "value": 85,
      "unit": "cm",
      "note": "After workout"
    }
  ]
}
```

#### Get Measurements by Type
```http
GET /api/measurements/type/:measurementType
```
**Authentication:** Required  
**Path Parameters:**
- `measurementType`: Type of measurement (Waist, Thigh, Arm)
**Response (200):** Returns filtered measurements

#### Get Available Measurement Types
```http
GET /api/measurements/types
```
**Authentication:** Required  
**Response (200):**
```json
{
  "types": ["Waist", "Thigh", "Arm"]
}
```

#### Get Measurement Statistics
```http
GET /api/measurements/stats/:measurementType
```
**Authentication:** Required  
**Path Parameters:**
- `measurementType`: Type of measurement
**Response (200):**
```json
{
  "totalEntries": 10,
  "minValue": 80,
  "maxValue": 90,
  "avgValue": 85,
  "firstEntryDate": "2024-01-01",
  "lastEntryDate": "2024-01-10",
  "latestChange": -1,
  "overallChange": -5
}
```

#### Add Measurement Entry
```http
POST /api/measurements
```
**Authentication:** Required  
**Request Body:**
```json
{
  "date": "2024-01-01",
  "measurementType": "Waist",
  "value": 85,
  "unit": "cm",
  "note": "After workout"
}
```
**Response (201):** Returns the created measurement entry

#### Update Measurement Entry
```http
PUT /api/measurements/:id
```
**Authentication:** Required  
**Path Parameters:**
- `id`: Measurement entry ID
**Request Body:** Same as Add Measurement Entry
**Response (200):** Returns the updated measurement entry

#### Delete Measurement Entry
```http
DELETE /api/measurements/:id
```
**Authentication:** Required  
**Path Parameters:**
- `id`: Measurement entry ID
**Response (200):**
```json
{
  "message": "Measurement entry deleted successfully"
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 409 Conflict
```json
{
  "error": "Resource already exists"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Rate Limiting

Authentication endpoints have rate limiting to prevent brute force attacks:
- Failed login attempts are tracked per email address
- After multiple failed attempts, the account is temporarily locked

---

## Data Validation

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter  
- At least 1 number
- Special characters allowed: `@$!%*?&#^()[]{}+-=_|:;"',./<>~`

### Email Format
- Must be a valid email address format

### Measurement Types
- Valid types: `Waist`, `Thigh`, `Arm`
- Valid units: `cm`, `in`, `mm`

### Activity Levels
- Valid levels: `sedentary`, `light`, `moderate`, `active`, `very_active`

---

## Development

### Starting the Server
```bash
node server.js
```

### Environment Variables
- `PORT`: Server port (default: 8080)
- `SKIP_DB_DEPLOY`: Skip database initialization (default: false)

### Database
- Uses SQLite database stored in `src/data/nutrition_app.db`
- Automatic migrations on server start
- User-specific data isolation