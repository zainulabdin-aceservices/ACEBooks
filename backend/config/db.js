const { Pool } = require('pg');

const pool = new Pool({
  user: 'ledger_admin',
  host: 'localhost',
  database: 'ledger_db',
  password: 'secretpassword',
  port: 5432,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
