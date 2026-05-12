const User = require('../models/User');

const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ username: 'admin' });
    
    if (!adminExists) {
      await User.create({
        username: 'admin',
        email: 'admin@smartpark.com',
        password: 'Admin@123',
        fullName: 'System Administrator',
        phoneNumber: '0788000000',
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