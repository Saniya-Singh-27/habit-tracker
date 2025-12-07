# Authentication System Documentation

## Overview
The Habit Tracker app now has a complete local storage-based authentication system. Only users who have signed up can log in.

## How It Works

### 1. **User Registration (Signup)**
When a user signs up:
- Email must be valid and not already registered
- Password must be at least 6 characters
- Name must be provided
- User account is stored in `localStorage` under key `habit_tracker_users`
- User is automatically logged in
- Session is saved in `localStorage` under key `habit_tracker_current_user`

### 2. **User Login**
When a user logs in:
- Email must exist in registered users
- Password must match exactly what was stored during signup
- Session is created and stored in localStorage
- User can access the dashboard

### 3. **Session Persistence**
- When the app loads, it checks localStorage for `habit_tracker_current_user`
- If found, user is automatically logged in
- If not found, user is sent to login screen

### 4. **Logout**
- Current user session is removed from localStorage
- User is sent back to login screen

## localStorage Keys

### `habit_tracker_users`
Stores array of all registered users:
```json
[
  {
    "id": "abc123xyz",
    "email": "user@example.com",
    "name": "John Doe",
    "password": "mypassword123"
  }
]
```

### `habit_tracker_current_user`
Stores currently logged-in user (without password):
```json
{
  "id": "abc123xyz",
  "email": "user@example.com",
  "name": "John Doe"
}
```

## Validation Rules

### Signup Validation
✓ Email format must be valid (contain @)
✓ Email must not already exist
✓ Password must be 6+ characters
✓ Name is required
✓ Password confirmation must match

### Login Validation
✓ Email must exist in registered users
✓ Password must match exactly
✓ Returns specific error messages for each case

## Error Messages

### Signup Errors
- "Invalid email format" - Email doesn't contain @
- "Password must be at least 6 characters" - Password too short
- "Name is required" - Name field empty
- "Email already registered. Please login instead." - Email exists

### Login Errors
- "Email and password are required" - Missing fields
- "User not found. Please sign up first." - Email not registered
- "Invalid password" - Wrong password

## Testing the System

### Test Case 1: Create New User
1. Go to Signup
2. Enter: Name: "John Doe", Email: "john@example.com", Password: "123456"
3. Confirm Password: "123456"
4. Click Sign Up
5. Should be logged in and redirected to Dashboard

### Test Case 2: Login with Correct Credentials
1. Logout from Dashboard
2. Go to Login
3. Enter: Email: "john@example.com", Password: "123456"
4. Click Sign In
5. Should be logged in and redirected to Dashboard

### Test Case 3: Login with Wrong Password
1. Go to Login
2. Enter: Email: "john@example.com", Password: "wrongpassword"
3. Click Sign In
4. Should show error: "Invalid password"

### Test Case 4: Signup with Existing Email
1. Go to Signup
2. Enter: Name: "Jane Doe", Email: "john@example.com" (same as before), Password: "123456"
3. Click Sign Up
4. Should show error: "Email already registered. Please login instead."

### Test Case 5: Login with Non-existent Email
1. Go to Login
2. Enter: Email: "nonexistent@example.com", Password: "123456"
3. Click Sign In
4. Should show error: "User not found. Please sign up first."

## Debug Page
Visit `/debug` to see:
- Currently logged-in user
- All registered users
- Storage information
- Option to clear all data

## Production Notes
⚠️ **IMPORTANT FOR PRODUCTION:**
- Never store passwords in plain text (current implementation is for demo only)
- Use proper password hashing (bcrypt, argon2) on backend
- Move authentication to a backend server
- Use secure tokens (JWT) instead of storing user data in localStorage
- Use HTTPS only
- Implement proper session management
- Add email verification
- Add password reset functionality
- Use secure cookies with httpOnly and secure flags

## File Structure
```
context/
├── AuthContext.tsx          # Authentication logic & validation

app/
├── login.tsx               # Login form with validation
├── signup.tsx              # Signup form with validation
├── dashboard.tsx           # User dashboard (authenticated)
├── debug.tsx               # Debug page for testing
└── (tabs)/
    ├── index.tsx           # Habits page (authenticated)
    └── explore.tsx         # Settings page (authenticated)

components/
└── NavigationBar.tsx       # Navigation with logout
```
