const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('render.com') ? { rejectUnauthorized: false } : false
});

async function createAdmin() {
  const username = 'admin';
  const password = 'admin123';
  
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    await pool.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
      [username, hashedPassword, 'Admin']
    );
    console.log('✅ Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('\nYou can now login at: http://localhost:3000/login');
  } catch (err) {
    console.error('❌ Error creating admin:', err.message);
    if (err.message.includes('duplicate key')) {
      console.log('⚠️  Admin user already exists!');
      console.log('Username: admin');
      console.log('Password: admin123');
    }
  } finally {
    pool.end();
  }
}

createAdmin();
