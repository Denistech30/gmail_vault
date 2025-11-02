# 🔧 TROUBLESHOOTING GUIDE

## ❌ **Issue: Blank Page + ERR_CONNECTION_REFUSED**

---

## 🎯 **Quick Fixes (Try in Order):**

### **Fix 1: Start the Dev Server**

**Open terminal and run:**
```bash
npm run dev
```

**Expected output:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Then open:** `http://localhost:5173/` in your browser

---

### **Fix 2: Clear Port (if port is busy)**

**If you see "Port 5173 is already in use":**

**Option A - Kill the process:**
```bash
# Find process using port 5173
netstat -ano | findstr :5173

# Kill it (replace PID with actual number)
taskkill /PID <PID> /F
```

**Option B - Use different port:**
```bash
npm run dev -- --port 3000
```

---

### **Fix 3: Clear Cache & Reinstall**

```bash
# Clear node_modules and cache
rm -rf node_modules
rm -rf .vite
rm package-lock.json

# Reinstall
npm install

# Start dev server
npm run dev
```

---

### **Fix 4: Check Firebase Config**

Make sure `src/firebase/config.js` has your Firebase credentials:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

---

### **Fix 5: Check for Import Errors**

**Open browser console (F12) and look for:**
- ❌ Module import errors
- ❌ Firebase initialization errors
- ❌ Missing dependencies

**Common errors:**
```
Failed to resolve module specifier "snarkyjs"
→ Fix: npm install snarkyjs

Firebase: Error (auth/invalid-api-key)
→ Fix: Update firebase config

Cannot find module './utils/zkp'
→ Fix: Check file exists
```

---

## 🧪 **Testing Steps:**

### **Step 1: Verify Dev Server**
```bash
npm run dev
```
✅ Should show: `Local: http://localhost:5173/`

### **Step 2: Open Browser**
Navigate to: `http://localhost:5173/`

### **Step 3: Check Console**
Press F12 → Console tab
✅ Should see: No errors
❌ If errors: Share them for diagnosis

### **Step 4: Check Network**
Press F12 → Network tab
✅ Should see: Files loading (main.jsx, App.jsx, etc.)
❌ If 404s: File paths may be wrong

---

## 🔍 **Diagnostic Commands:**

### **Check if server is running:**
```bash
netstat -ano | findstr :5173
```

### **Check Node version:**
```bash
node --version
# Should be v18+ or v20+
```

### **Check npm version:**
```bash
npm --version
# Should be v9+ or v10+
```

### **Verify dependencies:**
```bash
npm list react react-dom vite
```

---

## 🚨 **Common Issues & Solutions:**

### **Issue 1: "Cannot find module 'snarkyjs'"**
```bash
npm install snarkyjs
```

### **Issue 2: "Firebase not initialized"**
Check `src/firebase/config.js` exists and has valid config

### **Issue 3: "Tailwind styles not loading"**
```bash
# Check src/index.css exists
# Should have: @import "tailwindcss";
```

### **Issue 4: "WebAuthn not supported"**
- Must use HTTPS or localhost
- Must have biometric hardware
- Browser must support WebAuthn

### **Issue 5: "Module parse failed"**
```bash
# Clear Vite cache
rm -rf .vite
npm run dev
```

---

## 📊 **What to Share for Help:**

If still not working, share:

1. **Terminal output** from `npm run dev`
2. **Browser console errors** (F12 → Console)
3. **Network tab** (F12 → Network → Any red/failed requests)
4. **Node version** (`node --version`)
5. **NPM version** (`npm --version`)

---

## ✅ **Expected Working State:**

### **Terminal:**
```
VITE v5.1.4  ready in 523 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

### **Browser Console:**
```
(No errors)
```

### **Browser Display:**
- ✅ Gmail Vault UI loads
- ✅ Sidebar visible
- ✅ Dashboard shows
- ✅ Dark mode toggle works

---

## 🎯 **Quick Test:**

**Run this in terminal:**
```bash
cd c:\Users\user\Downloads\gmail-vault-pwa
npm run dev
```

**Then open browser to:**
```
http://localhost:5173/
```

**If you see the Gmail Vault UI → SUCCESS!** ✅

**If still blank → Share console errors** 🔍

---

## 🔧 **Nuclear Option (Last Resort):**

If nothing works, fresh start:

```bash
# 1. Backup your work
cp -r gmail-vault-pwa gmail-vault-pwa-backup

# 2. Fresh install
cd gmail-vault-pwa
rm -rf node_modules package-lock.json .vite
npm install

# 3. Start
npm run dev
```

---

## 📞 **Need More Help?**

Share these details:
1. Output of `npm run dev`
2. Browser console errors (F12)
3. What you see in browser (blank? error message?)
4. Operating system & browser version

---

**Most likely fix: Just run `npm run dev` and open http://localhost:5173/** ✅
