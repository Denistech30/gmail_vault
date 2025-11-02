# 🚀 DEPLOYMENT GUIDE - GMAIL VAULT PWA

## 📋 **PRE-DEPLOYMENT CHECKLIST**

### **✅ Verified Components:**
- [x] PWA manifest configured
- [x] Service worker setup (vite-plugin-pwa)
- [x] Icons present (192x192, 512x512)
- [x] Firebase configured
- [x] HTTPS ready
- [x] Offline caching enabled

---

## 🎯 **DEPLOYMENT OPTIONS**

### **Option 1: Netlify (Recommended)** ⭐

#### **Step 1: Build the App**
```bash
npm run build
```

#### **Step 2: Deploy to Netlify**

**Method A: Netlify CLI**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod

# Follow prompts:
# - Build directory: dist
# - Site name: gmail-vault-pwa (or your choice)
```

**Method B: Netlify Web UI**
1. Go to https://app.netlify.com
2. Click "Add new site" → "Deploy manually"
3. Drag and drop the `dist` folder
4. Wait for deployment
5. Get your URL: `https://your-site.netlify.app`

#### **Step 3: Configure Headers (IMPORTANT)**

Create `public/_headers` file:
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
```

Redeploy after adding headers.

---

### **Option 2: Vercel**

#### **Step 1: Build**
```bash
npm run build
```

#### **Step 2: Deploy**
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Build directory: dist
```

#### **Step 3: Get URL**
Your app will be at: `https://your-app.vercel.app`

---

### **Option 3: Firebase Hosting**

#### **Step 1: Install Firebase CLI**
```bash
npm install -g firebase-tools
firebase login
```

#### **Step 2: Initialize Hosting**
```bash
firebase init hosting

# Select:
# - Use existing project: vault-11b59
# - Public directory: dist
# - Single-page app: Yes
# - Automatic builds: No
```

#### **Step 3: Build & Deploy**
```bash
npm run build
firebase deploy --only hosting
```

Your app will be at: `https://vault-11b59.web.app`

---

## 🔧 **POST-DEPLOYMENT CONFIGURATION**

### **1. Update Firebase Auth Domain**

If using custom domain, update Firebase:
1. Go to Firebase Console
2. Authentication → Settings → Authorized domains
3. Add your deployment URL (e.g., `gmail-vault-pwa.netlify.app`)

### **2. Test HTTPS**

Visit your deployment URL and verify:
- ✅ URL starts with `https://`
- ✅ No certificate warnings
- ✅ Lock icon in address bar

### **3. Test PWA Installation**

On desktop:
1. Open your deployment URL
2. Look for install icon in address bar
3. Click to install
4. Verify app opens in standalone window

---

## 📱 **MOBILE DEPLOYMENT VERIFICATION**

### **Before Mobile Testing:**

1. **Get Your Deployment URL**
   ```
   Example: https://gmail-vault-pwa.netlify.app
   ```

2. **Verify URL Works**
   - Open in desktop browser
   - Check for errors
   - Verify Firebase connection

3. **Test Basic Functionality**
   - Login works
   - Add account works
   - Dashboard loads

4. **Check PWA Manifest**
   - Open DevTools → Application → Manifest
   - Verify all fields present
   - Check icons load

---

## 🚨 **COMMON DEPLOYMENT ISSUES**

### **Issue 1: Build Fails**
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### **Issue 2: Routes Don't Work (404)**
**Solution:** Configure SPA redirect

**Netlify:** Create `public/_redirects`
```
/*    /index.html   200
```

**Vercel:** Create `vercel.json`
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### **Issue 3: Firebase Not Connecting**
- Check Firebase config in `src/firebase/config.js`
- Verify API key is correct
- Check Firestore rules allow read/write

### **Issue 4: WebAuthn Not Working**
- Verify HTTPS is enabled
- Check browser supports WebAuthn
- Verify device has biometric hardware

---

## ✅ **DEPLOYMENT CHECKLIST**

```
[ ] App builds successfully (npm run build)
[ ] Dist folder created
[ ] Deployed to hosting platform
[ ] HTTPS enabled
[ ] Custom domain configured (optional)
[ ] Firebase authorized domains updated
[ ] SPA redirects configured
[ ] PWA manifest accessible
[ ] Service worker registered
[ ] Icons loading correctly
[ ] No console errors
[ ] Firebase connection working
[ ] WebAuthn available (desktop test)
```

---

## 🎯 **NEXT STEP: MOBILE TESTING**

Once deployed:
1. ✅ Get your deployment URL
2. ✅ Open `MOBILE_TESTING_GUIDE.md`
3. ✅ Follow mobile testing steps
4. ✅ Complete real-user audit

---

## 📞 **DEPLOYMENT SUPPORT**

### **Netlify Issues:**
- Docs: https://docs.netlify.com
- Status: https://www.netlifystatus.com

### **Vercel Issues:**
- Docs: https://vercel.com/docs
- Status: https://www.vercel-status.com

### **Firebase Issues:**
- Docs: https://firebase.google.com/docs/hosting
- Console: https://console.firebase.google.com

---

## 🎊 **DEPLOYMENT COMPLETE!**

Your Gmail Vault PWA is now:
- ✅ Deployed to production
- ✅ Accessible via HTTPS
- ✅ Ready for mobile testing
- ✅ PWA installable
- ✅ Offline capable

**Next:** Open `MOBILE_TESTING_GUIDE.md` and start the real-user audit! 📱
