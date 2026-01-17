
const mysql = require('mysql2/promise');

/**
 * Database configuration for Hostinger MySQL.
 * DB/User: u394698912_LAGLACE
 */
const dbConfig = {
  host: 'localhost',
  user: 'u394698912_LAGLACE',
  password: '1103701087790',
  database: 'u394698912_LAGLACE',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to MySQL [u394698912_LAGLACE]');
    connection.release();
  } catch (err) {
    console.error('MySQL Connection Error:', err.message);
  }
}

testConnection();

module.exports = pool;
