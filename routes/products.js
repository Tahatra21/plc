const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all products
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new product
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, category, segment, lifecycle_stage, price, launch_date } = req.body;
    const created_by = req.user.id;
    
    const result = await pool.query(
      `INSERT INTO products (name, description, category, segment, lifecycle_stage, price, launch_date, created_by, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *`,
      [name, description, category, segment, lifecycle_stage, price, launch_date, created_by]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update product
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, segment, lifecycle_stage, price, launch_date } = req.body;
    const changed_by = req.user.id;
    
    // Get current product to track lifecycle changes
    const currentProduct = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    
    if (currentProduct.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const result = await pool.query(
      `UPDATE products SET name = $1, description = $2, category = $3, segment = $4, lifecycle_stage = $5, 
       price = $6, launch_date = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8 RETURNING *`,
      [name, description, category, segment, lifecycle_stage, price, launch_date, id]
    );
    
    // Track lifecycle stage changes
    if (currentProduct.rows[0].lifecycle_stage !== lifecycle_stage) {
      await pool.query(
        'INSERT INTO lifecycle_history (product_id, previous_stage, new_stage) VALUES ($1, $2, $3)',
        [id, currentProduct.rows[0].lifecycle_stage, lifecycle_stage]
      );
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get lifecycle history for a product
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM lifecycle_history WHERE product_id = $1 ORDER BY change_date DESC',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;