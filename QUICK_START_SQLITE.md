# SQLite Setup - Quick Start ✅

## What's New?

Your authentication now uses **IndexedDB (web equivalent of SQLite)** instead of localStorage!

### Benefits:
- ✅ Persistent data storage
- ✅ Structured database schema
- ✅ Support for complex queries
- ✅ Email uniqueness enforcement
- ✅ Ready for migration to real SQLite (native) or PostgreSQL (backend)

## Installation Complete ✨

No npm packages needed! Everything is built-in:
- **Web**: Uses IndexedDB (standard browser API)
- **Native**: Will use expo-sqlite when built for Android/iOS

## File Changes

### New File: `services/DatabaseService.ts`
```
✅ Database initialization
✅ Users table schema
✅ CRUD operations (Create, Read, Update, Delete)
✅ Email lookup with indexing
✅ Support for web & native
```

### Updated: `context/AuthContext.tsx`
```
✅ Now uses DatabaseService
✅ All auth functions work with database
✅ Same API as before - no breaking changes
```

### Updated: `app/debug.tsx`
```
✅ Shows data from database
✅ Displays IndexedDB info
✅ Can clear all database data
```

## Quick Test (2 minutes)

### 1. Start Fresh
```
Go to /debug page
Click "Clear Database"
```

### 2. Create Two Users
**User 1:**
- Name: Alice Johnson
- Email: alice@example.com
- Password: alice123

**User 2:**
- Name: Bob Smith
- Email: bob@example.com
- Password: bob12345

### 3. View Database
```
Go to /debug
You should see both users listed
```

### 4. Test Persistence
1. Refresh browser (F5)
2. ✅ Still logged in (session from localStorage)
3. Close tab completely
4. Reopen and go to /debug
5. ✅ Both users still there (data from IndexedDB)
6. Logout
7. Login as Alice
8. ✅ Works perfectly!

### 5. Test Uniqueness
1. Try to signup with alice@example.com
2. ✅ You get error: "Email already registered"
3. Try to login with alice@example.com + bob12345
4. ✅ You get error: "Invalid password"

## View Database in Browser

### For Chrome/Firefox:
1. Open DevTools (F12)
2. Go to **Application** tab
3. Expand **IndexedDB** → **HabitTrackerDB** → **users**
4. ✅ See all stored users (with passwords visible)

### For LocalStorage (session data):
1. **Local Storage** → **localhost:8082**
2. Find **habit_tracker_current_user**
3. ✅ See currently logged-in user

## How It Works Internally

### IndexedDB Database
```
Database: HabitTrackerDB
├── Store: "users"
│   ├── Keypath: "id"
│   ├── Index: "email" (unique)
│   └── Data:
│       ├── id: "abc123xyz"
│       ├── email: "alice@example.com"
│       ├── name: "Alice Johnson"
│       └── password: "alice123"
```

### API Calls Flow
```
User clicks Signup
  ↓
AuthContext.signup() called
  ↓
db.getUserByEmail() checks if email exists
  ↓
db.addUser() saves to database (IndexedDB)
  ↓
localStorage.setItem() saves session
  ↓
User logged in ✅
```

## Code Examples

### In Your Components:
```typescript
import { useAuth } from '@/context/AuthContext';

function MyComponent() {
  const { user, login, signup, logout, isAuthenticated } = useAuth();
  
  // All existing code works the same way
  // Data is just stored in database now instead of localStorage
}
```

### Access Database Directly (if needed):
```typescript
import { db } from '@/services/DatabaseService';

// Get all users
const allUsers = await db.getAllUsers();

// Get specific user
const user = await db.getUserByEmail('alice@example.com');

// Add user
await db.addUser({
  id: 'user456',
  email: 'charlie@example.com',
  name: 'Charlie Brown',
  password: 'charlie789'
});

// Clear everything
await db.deleteAllUsers();
```

## What Happens on Different Devices

### Web Browser
- **Users table**: Stored in IndexedDB
- **Current session**: Stored in localStorage
- **Persistence**: Survives page refresh ✅
- **Scope**: Per browser (each browser has separate database)

### Android Phone
- **Users table**: Stored in SQLite (when built with Expo)
- **Current session**: Stored in AsyncStorage
- **Persistence**: Survives app restart ✅
- **Scope**: Per app

### iOS iPhone
- **Users table**: Stored in SQLite (when built with Expo)
- **Current session**: Stored in AsyncStorage
- **Persistence**: Survives app restart ✅
- **Scope**: Per app

## Debugging Tips

### See Database Calls
```
Open DevTools Console
Look for logs like:
"Database opened successfully"
"User added successfully"
"Failed to get user by email"
```

### Check if Database is Initialized
```typescript
// In browser console:
const { db } = await import('./services/DatabaseService.ts');
const status = await db.getStatus();
console.log(status);
// Output: { initialized: true, userCount: 2 }
```

### Clear Everything (Fresh Start)
```
DevTools → Application → IndexedDB → HabitTrackerDB → Right-click → Delete
DevTools → Application → Local Storage → Delete habit_tracker_current_user
```

## Next: Scale to Real Database

### Option 1: Stay on Web
```
IndexedDB (current) → Upgrade to:
- CouchDB
- Firebase Firestore
- Backend API + PostgreSQL
```

### Option 2: Add Backend API
```
Current IndexedDB → Add Node.js/Express server:
- Save to PostgreSQL
- Implement real password hashing
- Add security (JWT tokens, CORS)
- Sync with app
```

### Option 3: Go Native
```
Web + Native simultaneously:
- Native builds with expo-sqlite
- Web uses IndexedDB
- Same DatabaseService for both
- Both persist independently
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Database not initialized" | Wait for page to load completely |
| Users disappear after refresh | Check IndexedDB in DevTools exists |
| Can't signup with same email | This is correct! Use login instead |
| "Email already registered" error | Email exists in database ✅ |
| Forgot password to test | Go to `/debug` → Clear Database → Try again |

## Files Reference

```
📁 habittracker/
├── 📄 services/DatabaseService.ts       ← Database layer
├── 📄 context/AuthContext.tsx           ← Auth logic
├── 📄 app/
│   ├── login.tsx                        ← Login form
│   ├── signup.tsx                       ← Signup form
│   ├── debug.tsx                        ← View database data
│   └── dashboard.tsx
├── 📄 SQLITE_SETUP.md                   ← Full technical docs
└── 📄 QUICK_START_SQLITE.md             ← This file
```

## Key Learnings

✅ IndexedDB is like SQLite for the web
✅ Can store structured data with tables/stores
✅ Has indexes for fast lookups
✅ Data persists between sessions
✅ Can be queried with promises
✅ Perfect for learning database concepts

Ready to test? 🚀

1. Open `http://localhost:8082`
2. Sign up a new user
3. Go to `/debug`
4. See your user in the database!
