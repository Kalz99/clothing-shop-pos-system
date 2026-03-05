const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const db = require('./config/db');

// Basic Route
app.get('/', (req, res) => {
    res.send('Clothing POS API is running');
});

// Import Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/returns', require('./routes/returns'));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
