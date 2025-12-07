# SQLite Database Setup - Complete Guide

## Overview

Your Habit Tracker now uses a **database-driven authentication system** instead of localStorage. Here's the complete setup:

## Architecture

### Web (Browser)
- **Storage**: IndexedDB (IndexedDB is the web equivalent of SQLite)
- **Session**: localStorage (for quick access to current user)
- **Location**: Browser's IndexedDB storage

### Native (Android/iOS)
- **Storage**: SQLite via expo-sqlite
- **Session**: AsyncStorage
- **Location**: Device's local storage

## What Was Changed

### 1. **New File: `services/DatabaseService.ts`**
This is the core service that handles all database operations:

```typescript
// Initialize database
await db.initialize();

// Get all users
const allUsers = await db.getAllUsers();

// Get user by email
const user = await db.getUserByEmail('user@example.com');

// Add new user
await db.addUser({ id, email, name, password });

// Update user
await db.updateUser({ id, email, name, password });

// Delete all users
await db.deleteAllUsers();

// Get database status
const status = await db.getStatus();
```

### 2. **Updated: `context/AuthContext.tsx`**
- Now uses `DatabaseService` instead of localStorage
- Same API, but data persists in database
- Session still uses localStorage for quick access

### 3. **Updated: `app/debug.tsx`**
- Shows data from the database
- Displays IndexedDB status
- Can clear database

## Database Structure

### Users Table

| Column | Type | Details |
|--------|------|---------|
| `id` | TEXT | Primary Key - unique user ID |
| `email` | TEXT | Unique - user's email address |
| `name` | TEXT | User's full name |
| `password` | TEXT | User's password (stored plaintext for demo) |
| `created_at` | TEXT | Timestamp (for SQLite) |

## How to Install & Setup

### Step 1: Check Package.json
expo-sqlite is a peer dependency that comes with the Expo SDK, so it's already available.

### Step 2: The DatabaseService automatically:
- Creates the IndexedDB database on web
- Creates the SQLite database on native
- Sets up the users table/store
- Creates indexes for fast email lookups

### Step 3: Use in Your Code
```typescript
import { db } from '@/services/DatabaseService';

// Initialize
await db.initialize();

// Get all users
const users = await db.getAllUsers();

// Add new user
await db.addUser({
  id: 'user123',
  email: 'user@example.com',
  name: 'John Doe',
  password: 'mypassword123'
});
```

## Testing the Database

### Test Case 1: Signup Creates Database Record
1. Go to Signup page
2. Create account with:
   - Name: John Doe
   - Email: john@example.com
   - Password: 123456
3. Click Sign Up
4. Go to `/debug` page
5. ✅ You should see "John Doe" in the database

### Test Case 2: Login Uses Database
1. Logout from Dashboard
2. Go to Login page
3. Try these variations:
   - Correct email & password → Login works
   - Correct email, wrong password → "Invalid password"
   - Wrong email → "User not found"
4. ✅ All validations happen using database queries

### Test Case 3: Multiple Users
1. Create user 1: john@example.com
2. Logout
3. Create user 2: jane@example.com
4. Go to `/debug`
5. ✅ Both users should be in the database

### Test Case 4: Persistence
1. Create account
2. Refresh browser (F5)
3. ✅ Session persists - you're still logged in
4. Close browser tab completely
5. Reopen browser
6. ✅ Session is restored from localStorage
7. Logout and login
8. ✅ Login works because user is in database

### Test Case 5: Database Persistence
1. Create account in user1@example.com
2. Go to `/debug` → See user in database
3. Close browser completely
4. Reopen browser
5. Go to `/debug`
6. ✅ User still appears in database
7. Go to Signup and try to use same email
8. ✅ You get "Email already registered" error

## Browser DevTools - View Database

### View IndexedDB Data:
1. Open browser DevTools (F12)
2. Go to **Application** or **Storage** tab
3. Expand **IndexedDB**
4. Find **HabitTrackerDB**
5. Expand **users** store
6. ✅ See all registered users

### View localStorage:
1. In **Application/Storage** tab
2. Go to **Local Storage**
3. Click **localhost:8082**
4. Find **habit_tracker_current_user**
5. ✅ See currently logged-in user

## File Structure

```
habittracker/
├── services/
│   └── DatabaseService.ts       # ← NEW: Database operations
├── context/
│   └── AuthContext.tsx          # ← UPDATED: Uses DatabaseService
├── app/
│   ├── login.tsx
│   ├── signup.tsx
│   ├── debug.tsx                # ← UPDATED: Shows database data
│   └── dashboard.tsx
└── ...
```

## Key Features

✅ **Persistent Storage**
- Data survives browser refresh
- Data survives browser close
- Uses standard database technology

✅ **Multi-User Support**
- Multiple users can be stored
- Each with unique email
- Independent sessions

✅ **Email Uniqueness**
- Database ensures no duplicate emails
- Email index for fast lookups
- Case-insensitive comparison

✅ **Web & Native Support**
- IndexedDB for web browsers
- SQLite for Android/iOS
- Same API for both

✅ **Easy Testing**
- Debug page to view database
- Clear all data button
- Real-time refresh

## Production Notes

⚠️ **For Production, You Need:**

1. **Password Hashing**
   ```typescript
   // Use bcrypt or argon2
   const hashedPassword = await bcrypt.hash(password, 10);
   ```

2. **Backend Server**
   - Move authentication to Node.js/Express
   - Store database on server, not in app
   - Use JWT tokens

3. **Secure Communication**
   - Use HTTPS only
   - Use secure cookies
   - Never send passwords in plain text

4. **Additional Security**
   - Implement rate limiting on login
   - Add email verification
   - Add password reset flow
   - Use session tokens with expiration

## Troubleshooting

### "Database not initialized"
- Wait for `isInitialized` to be true in AuthContext
- Check browser console for errors

### Users disappear after refresh
- Check DevTools IndexedDB is enabled
- Try clearing browser cache
- Check private/incognito mode is disabled

### Email uniqueness not working
- Make sure IndexedDB is being used
- Check browser supports IndexedDB
- Try in Chrome/Firefox

### Can't signup with same email twice
- This is correct behavior! ✅
- Database prevents duplicates
- Go to Login instead

## Learning Outcomes

You've learned:
✅ How to set up IndexedDB for web persistence
✅ How to structure database schema
✅ How to create abstraction layer (DatabaseService)
✅ How to handle async database operations
✅ How to validate uniqueness at database level
✅ How to support both web and native platforms

## Next Steps

1. **Add More Tables**
   - habits table
   - completions table
   - reminders table

2. **Query Data**
   - Get user's habits
   - Track completion history
   - Calculate streaks

3. **Sync to Backend**
   - Send data to Node.js server
   - Use real PostgreSQL/MySQL
   - Implement cloud sync

4. **Advance Security**
   - Implement password hashing
   - Add 2FA
   - Use encryption

Enjoy your database-backed authentication system! 🚀
