const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Retrieve a list of users
 *     responses:
 *       200:
 *         description: List of user names
 */
router.get('/users', (req, res) => {
  res.json(['user1', 'user2', 'user3']);
});

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Retrieve a list of products
 *     responses:
 *       200:
 *         description: List of products
 */
router.get('/products', (req, res) => {
  res.json(['product1', 'product2', 'product3']);
});

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Order created successfully
 */
router.post('/orders', (req, res) => {
  res.status(201).json({ message: 'Order created' });
});

/**
 * @swagger
 * /status:
 *   get:
 *     summary: Get service status
 *     responses:
 *       200:
 *         description: Service status
 */
router.get('/status', (req, res) => {
  res.json({ status: 'Server is running' });
});

module.exports = router;
