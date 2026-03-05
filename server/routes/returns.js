const express = require('express');
const router = express.Router();
const db = require('../config/db');

// POST /api/returns — Process a return
router.post('/', async (req, res) => {
    const { saleId, items, cashierName } = req.body;

    if (!saleId || !items || items.length === 0) {
        return res.status(400).json({ message: 'saleId and items are required' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Generate sequential return number
        const [lastReturn] = await connection.query('SELECT return_no FROM returns ORDER BY id DESC LIMIT 1');
        let nextReturnNo = 'RET000001';
        if (lastReturn.length > 0) {
            const lastNo = lastReturn[0].return_no;
            if (lastNo.startsWith('RET')) {
                const numPart = parseInt(lastNo.replace('RET', ''), 10);
                if (!isNaN(numPart)) {
                    nextReturnNo = `RET${String(numPart + 1).padStart(6, '0')}`;
                }
            }
        }

        // 2. Resolve cashier user_id
        let userId = null;
        if (cashierName) {
            const [users] = await connection.query('SELECT id FROM users WHERE username = ?', [cashierName]);
            if (users.length > 0) userId = users[0].id;
        }

        // 3. Calculate total refund
        const totalRefund = items.reduce((sum, item) => sum + (item.unitPrice * item.qty), 0);

        // 4. Insert return record
        const [returnResult] = await connection.query(
            `INSERT INTO returns (return_no, sale_id, user_id, total_refund) VALUES (?, ?, ?, ?)`,
            [nextReturnNo, saleId, userId, totalRefund]
        );
        const returnId = returnResult.insertId;

        // 5. Insert return items and restore stock
        for (const item of items) {
            await connection.query(
                `INSERT INTO return_items (return_id, product_id, product_name, unit_price, qty, line_total)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [returnId, item.productId, item.productName, item.unitPrice, item.qty, item.unitPrice * item.qty]
            );

            if (item.productId) {
                await connection.query(
                    `UPDATE products SET stock_qty = stock_qty + ? WHERE id = ?`,
                    [item.qty, item.productId]
                );
            }
        }

        await connection.commit();
        res.status(201).json({ message: 'Return processed successfully', returnNo: nextReturnNo, totalRefund });

    } catch (err) {
        await connection.rollback();
        console.error('Error in POST /api/returns:', err);
        res.status(500).json({ message: 'Return processing failed', error: err.message });
    } finally {
        connection.release();
    }
});

// GET /api/returns — All returns history
router.get('/', async (req, res) => {
    try {
        const [returns] = await db.query(`
            SELECT r.*, s.invoice_no, c.name as customer_name, u.username as cashier_name
            FROM returns r
            LEFT JOIN sales s ON r.sale_id = s.id
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN users u ON r.user_id = u.id
            ORDER BY r.created_at DESC
        `);

        if (returns.length === 0) return res.json([]);

        const returnIds = returns.map(r => r.id);
        const [items] = await db.query(
            `SELECT * FROM return_items WHERE return_id IN (?)`,
            [returnIds]
        );

        const returnsWithItems = returns.map(r => ({
            id: r.id.toString(),
            returnNo: r.return_no,
            saleId: r.sale_id.toString(),
            invoiceNo: r.invoice_no,
            customerName: r.customer_name || 'Walk-in',
            cashierName: r.cashier_name || 'Unknown',
            totalRefund: Number(r.total_refund),
            date: r.created_at,
            items: items
                .filter(i => i.return_id === r.id)
                .map(i => ({
                    id: i.id.toString(),
                    productId: i.product_id ? i.product_id.toString() : null,
                    productName: i.product_name,
                    unitPrice: Number(i.unit_price),
                    qty: i.qty,
                    lineTotal: Number(i.line_total)
                }))
        }));

        res.json(returnsWithItems);
    } catch (err) {
        console.error('Error in GET /api/returns:', err);
        res.status(500).json({ message: err.message });
    }
});

// GET /api/returns/by-sale/:saleId — Returns for a specific invoice
router.get('/by-sale/:saleId', async (req, res) => {
    const { saleId } = req.params;
    try {
        const [returns] = await db.query(
            `SELECT r.* FROM returns r WHERE r.sale_id = ? ORDER BY r.created_at ASC`,
            [saleId]
        );

        if (returns.length === 0) return res.json([]);

        const returnIds = returns.map(r => r.id);
        const [items] = await db.query(
            `SELECT * FROM return_items WHERE return_id IN (?)`,
            [returnIds]
        );

        const result = returns.map(r => ({
            id: r.id.toString(),
            returnNo: r.return_no,
            totalRefund: Number(r.total_refund),
            date: r.created_at,
            items: items
                .filter(i => i.return_id === r.id)
                .map(i => ({
                    productId: i.product_id ? i.product_id.toString() : null,
                    productName: i.product_name,
                    unitPrice: Number(i.unit_price),
                    qty: i.qty,
                    lineTotal: Number(i.line_total)
                }))
        }));

        res.json(result);
    } catch (err) {
        console.error('Error in GET /api/returns/by-sale:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
