const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Retrieve a list of users
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of user names
 */
router.get('/api/users', (req, res) => {
  res.json(['user1', 'user2', 'user3']);
});


/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Retrieve a list of products
 *     responses:
 *       200:
 *         description: List of products
 */
router.get('/api/products', (req, res) => {
  res.json(['product1', 'product2', 'product3']);
});

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     security:
 *       - ApiKeyAuth: []
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
router.post('/api/orders', (req, res) => {
  res.status(201).json({ message: 'Order created' });
});

/**
 * @swagger
 * /api/status:
 *   get:
 *     summary: Get service status
 *     # Removed responses to simulate an endpoint missing response for governance failures
 */
router.get('/api/status', (req, res) => {
  res.json({ status: 'Server is running' });
});

module.exports = router;
