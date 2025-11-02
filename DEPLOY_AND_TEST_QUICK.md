# 🚀 DEPLOY & TEST - QUICK REFERENCE

## ⚡ **5-MINUTE DEPLOYMENT**

### **Step 1: Build (1 min)**
```bash
npm run build
```

### **Step 2: Deploy (2 min)**

**Netlify:**
```bash
netlify deploy --prod
```

**Vercel:**
```bash
vercel --prod
```

**Firebase:**
```bash
firebase deploy --only hosting
```

### **Step 3: Get URL (1 min)**
```
Your URL: https://__________________.netlify.app
```

### **Step 4: Verify (1 min)**
- Open URL in browser
- Check HTTPS (lock icon)
- Test login
- Verify no errors

---

## 📱 **10-MINUTE MOBILE TEST**

### **On Your Phone:**

**1. Install PWA (2 min)**
```
Chrome → Your URL → Menu → Add to Home Screen
```

**2. Enroll Fingerprint (2 min)**
```
Open app → Login → Settings → Enroll Fingerprint
```

**3. Add Account (2 min)**
```
Add Account → Fill form → Save
```

**4. Test Copy (1 min)**
```
Dashboard → Copy password → Paste in Notes
```

**5. Test Recovery (3 min)**
```
Uninstall → Reinstall → Recovery → Scan finger
```

---

## ✅ **QUICK PASS/FAIL**

### **Must Pass:**
- [ ] PWA installs
- [ ] Fingerprint works
- [ ] Account saves
- [ ] Copy shows plaintext
- [ ] Recovery works

### **If All Pass:**
```
🎉 PRODUCTION READY!
```

### **If Any Fail:**
```
❌ Fix issue
⚠️ Re-test
📝 Document
```

---

## 🔧 **QUICK FIXES**

### **PWA Won't Install:**
```
Check: HTTPS enabled
Check: Manifest in DevTools
Fix: Redeploy with correct config
```

### **Fingerprint Fails:**
```
Check: HTTPS enabled
Check: Device has sensor
Fix: Use different browser
```

### **Copy Shows Encrypted:**
```
Check: Decryption fix applied
Check: src/utils/decrypt.js
Fix: Remove dynamic import
```

### **Recovery Fails:**
```
Check: ZKP hash in localStorage
Check: Same finger used
Fix: Re-enroll fingerprint
```

---

## 📊 **QUICK CHECKLIST**

```
DEPLOYMENT:
[ ] npm run build
[ ] Deploy to platform
[ ] HTTPS working
[ ] URL accessible

MOBILE TEST:
[ ] PWA installed
[ ] Fingerprint enrolled
[ ] Account added
[ ] Copy works
[ ] Recovery works

RESULT:
[ ] All pass → Launch! 🚀
[ ] Any fail → Fix & re-test
```

---

## 🎯 **FULL GUIDES**

For detailed instructions:
- **Deployment:** `DEPLOYMENT_GUIDE.md`
- **Mobile Testing:** `MOBILE_TESTING_GUIDE.md`
- **Complete Audit:** `MOBILE_AUDIT_READY.md`

---

## ⏱️ **TIME ESTIMATE**

- **Build & Deploy:** 5 minutes
- **Quick Mobile Test:** 10 minutes
- **Full Mobile Audit:** 30-45 minutes

**Total:** 15-50 minutes depending on depth

---

## 🚀 **START NOW!**

```bash
# 1. Build
npm run build

# 2. Deploy
netlify deploy --prod

# 3. Test on phone
# Follow MOBILE_TESTING_GUIDE.md

# 4. Launch! 🎉
```

---

**Quick, simple, effective!** ⚡
