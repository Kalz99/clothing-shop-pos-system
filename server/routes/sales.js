const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Create Sale (Checkout)
router.post('/', async (req, res) => {
    const {
        customerName,
        customerMobile,
        items,
        subtotal,
        discount,
        total,
        paymentMethod,
        cashierName,
        cashReceived,
        balance
    } = req.body;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 0. Generate Sequential Invoice Number
        // Lock the table or use a separate counter table ideally, but for simple needs:
        // Get the last invoice number descending
        const [lastSale] = await connection.query('SELECT invoice_no FROM sales ORDER BY id DESC LIMIT 1');
        let nextInvoiceNo = 'INV000001';

        if (lastSale.length > 0) {
            const lastNo = lastSale[0].invoice_no;
            // distinct format check: INVxxxxxx
            if (lastNo.startsWith('INV')) {
                const numPart = parseInt(lastNo.replace('INV', ''), 10);
                if (!isNaN(numPart)) {
                    nextInvoiceNo = `INV${String(numPart + 1).padStart(6, '0')}`;
                }
            }
        }

        // 1. Handle Customer (Find or Link or Create)
        let customerId = null;
        if (customerName || customerMobile) {
            // First try finding by phone (most unique)
            if (customerMobile) {
                const [custs] = await connection.query('SELECT id, name FROM customers WHERE phone = ?', [customerMobile]);
                if (custs.length > 0) {
                    customerId = custs[0].id;
                    // Update name if current input is different and not empty
                    if (customerName && custs[0].name !== customerName) {
                        await connection.query('UPDATE customers SET name = ? WHERE id = ?', [customerName, customerId]);
                    }
                }
            }

            // If not found by phone, try finding by name (if name provided)
            if (!customerId && customerName) {
                const [custs] = await connection.query('SELECT id FROM customers WHERE name = ?', [customerName]);
                if (custs.length > 0) {
                    customerId = custs[0].id;
                    // If we found by name and we have a mobile, update the mobile for this customer
                    if (customerMobile) {
                        await connection.query('UPDATE customers SET phone = ? WHERE id = ?', [customerMobile, customerId]);
                    }
                }
            }

            // Still not found? Create a new one
            if (!customerId) {
                const [newCust] = await connection.query(
                    'INSERT INTO customers (name, phone) VALUES (?, ?)',
                    [customerName || null, customerMobile || null]
                );
                customerId = newCust.insertId;
            }
        }

        // 2. Resolve User ID (Cashier)
        let userId = null;
        if (cashierName) {
            const [users] = await connection.query('SELECT id FROM users WHERE username = ?', [cashierName]);
            if (users.length > 0) userId = users[0].id;
        }

        // 3. Insert Sale
        const [saleResult] = await connection.query(
            `INSERT INTO sales 
            (invoice_no, user_id, customer_id, subtotal, discount, total, payment_method, cash_received, balance) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [nextInvoiceNo, userId, customerId, subtotal, discount, total, paymentMethod, cashReceived || 0, balance || 0]
        );
        const saleId = saleResult.insertId;

        // 4. Insert Sale Items & Update Stock
        for (const item of items) {
            // Insert item
            await connection.query(
                `INSERT INTO sale_items 
                (sale_id, product_id, product_name, unit_price, qty, line_total) 
                VALUES (?, ?, ?, ?, ?, ?)`,
                [saleId, parseInt(item.id), item.name, item.price, item.quantity, item.price * item.quantity]
            );

            // Update Stock
            console.log(`Reducing stock for product ${item.id} by ${item.quantity}`);
            await connection.query(
                `UPDATE products SET stock_qty = stock_qty - ? WHERE id = ?`,
                [item.quantity, parseInt(item.id)]
            );
        }

        await connection.commit();
        res.status(201).json({ message: 'Sale recorded', saleId, invoiceNo: nextInvoiceNo });

    } catch (err) {
        await connection.rollback();
        console.error('Error in POST /api/sales:', err);
        res.status(500).json({ message: 'Transaction failed', error: err.message });
    } finally {
        connection.release();
    }
});

// Get Sales History
router.get('/', async (req, res) => {
    try {
        const [sales] = await db.query(`
            SELECT s.*, c.name as customer_name, c.phone as customer_phone, u.username as cashier_name 
            FROM sales s 
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN users u ON s.user_id = u.id
            ORDER BY s.created_at DESC
        `);

        // We also need items for each sale to fully reconstruct the Invoice object
        // This is N+1 if we loop, or we can fetch all items and map.
        // For a simple list, we might not need items.
        // BUT the Invoices page "Reciept" viewing needs items.

        // Let's just return basic info for list, and create a detail endpoint?
        // Or for simplicity, fetch items for the top 50 sales?

        // Better: Fetch items in a second query
        const [items] = await db.query('SELECT * FROM sale_items WHERE sale_id IN (?)', [sales.map(s => s.id).concat(0)]); // concat 0 to handle empty list

        const salesWithItems = sales.map(s => {
            const saleItems = items.filter(i => i.sale_id === s.id).map(i => ({
                id: i.product_id ? i.product_id.toString() : `del-${i.id}`, // fallback to sale_item id if product deleted
                name: i.product_name,
                price: Number(i.unit_price),
                quantity: i.qty,
                // reconstruction
                barcode: '', // not stored in sale_items, maybe query product? relevant for receipt?
                stock: 0
            }));

            return {
                id: s.id.toString(),
                invoiceNo: s.invoice_no,
                date: s.created_at,
                customerName: s.customer_name || 'Walk-in',
                customerMobile: s.customer_phone || '',
                items: saleItems,
                subtotal: Number(s.subtotal),
                discount: Number(s.discount),
                total: Number(s.total),
                paymentMethod: s.payment_method,
                cashierName: s.cashier_name || 'Unknown',
                cashReceived: Number(s.cash_received || 0),
                balance: Number(s.balance || 0)
            };
        });

        res.json(salesWithItems);
    } catch (err) {
        console.error('Error in GET /api/sales:', err);
        res.status(500).json({ message: err.message });
    }
});

// Cancel/Delete Invoice with Stock Rebalancing
router.delete('/:id', async (req, res) => {
    const saleId = req.params.id;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Get all items in this sale to know what to restore to stock
        const [items] = await connection.query(
            'SELECT product_id, qty FROM sale_items WHERE sale_id = ?',
            [saleId]
        );

        let restoredCount = 0;

        // 2. Restore stock levels
        for (const item of items) {
            if (item.product_id) {
                const qty = Number(item.qty);
                const productId = Number(item.product_id);

                console.log(`Restoring stock for product ${productId} by ${qty}`);
                await connection.query(
                    'UPDATE products SET stock_qty = stock_qty + ? WHERE id = ?',
                    [qty, productId]
                );
                restoredCount++;
            }
        }

        // 3. Delete sale items
        await connection.query('DELETE FROM sale_items WHERE sale_id = ?', [saleId]);

        // 4. Delete the sale itself
        await connection.query('DELETE FROM sales WHERE id = ?', [saleId]);

        await connection.commit();
        res.json({
            message: 'Invoice cancelled and stock restored successfully',
            itemsRestored: restoredCount
        });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Error in DELETE /api/sales/:id:', err);
        res.status(500).json({ message: 'Failed to cancel invoice', error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;
