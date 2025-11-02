# 📝 GIT COMMIT & DEPLOY GUIDE

## 🎯 **STEP-BY-STEP: COMMIT TO GITHUB**

---

## **Step 1: Initialize Git (if needed)**

Check if git is initialized:
```bash
git status
```

If you see "not a git repository", initialize:
```bash
git init
```

---

## **Step 2: Create .gitignore**

Make sure you have a `.gitignore` file to exclude unnecessary files.

---

## **Step 3: Add All Files**

```bash
git add .
```

This stages all your files for commit.

---

## **Step 4: Commit**

```bash
git commit -m "Production ready - Gmail Vault PWA v1.0

Features:
- WebAuthn biometric authentication
- AES-256-GCM encryption
- Firebase Firestore backend
- Zero-knowledge proof verification
- PWA with offline support
- Multi-account management
- Category system
- Edit/delete functionality
- Mobile-optimized UI
- Security audited

Build: Successful (834KB bundle, 221KB gzipped)
Status: Production ready
"
```

---

## **Step 5: Create GitHub Repository**

1. Go to https://github.com
2. Click "+" → "New repository"
3. Name: `gmail-vault-pwa`
4. Description: "Secure Gmail account manager with biometric recovery"
5. Public or Private (your choice)
6. **Don't** initialize with README (you already have files)
7. Click "Create repository"

---

## **Step 6: Add Remote**

Copy the commands from GitHub, or use:

```bash
git remote add origin https://github.com/YOUR_USERNAME/gmail-vault-pwa.git
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## **Step 7: Push to GitHub**

```bash
git branch -M main
git push -u origin main
```

---

## **Step 8: Verify on GitHub**

1. Go to your repository URL
2. Verify all files are there
3. Check that `dist/` folder is NOT there (it's in .gitignore)

---

## 🚀 **STEP-BY-STEP: DEPLOY TO NETLIFY**

---

## **Method 1: Netlify CLI (Recommended)**

### **Install Netlify CLI:**
```bash
npm install -g netlify-cli
```

### **Login:**
```bash
netlify login
```

This opens a browser for authentication.

### **Deploy:**
```bash
netlify deploy --prod --dir=dist
```

### **Get URL:**
After deployment, you'll see:
```
Website URL: https://your-site-name.netlify.app
```

**Save this URL!** You'll need it for mobile testing.

---

## **Method 2: Netlify Web UI**

### **Option A: Manual Deploy**

1. Go to https://app.netlify.com
2. Click "Add new site" → "Deploy manually"
3. Drag and drop the `dist` folder
4. Wait for deployment (~30 seconds)
5. Get your URL: `https://random-name.netlify.app`

### **Option B: Connect GitHub**

1. Go to https://app.netlify.com
2. Click "Add new site" → "Import from Git"
3. Choose GitHub
4. Authorize Netlify
5. Select your repository
6. Configure:
   - Build command: `npm run build`
   - Publish directory: `dist`
7. Click "Deploy site"
8. Wait for build (~2 minutes)
9. Get your URL

---

## **Method 3: Netlify Drop (Drag & Drop)**

1. Go to https://app.netlify.com/drop
2. Drag the `dist` folder
3. Wait for upload
4. Get instant URL
5. (Optional) Claim site to your account

---

## ✅ **POST-DEPLOYMENT VERIFICATION**

### **1. Check HTTPS:**
```
URL should start with: https://
Look for lock icon in browser
```

### **2. Test Basic Functionality:**
```
[ ] Open URL in browser
[ ] Login with Firebase works
[ ] Add account works
[ ] Dashboard displays accounts
[ ] Copy password works
[ ] No console errors
```

### **3. Verify PWA:**
```
[ ] Open DevTools → Application → Manifest
[ ] Check manifest loads
[ ] Check service worker registered
[ ] Try "Add to Home Screen" (desktop)
```

### **4. Test on Desktop:**
```
[ ] All pages load
[ ] Navigation works
[ ] Firebase connection works
[ ] Encryption works
[ ] Decryption works
```

---

## 📱 **NEXT: MOBILE TESTING**

Once deployed and verified:

1. **Get your deployment URL**
2. **Open `MOBILE_TESTING_GUIDE.md`**
3. **Follow all 10 test scenarios**
4. **Use physical phone**
5. **Complete audit checklist**

---

## 🔧 **TROUBLESHOOTING**

### **Git Push Fails:**
```bash
# If remote already exists
git remote remove origin
git remote add origin YOUR_REPO_URL
git push -u origin main
```

### **Netlify Deploy Fails:**
```bash
# Check build locally first
npm run build

# If build succeeds locally but fails on Netlify:
# - Check Node version in Netlify settings
# - Check environment variables
# - Check build logs
```

### **HTTPS Not Working:**
```
Netlify automatically provides HTTPS
If not working:
- Wait a few minutes for SSL certificate
- Check Netlify domain settings
- Try accessing with https:// explicitly
```

---

## 📊 **DEPLOYMENT CHECKLIST**

```
GIT:
[ ] Git initialized
[ ] .gitignore present
[ ] All files added
[ ] Committed with message
[ ] Remote added
[ ] Pushed to GitHub
[ ] Verified on GitHub

NETLIFY:
[ ] CLI installed (or using web UI)
[ ] Logged in
[ ] Deployed
[ ] Got deployment URL
[ ] HTTPS working
[ ] Site accessible

VERIFICATION:
[ ] URL opens in browser
[ ] HTTPS enabled (lock icon)
[ ] Login works
[ ] Add account works
[ ] Dashboard works
[ ] No console errors

READY FOR:
[ ] Mobile testing
[ ] Real-user audit
[ ] Production launch
```

---

## 🎊 **DEPLOYMENT COMPLETE!**

Once you complete these steps:

✅ Code is on GitHub
✅ App is deployed to Netlify
✅ HTTPS is enabled
✅ URL is accessible
✅ Ready for mobile testing

**Next:** Open `MOBILE_TESTING_GUIDE.md` and start testing on your phone! 📱

---

## 📞 **QUICK COMMANDS REFERENCE**

```bash
# Git
git add .
git commit -m "Production ready"
git push -u origin main

# Netlify
netlify login
netlify deploy --prod --dir=dist

# Verify
curl -I https://your-site.netlify.app
```

---

**Ready to commit and deploy!** 🚀
