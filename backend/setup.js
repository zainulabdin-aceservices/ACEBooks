const db = require('./config/db');

async function setupDatabase() {
  console.log('Initializing database schema...');

  const usersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      username VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL,
      spending_limit NUMERIC,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const customersTable = `
    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(50),
      address TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const transactionsTable = `
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      created_by INTEGER REFERENCES users(id),
      customer_id INTEGER REFERENCES customers(id),
      amount NUMERIC NOT NULL,
      description TEXT,
      date DATE NOT NULL,
      receipt_image TEXT,
      type VARCHAR(20) NOT NULL,
      hotel_items JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const configTable = `
    CREATE TABLE IF NOT EXISTS system_config (
      id SERIAL PRIMARY KEY,
      key VARCHAR(50) UNIQUE NOT NULL,
      value JSONB NOT NULL
    );
  `;

  try {
    await db.query(usersTable);
    console.log('Users table ready.');
    await db.query(customersTable);
    console.log('Customers table ready.');
    await db.query(transactionsTable);
    console.log('Transactions table ready.');
    await db.query(configTable);
    console.log('System Config table ready.');

    // Create default admin user if none exists
    const adminCheck = await db.query("SELECT * FROM users WHERE username = 'admin'");
    if (adminCheck.rows.length === 0) {
      // In a real app we'd hash the password. For simplicity and beginner friendliness, we'll hash it here.
      // Actually, since we'll use a plain simple hashing logic in auth, let's keep it very clean.
      // Since it's a script, we'll wait for bcrypt to be installed, or we can just use simple string for demo 
      // if no bcrypt, but we'll install bcrypt anyway or use a simple base64 to keep it extremely simple without native deps? 
      // No, bcrypt is standard. Let's assume we install 'bcryptjs'. I should add that to npm install.
      // For now, I'll insert a plain text and the login endpoint will handle it, or we wait and use bcryptjs.
      console.log('Creating default admin user: admin / admin123');
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('admin123', 10);
      await db.query(
        "INSERT INTO users (name, username, password_hash, role) VALUES ($1, $2, $3, $4)",
        ['Super Admin', 'admin', hash, 'Admin']
      );
    }

    // Default Hotel Config
    const configCheck = await db.query("SELECT * FROM system_config WHERE key = 'hotel_dishes'");
    if (configCheck.rows.length === 0) {
      console.log('Inserting default hotel config...');
      const defaultDishes = [
        { name: 'Biryani', rate: 250 },
        { name: 'Karahi', rate: 800 },
        { name: 'Roti', rate: 15 },
        { name: 'Drink', rate: 100 }
      ];
      await db.query(
        "INSERT INTO system_config (key, value) VALUES ($1, $2)",
        ['hotel_dishes', JSON.stringify(defaultDishes)]
      );
    }

    console.log('Database setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();
