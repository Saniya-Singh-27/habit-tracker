# Storage Guide - Viewing Stored Data & Understanding AsyncStorage

## 📱 How to View Stored Data

### Method 1: Using the Debug Page (Easiest)

1. **Navigate to the debug page:**
   - Open your app
   - Go to `/debug` route
   - Or add a link in your navigation

2. **What you'll see:**
   - ✅ All registered users in the database
   - ✅ Current logged-in user session
   - ✅ All notifications
   - ✅ AsyncStorage/localStorage contents
   - ✅ Database status and platform info
   - ✅ Storage location information

3. **Features:**
   - **Refresh Data** button - Updates all displayed data
   - **Clear Database** button - Deletes all data (use with caution!)

---

## 🔍 Viewing Data on Different Platforms

### Web (Browser)

#### View IndexedDB (User Accounts):
1. Open **Chrome DevTools** (F12)
2. Go to **Application** tab (or **Storage** in Firefox)
3. Expand **IndexedDB** → **HabitTrackerDB**
4. Click on **users** or **notifications** store
5. ✅ See all stored data

#### View localStorage (Session):
1. In **Application** tab
2. Go to **Local Storage** → **localhost:8081** (or your port)
3. Find **habit_tracker_current_user**
4. ✅ See current session data

#### View All Storage:
- **Application** tab shows:
  - IndexedDB (database)
  - Local Storage (session)
  - Session Storage
  - Cookies

---

### Android (Native)

#### View SQLite Database:
1. **Using Android Studio:**
   - Open Android Studio
   - Connect your device/emulator
   - Go to **View** → **Tool Windows** → **Device File Explorer**
   - Navigate to: `/data/data/[your.package.name]/databases/`
   - Find `HabitTrackerDB.db`
   - Download and open with SQLite browser

2. **Using ADB (Command Line):**
   ```bash
   # List databases
   adb shell run-as [your.package.name] ls databases/
   
   # Pull database to computer
   adb shell run-as [your.package.name] cp databases/HabitTrackerDB.db /sdcard/
   adb pull /sdcard/HabitTrackerDB.db
   
   # Open with SQLite browser
   sqlite3 HabitTrackerDB.db
   .tables
   SELECT * FROM users;
   ```

3. **Using React Native Debugger:**
   - Install React Native Debugger
   - Open AsyncStorage inspector
   - View all stored keys and values

#### View AsyncStorage:
- **Location:** `/data/data/[package]/databases/RKStorage`
- **Format:** SQLite database
- **Tool:** Use React Native Debugger or check via code

---

### iOS (Native)

#### View SQLite Database:
1. **Using Xcode:**
   - Open Xcode
   - Connect your device
   - Go to **Window** → **Devices and Simulators**
   - Select your device → **Installed Apps**
   - Click **Download Container**
   - Navigate to: `AppData/Documents/`
   - Find `HabitTrackerDB.db`

2. **Using Simulator:**
   ```bash
   # Find simulator directory
   ~/Library/Developer/CoreSimulator/Devices/[DEVICE_ID]/data/Containers/Data/Application/[APP_ID]/Documents/
   
   # Open database
   sqlite3 HabitTrackerDB.db
   .tables
   SELECT * FROM users;
   ```

#### View AsyncStorage:
- **Location:** App's Documents directory
- **Format:** SQLite database (RKStorage)
- **Tool:** Use Xcode or React Native Debugger

---

## 📚 Understanding AsyncStorage

### What is AsyncStorage?

AsyncStorage is React Native's **persistent key-value storage system**. It's similar to `localStorage` in web browsers but designed for mobile devices.

### Key Characteristics:

1. **Asynchronous Operations:**
   - All operations return Promises
   - Non-blocking (doesn't freeze the UI)
   - Must use `await` or `.then()`

2. **String Storage:**
   - Only stores strings
   - Objects must be JSON stringified
   - Numbers/booleans converted to strings

3. **Persistent:**
   - Data survives app restarts
   - Data survives device reboots
   - Data deleted only when:
     - App is uninstalled
     - User clears app data
     - You explicitly delete it

4. **Platform-Specific:**
   - **Android:** Uses SQLite database (RKStorage)
   - **iOS:** Uses SQLite database (RKStorage)
   - **Web:** Uses browser's localStorage

---

## 🔧 How AsyncStorage Works in This App

### Storage Structure:

```typescript
// Key: "habit_tracker_current_user"
// Value: JSON string of user object
{
  "id": "abc123",
  "email": "user@example.com",
  "name": "John Doe"
}
```

### Code Example:

```typescript
// Saving data
const user = { id: '123', email: 'user@example.com', name: 'John' };
await AsyncStorage.setItem('habit_tracker_current_user', JSON.stringify(user));

// Reading data
const userData = await AsyncStorage.getItem('habit_tracker_current_user');
const user = userData ? JSON.parse(userData) : null;

// Deleting data
await AsyncStorage.removeItem('habit_tracker_current_user');

// Getting all keys
const allKeys = await AsyncStorage.getAllKeys();

// Getting multiple items
const items = await AsyncStorage.multiGet(['key1', 'key2']);
```

---

## 📍 Where Data is Stored

### Web (Browser):
- **IndexedDB:** Browser's IndexedDB storage
  - Location: Browser's local storage directory
  - Persists: Until browser data is cleared
  - Access: DevTools → Application → IndexedDB

- **localStorage:** Browser's localStorage
  - Location: Browser's local storage directory
  - Persists: Until browser data is cleared
  - Access: DevTools → Application → Local Storage

### Android:
- **SQLite Database:**
  - Path: `/data/data/[package.name]/databases/HabitTrackerDB.db`
  - Persists: Until app is uninstalled
  - Access: Requires root or ADB

- **AsyncStorage:**
  - Path: `/data/data/[package.name]/databases/RKStorage`
  - Persists: Until app is uninstalled
  - Access: Requires root or ADB

### iOS:
- **SQLite Database:**
  - Path: `App's Documents directory/HabitTrackerDB.db`
  - Persists: Until app is uninstalled
  - Access: Xcode → Device → Download Container

- **AsyncStorage:**
  - Path: `App's Documents directory/RKStorage`
  - Persists: Until app is uninstalled
  - Access: Xcode → Device → Download Container

---

## 🛠️ Tools for Viewing Data

### 1. **React Native Debugger**
- Download: [GitHub - React Native Debugger](https://github.com/jhen0409/react-native-debugger)
- Features:
  - View AsyncStorage contents
  - Inspect network requests
  - Debug Redux state
  - View console logs

### 2. **SQLite Browser**
- Download: [DB Browser for SQLite](https://sqlitebrowser.org/)
- Use: Open `.db` files downloaded from device
- Features:
  - View tables
  - Run queries
  - Edit data
  - Export data

### 3. **Chrome DevTools** (Web)
- Built into Chrome/Edge
- Access: F12 → Application tab
- Features:
  - View IndexedDB
  - View localStorage
  - Edit/delete data
  - Clear storage

### 4. **Xcode** (iOS)
- Built into Xcode
- Access: Window → Devices → Download Container
- Features:
  - View app files
  - Download databases
  - Inspect app data

### 5. **Android Studio** (Android)
- Built into Android Studio
- Access: View → Tool Windows → Device File Explorer
- Features:
  - Browse device files
  - Download databases
  - View app data

---

## 🔐 Security Notes

⚠️ **Important:**
- Data is stored **locally on the device**
- Data is **NOT encrypted** by default
- Passwords are stored in **plain text** (for demo purposes)
- In production, always:
  - Hash passwords (bcrypt, argon2)
  - Encrypt sensitive data
  - Use secure storage for tokens
  - Implement proper authentication

---

## 📊 Data Flow in This App

```
User Signs Up/Logs In
    ↓
AuthContext.saveSession()
    ↓
Platform Check:
    ├─ Web → localStorage.setItem()
    └─ Native → AsyncStorage.setItem()
    ↓
Data Stored:
    ├─ Session: AsyncStorage/localStorage
    └─ User Account: SQLite/IndexedDB
    ↓
App Restarts
    ↓
AuthContext.loadSession()
    ↓
Platform Check:
    ├─ Web → localStorage.getItem()
    └─ Native → AsyncStorage.getItem()
    ↓
User Automatically Logged In ✅
```

---

## 🧪 Testing Storage

### Test Persistence:
1. Sign up with a new account
2. Close the app completely
3. Reopen the app
4. ✅ Should still be logged in

### Test Data Storage:
1. Sign up with multiple accounts
2. Go to `/debug` page
3. ✅ See all users in database
4. Logout and login with different account
5. ✅ Session changes correctly

### Clear All Data:
1. Go to `/debug` page
2. Click "Clear Database"
3. ✅ All users and notifications deleted
4. ✅ Session cleared
5. Need to sign up again

---

## 💡 Tips

1. **Always use try-catch** when working with AsyncStorage
2. **JSON.stringify/parse** objects before storing
3. **Check for null** when reading data
4. **Use unique keys** to avoid conflicts
5. **Clear old data** periodically to save space
6. **Test on both platforms** (web and native)

---

## 📝 Summary

- **View Data:** Use `/debug` page or platform-specific tools
- **AsyncStorage:** Key-value storage, async operations, persists data
- **Location:** Device-specific paths (see above)
- **Format:** SQLite on native, IndexedDB/localStorage on web
- **Persistence:** Until app uninstall or explicit deletion

For more details, check the `/debug` page in your app!

