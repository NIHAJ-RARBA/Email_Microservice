// src/routes / order.js
const express = require('express');
const router = express.Router();
const { Order, OrderItem } = require('../models/order');
const { Product } = require('../models/product');
const verifyToken = require('../middlewares/auth');
const sendEmail = require('../services/email');

// Create order
router.post('/', verifyToken, async (req, res) => {
    try {
        const { items } = req.body;
        let totalAmount = 0;

        // Calculate total amount and verify stock
        for (const item of items) {
            const product = await Product.findByPk(item.productId);
            if (!product || product.stock < item.quantity) {
                return res.status(400).json({
                    message: `Product ${product.name} is out of stock`
                });
            }
            totalAmount += product.price * item.quantity;
        }

        // Create order
        const order = await Order.create({
            userId: req.user.id,
            totalAmount,
            status: 'pending'
        });

        // Add items to order
        for (const item of items) {
            await OrderItem.create({
                orderId: order.id,
                productId: item.productId,
                quantity: item.quantity,
                price: (await Product.findByPk(item.productId)).price
            });

            // Update stock
            await Product.decrement(
                'stock',
                { by: item.quantity, where: { id: item.productId } }
            );
        }

        // Send confirmation email
        await sendEmail({
            to: req.user.email,
            subject: 'Order Confirmation',
            text: `Your order #${order.id} has been confirmed.`
        });

        res.status(201).json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get user's orders
router.get('/my-orders', verifyToken, async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: { userId: req.user.id },
            include: [{ model: Product }]
        });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;