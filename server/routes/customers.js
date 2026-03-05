const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all customers
router.get('/', async (req, res) => {
    try {
        const [customers] = await db.query('SELECT * FROM customers ORDER BY id DESC');
        res.json(customers);
    } catch (err) {
        console.error('Error fetching customers:', err);
        res.status(500).json({ message: err.message });
    }
});

// Search customers by name or phone
router.get('/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);

    try {
        const [customers] = await db.query(
            `SELECT * FROM customers 
             WHERE name LIKE ? OR phone LIKE ? 
             LIMIT 10`,
            [`%${q}%`, `%${q}%`]
        );
        res.json(customers);
    } catch (err) {
        console.error('Error searching customers:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
