
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- INFLUENCER API ---

// GET: ดึงข้อมูล Influencer ทั้งหมด
app.get('/api/influencers', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM influencers ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch influencers' });
  }
});

// POST: เพิ่ม Influencer ใหม่
app.post('/api/influencers', async (req, res) => {
  const { name, platform } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO influencers (name, platform) VALUES (?, ?)',
      [name, platform || '']
    );
    res.json({ id: result.insertId, name, platform });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save influencer' });
  }
});

// --- ORDERS API ---

// GET: ดึงข้อมูลบิลขายทั้งหมด
app.get('/api/orders', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM orders ORDER BY requestedAt DESC');
    // แปลง items จาก string เป็น JSON object ก่อนส่งให้ frontend
    const formattedRows = rows.map(row => ({
      ...row,
      items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items
    }));
    res.json(formattedRows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// POST: บันทึกบิลขายใหม่ (Walkout Transaction)
app.post('/api/orders', async (req, res) => {
  const { 
    id, poNumber, source, targetName, storeName, subBranch, 
    recipientName, recipientAddress, items, totalValue, 
    status, requestedAt, purchasingDept 
  } = req.body;

  try {
    const [result] = await pool.query(
      `INSERT INTO orders (
        id, poNumber, source, targetName, storeName, subBranch, 
        recipientName, recipientAddress, items, totalValue, 
        status, requestedAt, purchasingDept
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, poNumber, source, targetName || '', storeName || '', subBranch || '',
        recipientName || '', recipientAddress || '', JSON.stringify(items), totalValue,
        status, requestedAt, purchasingDept
      ]
    );
    res.json({ success: true, insertId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save order' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
