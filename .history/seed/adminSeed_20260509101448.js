const User = require('../models/User');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ username: 'admin' });
    
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('Admin@123', 12);
      await User.create({
        username: 'admin',
        email: 'admin@smartpark.com',
        password: hashedPassword,
        role: 'admin',
        status: 'active'
      });
      console.log('✅ Default admin account created');
      console.log('   Username: admin');
      console.log('   Password: Admin@123');
    } else {
      console.log('ℹ️  Admin account already exists');
    }
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
  }
};

module.exports = seedAdmin;