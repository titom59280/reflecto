const pool = require('../utils/db');

async function queryOne(text, params) {
  const result = await pool.query(text, params);
  return result.rows[0] || null;
}

async function query(text, params) {
  const result = await pool.query(text, params);
  return result.rows || null;
}

module.exports = {
  queryOne,
  query
};
