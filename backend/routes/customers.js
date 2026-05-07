const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// Get all customers (Available to both Admin and User)
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM customers ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching customers' });
  }
});

// Create new customer (Admin only)
router.post('/', verifyAdmin, async (req, res) => {
  const { name, phone, address } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Customer name is required' });
  }

  try {
    const result = await db.query(
      'INSERT INTO customers (name, phone, address) VALUES ($1, $2, $3) RETURNING *',
      [name, phone || null, address || null]
    );

    res.status(201).json({ message: 'Customer created successfully', customer: result.rows[0] });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Error creating customer' });
  }
});

module.exports = router;
