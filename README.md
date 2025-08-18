# Frontend Application

This is a React-based frontend application with authentication features.

## Features

- User authentication (login/signup)
- Protected routes
- Responsive design with Tailwind CSS
- JWT token management
- API integration ready

## Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager

## Installation

1. Install dependencies:
```bash
npm install
```

2. Install additional required packages:
```bash
npm install axios react-router-dom
```

## Configuration

### Backend API Setup

1. **Update API URL**: Edit `src/config/config.js` to match your backend URL:
```javascript
API_URL: 'http://localhost:5000/api' // Change this to your backend URL
```

2. **Environment Variables** (optional): Create a `.env` file in the root directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_FRONTEND_URL=http://localhost:3000
```

## Backend Requirements

Your backend should implement these endpoints:

### Authentication Endpoints

#### POST `/api/auth/login`
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com"
  }
}
```

#### POST `/api/auth/signup`
```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com"
  }
}
```

### Backend Features Required

1. **JWT Authentication**: Implement JWT token generation and validation
2. **Password Hashing**: Hash passwords before storing in database
3. **CORS Configuration**: Allow requests from your frontend domain
4. **Input Validation**: Validate email, password, and name fields
5. **Error Handling**: Return proper error messages and status codes

### Example Backend Structure (Node.js/Express)

```javascript
// Example backend structure
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();

app.use(cors({
  origin: 'http://localhost:3000', // Your frontend URL
  credentials: true
}));

app.use(express.json());

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user in database
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Signup endpoint
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword
    });
    
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.listen(5000, () => {
  console.log('Server running on port 5000');
});
```

## Running the Application

1. **Development mode:**
```bash
npm run dev
```

2. **Build for production:**
```bash
npm run build
```

3. **Preview production build:**
```bash
npm run preview
```

## Project Structure

```
src/
├── Components/
│   └── ProtectedRoute.jsx    # Route protection component
├── Pages/
│   ├── Dashboard.jsx         # Protected dashboard page
│   ├── landing.jsx           # Landing page
│   ├── login.jsx             # Login component
│   └── Signup.jsx            # Signup component
├── services/
│   ├── api.js                # Axios configuration
│   └── authService.js        # Authentication service
├── config/
│   └── config.js             # Application configuration
└── App.jsx                   # Main application component
```

## Authentication Flow

1. **Login/Signup**: User submits credentials
2. **API Call**: Frontend sends request to backend
3. **Token Storage**: JWT token stored in localStorage
4. **Route Protection**: Protected routes check authentication
5. **API Requests**: Token automatically added to request headers
6. **Logout**: Token removed from localStorage

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend allows requests from frontend domain
2. **Token Not Sent**: Check if token is properly stored in localStorage
3. **API Connection Failed**: Verify backend URL in config file
4. **Authentication State**: Check browser console for errors

### Debug Steps

1. Check browser console for error messages
2. Verify backend is running and accessible
3. Check network tab for failed API requests
4. Verify JWT token format and expiration
5. Check localStorage for stored tokens

## Security Considerations

- JWT tokens are stored in localStorage (consider httpOnly cookies for production)
- Passwords are hashed on the backend
- API endpoints are protected with JWT validation
- CORS is configured to prevent unauthorized access

## Next Steps

1. Implement your backend API endpoints
2. Add more protected routes as needed
3. Implement user profile management
4. Add password reset functionality
5. Implement email verification
6. Add social authentication (Google, Facebook, etc.)
