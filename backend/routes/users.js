const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { verifyAdmin, verifyToken } = require('../middleware/authMiddleware');

// Get all users (Admin only)
router.get('/', verifyAdmin, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, username, role, spending_limit, is_active, created_at FROM users ORDER BY id DESC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// Create new user (Admin only)
router.post('/', verifyAdmin, async (req, res) => {
  const { name, username, password, role, spendingLimit } = req.body;

  try {
    // Check if user exists
    const check = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    if (check.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const limit = spendingLimit ? parseFloat(spendingLimit) : null;

    const result = await db.query(
      'INSERT INTO users (name, username, password_hash, role, spending_limit) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, username, role',
      [name, username, hash, role || 'User', limit]
    );

    res.status(201).json({ message: 'User created successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Error creating user' });
  }
});

module.exports = router;
