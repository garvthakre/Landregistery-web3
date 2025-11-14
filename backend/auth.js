const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Simple file-based storage for users
const USERS_FILE = path.join(__dirname, 'users.json');

// Initialize users file if it doesn't exist
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}

// Helper functions
const readUsers = () => {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writeUsers = (users) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

// Signup endpoint
router.post('/signup', (req, res) => {
  try {
    const { name, aadharNo, phoneNo, address, password, patwariId, walletAddress } = req.body;

    // Validation
    if (!name || !aadharNo || !phoneNo || !address || !password || !walletAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'All fields are required' 
      });
    }

    // Validate Aadhar (12 digits)
    if (!/^\d{12}$/.test(aadharNo)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Aadhar number must be 12 digits' 
      });
    }

    // Validate phone (10 digits)
    if (!/^\d{10}$/.test(phoneNo)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Phone number must be 10 digits' 
      });
    }

    const users = readUsers();

    // Check if user already exists
    const existingUser = users.find(u => u.aadharNo === aadharNo);
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'User with this Aadhar number already exists' 
      });
    }

    // Check if wallet already registered
    const existingWallet = users.find(u => u.walletAddress.toLowerCase() === walletAddress.toLowerCase());
    if (existingWallet) {
      return res.status(400).json({ 
        success: false, 
        error: 'Wallet address already registered' 
      });
    }

    // Determine role based on patwariId
    let role = 'user';
    if (patwariId && patwariId.trim() !== '') {
      // Simple validation: patwariId should start with 'PAT' and be 10 chars
      if (patwariId.startsWith('PAT') && patwariId.length === 10) {
        role = 'admin';
      } else {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid Patwari ID format. Must start with PAT and be 10 characters' 
        });
      }
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      name,
      aadharNo,
      phoneNo,
      address,
      password, // In production, hash this!
      patwariId: patwariId || null,
      role,
      walletAddress: walletAddress.toLowerCase(),
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeUsers(users);

    console.log(`✅ New ${role} registered:`, name, `(${aadharNo})`);

    res.json({
      success: true,
      message: 'Registration successful',
      user: {
        id: newUser.id,
        name: newUser.name,
        aadharNo: newUser.aadharNo,
        role: newUser.role,
        walletAddress: newUser.walletAddress
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Registration failed' 
    });
  }
});

// Login endpoint
router.post('/login', (req, res) => {
  try {
    const { aadharNo, password, patwariId, walletAddress } = req.body;

    // Validation
    if (!aadharNo || !password || !walletAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'Aadhar number, password, and wallet address are required' 
      });
    }

    const users = readUsers();

    // Find user by aadhar
    const user = users.find(u => u.aadharNo === aadharNo);

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }

    // Check password
    if (user.password !== password) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }

    // Check wallet address matches
    if (user.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(401).json({ 
        success: false, 
        error: 'Wallet address does not match registered address' 
      });
    }

    // If admin, verify patwariId
    if (user.role === 'admin') {
      if (!patwariId || patwariId !== user.patwariId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Invalid Patwari ID' 
        });
      }
    }

    console.log(`✅ ${user.role} logged in:`, user.name, `(${user.aadharNo})`);

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        aadharNo: user.aadharNo,
        phoneNo: user.phoneNo,
        address: user.address,
        role: user.role,
        walletAddress: user.walletAddress,
        patwariId: user.patwariId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Login failed' 
    });
  }
});

// Get user by wallet address (for auto-login)
router.get('/user/:walletAddress', (req, res) => {
  try {
    const { walletAddress } = req.params;
    const users = readUsers();
    
    const user = users.find(u => u.walletAddress.toLowerCase() === walletAddress.toLowerCase());
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        aadharNo: user.aadharNo,
        phoneNo: user.phoneNo,
        address: user.address,
        role: user.role,
        walletAddress: user.walletAddress,
        patwariId: user.patwariId
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get user' 
    });
  }
});

module.exports = router;