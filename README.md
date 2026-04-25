# 🍽️ Smart Food Ordering & Management System
### SE2020 – Web and Mobile Technologies | Group Assignment

**Stack:** React Native + Node.js + Express.js + MongoDB

---

## 📁 Project Structure

```
SmartFoodApp/
├── backend/                    # Node.js + Express API
│   ├── config/
│   │   ├── db.js               # MongoDB connection
│   │   └── cloudinary.js       # Image upload config
│   ├── controllers/
│   │   ├── authController.js       # Register, Login, Verify Email, Reset Password
│   │   ├── userController.js       # User CRUD, Trust Score, Analytics
│   │   ├── menuController.js       # Menu CRUD, Analytics, Availability
│   │   ├── orderController.js      # Order CRUD, Status Management, Search/Filter
│   │   ├── paymentController.js    # Multi-currency, Invoice, QR Code
│   │   ├── inventoryController.js  # Stock Management, Alerts, History
│   │   └── taxDiscountRefundController.js  # Tax, Discount, Refund CRUD
│   ├── middleware/
│   │   ├── auth.js             # JWT protect + role authorization
│   │   └── errorHandler.js     # Global error handler
│   ├── models/
│   │   ├── User.js             # User + Trust Score
│   │   ├── MenuItem.js         # Menu + Analytics
│   │   ├── Order.js            # Orders + Status History
│   │   ├── Payment.js          # Payments + Invoice
│   │   ├── Inventory.js        # Stock + History
│   │   ├── Tax.js
│   │   ├── Discount.js
│   │   └── Refund.js
│   ├── routes/                 # All API routes
│   ├── utils/
│   │   ├── email.js            # Nodemailer email templates
│   │   └── pdfGenerator.js     # PDF Invoice generation
│   ├── server.js               # Entry point
│   ├── .env.example            # Environment variables template
│   └── package.json
│
└── frontend/                   # React Native (Expo)
    ├── src/
    │   ├── context/
    │   │   └── AuthContext.js      # Global auth state
    │   ├── services/
    │   │   └── api.js              # Axios API calls for all modules
    │   ├── navigation/
    │   │   └── AppNavigator.js     # Stack + Tab navigation
    │   ├── utils/
    │   │   └── theme.js            # Colors, sizes, shadows
    │   ├── components/
    │   │   └── index.js            # Button, Input, Card, Badge, etc.
    │   └── screens/
    │       ├── Auth/               # Login, Register, ForgotPassword
    │       ├── Menu/               # MenuScreen, MenuDetail, ManageMenu, MenuForm
    │       ├── Order/              # Cart, MyOrders, OrdersScreen, OrderDetail
    │       ├── Payment/            # PaymentScreen, PaymentListScreen
    │       ├── Inventory/          # InventoryScreen, InventoryFormScreen
    │       ├── Tax/                # TaxScreen
    │       ├── Discount/           # DiscountScreen
    │       ├── Refund/             # RefundScreen
    │       └── User/               # Dashboard, Profile, UsersScreen
    ├── App.js                  # Root entry with providers
    ├── babel.config.js
    └── package.json
```

---

## 🔧 STEP 1 — Prerequisites (Install These First)

### On Your Computer:
1. **Node.js** (v18 or v20): https://nodejs.org/
   - Verify: `node --version`
2. **npm** (comes with Node.js): Verify: `npm --version`
3. **Git**: https://git-scm.com/
4. **Expo Go App** on your phone (iOS or Android)
   - Search "Expo Go" in App Store / Google Play

---

## 🗄️ STEP 2 — MongoDB Atlas Setup (Free Cloud Database)

1. Go to https://www.mongodb.com/atlas
2. Click **"Try Free"** → Create account
3. Choose **Free (M0)** cluster → Select region → Create
4. In **Security > Database Access** → Add user → username + password → note them
5. In **Security > Network Access** → Add IP Address → **Allow access from anywhere** (0.0.0.0/0)
6. In **Deployment > Database** → Click **Connect** → **Drivers** → Copy the connection string
   - It looks like: `mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/`
   - Change `<password>` to your actual password and add database name:
   - Final: `mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/smart_food_db`

---

## ☁️ STEP 3 — Cloudinary Setup (Free Image Storage)

1. Go to https://cloudinary.com/ → Sign up free
2. Dashboard → copy **Cloud Name**, **API Key**, **API Secret**

---

## 📧 STEP 4 — Gmail Setup (for Email sending)

1. Go to your Google Account → Security → 2-Step Verification → Turn ON
2. Then go to: https://myaccount.google.com/apppasswords
3. Select App: **Mail** → Select Device: **Other** → name it "SmartFood"
4. Copy the 16-character app password (no spaces)

---

## ⚙️ STEP 5 — Backend Setup

Open Terminal / Command Prompt:

```bash
# 1. Navigate into the backend folder
cd SmartFoodApp/backend

# 2. Install all dependencies
npm install

# 3. Create the environment file
# Copy .env.example to .env
# On Windows:
copy .env.example .env
# On Mac/Linux:
cp .env.example .env
```

Now open the `.env` file in any text editor (e.g., VS Code) and fill in all values:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/smart_food_db
JWT_SECRET=make_this_very_long_and_random_like_abc123xyz789
JWT_EXPIRE=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16_char_app_password
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=http://localhost:3000
EXCHANGE_API_KEY=your_key_from_exchangerate-api.com
```

**Exchange Rate API (Free):**
- Go to https://www.exchangerate-api.com/ → Sign up free → Copy API key

```bash
# 4. Start the backend server
npm run dev
```

✅ You should see:
```
🚀 Server running on port 5000
✅ MongoDB Connected
```

### Test the API:
Open browser and go to: `http://localhost:5000/api/health`
You should see: `{"success":true,"message":"Smart Food API is running 🚀"}`

---

## 📱 STEP 6 — Frontend Setup

Open a **NEW** terminal window:

```bash
# 1. Navigate into the frontend folder
cd SmartFoodApp/frontend

# 2. Install all dependencies
npm install

# 3. Find your computer's local IP address
# On Windows: open CMD and type:
ipconfig
# Look for "IPv4 Address" under your Wi-Fi → e.g., 192.168.1.105

# On Mac/Linux: open terminal and type:
ifconfig
# Look for "inet" under en0 → e.g., 192.168.1.105
```

Edit the file `src/services/api.js`:
Change line:
```js
export const BASE_URL = 'https://your-backend.onrender.com/api';
```
To your local IP:
```js
export const BASE_URL = 'http://192.168.1.105:5000/api';
```
⚠️ Use YOUR actual IP. Both phone and laptop must be on the same Wi-Fi network.

```bash
# 4. Start the Expo development server
npx expo start
```

✅ A QR code will appear in the terminal.

**On your phone:**
- Open the **Expo Go** app
- Scan the QR code with your phone camera (iOS) or directly in Expo Go (Android)
- The app will load on your phone!

---

## 🚀 STEP 7 — Create Your First Admin User

1. Open the app and register a new account
2. Then open MongoDB Atlas → Browse Collections → users
3. Find your user document and change the `role` field from `"Customer"` to `"Admin"`
4. Log out and log back in — you now have Admin access!

---

## 🌐 STEP 8 — Deployment (Required for Submission)

### Deploy Backend to Render (Free):

1. Push your code to GitHub
2. Go to https://render.com/ → Sign up with GitHub
3. Click **New** → **Web Service** → Connect your GitHub repo → Select backend folder
4. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Add all the same `.env` variables
5. Click **Create Web Service** → wait 3-5 minutes
6. Copy your URL: `https://smart-food-backend.onrender.com`

### Update Frontend for Production:

In `src/services/api.js`, change to your Render URL:
```js
export const BASE_URL = 'https://smart-food-backend.onrender.com/api';
```

### Build the App:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
npx expo login

# Configure build
npx eas build:configure

# Build APK for Android (for demo)
npx eas build -p android --profile preview
```

---

## 📋 API Endpoints Reference

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | /api/auth/register | Register user | Public |
| POST | /api/auth/login | Login | Public |
| GET | /api/auth/verify-email/:token | Verify email | Public |
| POST | /api/auth/forgot-password | Send reset email | Public |
| POST | /api/auth/reset-password/:token | Reset password | Public |
| GET | /api/auth/me | Get current user | Private |
| GET | /api/users | Get all users | Admin |
| GET | /api/users/trust-analytics | Trust score analytics | Admin |
| PUT | /api/users/:id/role | Update user role | Admin |
| GET | /api/menu | Get all menu items | Public |
| POST | /api/menu | Create menu item | Admin/Staff |
| PUT | /api/menu/:id | Update menu item | Admin/Staff |
| DELETE | /api/menu/:id | Delete menu item | Admin |
| PATCH | /api/menu/:id/availability | Toggle availability | Admin/Staff |
| GET | /api/menu/analytics | Menu analytics | Admin/Staff |
| POST | /api/orders | Create order | Private |
| GET | /api/orders | Get all orders | Admin/Staff |
| GET | /api/orders/my-orders | Get my orders | Customer |
| PATCH | /api/orders/:id/status | Update order status | Admin/Staff |
| GET | /api/payments/exchange-rates | Live exchange rates | Private |
| POST | /api/payments | Process payment | Private |
| GET | /api/payments/analytics | Revenue analytics | Admin |
| GET | /api/inventory | Get inventory | Admin/Staff |
| GET | /api/inventory/alerts | Stock alerts | Admin/Staff |
| PATCH | /api/inventory/:id/stock | Adjust stock | Admin/Staff |
| GET | /api/taxes | Get all taxes | Private |
| POST | /api/taxes | Create tax | Admin |
| GET | /api/discounts | Get discounts | Private |
| POST | /api/discounts | Create discount | Admin |
| POST | /api/discounts/validate | Validate discount code | Private |
| POST | /api/refunds | Process refund | Admin/Staff |

---

## 👥 Team Responsibility Breakdown

| Member | Entity | Module |
|--------|--------|--------|
| Member 1 | User & Role | Authentication + Trust Score System |
| Member 2 | Menu | Menu Management + Analytics + Image Upload |
| Member 3 | Order | Order Management + Status Tracking + Search/Filter |
| Member 4 | Payment | Multi-currency + Invoice + QR Code + Email |
| Member 5 | Inventory | Stock Management + Alerts + History |
| Member 6 | Tax/Discount/Refund | Tax CRUD + Discount CRUD + Refund System |

---

## 🔧 Troubleshooting

**"Cannot connect to server" on phone:**
- Make sure phone and laptop are on the SAME Wi-Fi network
- Check your IP address is correct in `api.js`
- Make sure backend is running (`npm run dev`)

**"Module not found" errors:**
```bash
cd frontend
rm -rf node_modules
npm install
npx expo start --clear
```

**MongoDB connection error:**
- Check your MONGO_URI in .env
- Check that your IP is whitelisted in MongoDB Atlas Network Access

**Email not sending:**
- Make sure Gmail 2FA is enabled
- Make sure you're using the App Password (not your regular Gmail password)

---

## 📝 Viva Preparation Topics

**Authentication Module:**
- How does JWT work? (token generation, verification, expiry)
- Why do we hash passwords? (bcryptjs, salt rounds)
- What are protected routes?

**Order Module:**
- Explain order status flow: Pending → Confirmed → Preparing → Ready → Delivered
- How does discount code validation work?
- How is inventory auto-reduced on order creation?

**Payment Module:**
- How does multi-currency work? (exchange rates, base LKR)
- How is PDF invoice generated? (pdfkit + QR code)
- How is invoice emailed? (nodemailer)

**Inventory Module:**
- How does low-stock alert work? (pre-save hook)
- What is stock history and why is it important?
- How does ingredient-based availability work?

**Tax/Discount Module:**
- Difference between percentage and fixed discounts?
- What is isDefault tax and how is it automatically applied?
- How does usage limit work for discounts?
