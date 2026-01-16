
const mysql = require('mysql2/promise');

/**
 * Database configuration for Hostinger MySQL.
 * User: Champsabata@gmail.com
 * DB: LAGLACE STOCK MANAGER
 */
const dbConfig = {
  host: 'localhost',
  user: 'Champsabata@gmail.com',
  password: '1103701087790',
  database: 'LAGLACE STOCK MANAGER',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// Create a connection pool to handle multiple concurrent requests efficiently
const pool = mysql.createPool(dbConfig);

/**
 * Utility to test the connection and log status
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Successfully connected to MySQL [LAGLACE STOCK MANAGER]');
    connection.release();
  } catch (err) {
    console.error('MySQL Connection Error:', err.message);
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Check your username and password credentials.');
    } else if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      console.error('Database host is unreachable. Ensure MySQL is running on localhost.');
    }
  }
}

testConnection();

module.exports = pool;
