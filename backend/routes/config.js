const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// Get hotel config
router.get('/hotel', verifyToken, async (req, res) => {
  try {
    const result = await db.query("SELECT value FROM system_config WHERE key = 'hotel_dishes'");
    if (result.rows.length === 0) {
      return res.json({ dishes: [], schedule: {} });
    }
    
    let config = result.rows[0].value;
    
    // Migration: If config is an array (old format), convert it to new format
    if (Array.isArray(config)) {
      config = { dishes: config, schedule: {} };
    }
    
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching config' });
  }
});

// Update hotel config (Admin only)
router.put('/hotel', verifyAdmin, async (req, res) => {
  const config = req.body; // Expecting { dishes, schedule }

  if (!config.dishes || !Array.isArray(config.dishes)) {
    return res.status(400).json({ error: 'Invalid config format' });
  }

  try {
    await db.query(
      "UPDATE system_config SET value = $1 WHERE key = 'hotel_dishes'",
      [JSON.stringify(config)]
    );
    res.json({ message: 'Config updated', config });
  } catch (error) {
    res.status(500).json({ error: 'Error updating config' });
  }
});

module.exports = router;
