const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

// For Render deployment
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createAdmin() {
  const username = 'admin';
  const password = 'Admin@123456';
  
  try {
    console.log('🔄 Creating admin user...');
    console.log('Connecting to database...');
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await pool.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
      [username, hashedPassword, 'Admin']
    );
    
    console.log('\n✅ Admin user created successfully!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📝 LOGIN CREDENTIALS:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n🌐 Login URL: https://your-render-app.onrender.com/login');
    console.log('\n💡 IMPORTANT:');
    console.log('   - Change this password after first login');
    console.log('   - Keep credentials secure');
    console.log('   - Only 1 admin account allowed');
    
  } catch (err) {
    if (err.message.includes('duplicate key')) {
      console.log('\n⚠️  Admin user already exists!');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('📝 EXISTING ADMIN CREDENTIALS:');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('Username: admin');
      console.log('Password: Admin@123456');
      console.log('═══════════════════════════════════════════════════════════');
    } else {
      console.error('❌ Error creating admin:', err.message);
      console.error('\nTroubleshooting:');
      console.error('1. Verify DATABASE_URL environment variable is set');
      console.error('2. Check PostgreSQL database is running');
      console.error('3. Verify database credentials are correct');
    }
  } finally {
    await pool.end();
  }
}

createAdmin();
