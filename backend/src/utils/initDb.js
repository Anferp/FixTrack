/**
 * Database Initialization Script for FixTrack
 * 
 * This script initializes the database with default data:
 * - Creates an admin user
 * - Sets up initial configuration
 * - Can be used to reset the database for development/testing
 */
const { sequelize, User, Order, OrderAttachment, OrderComment, OrderUpdate, Client } = require('../models/index');
const { hashPassword } = require('./password');
const config = require('../config/config');

/**
 * Initialize database tables and relationships
 * @param {boolean} force - If true, drops and recreates all tables (use with caution!)
 */
const initializeDatabase = async (force = false) => {
  try {
    console.log('Initializing database...');
    
    // Sync all models with the database
    // If force is true, this will drop all tables first
    await sequelize.sync({ force });
    
    console.log('Database structure synchronized');
    
    // Only create seed data if we forced a reset or if no admin user exists
    const adminExists = await User.findOne({ where: { role: config.roles?.ADMIN || 'admin' } });
    
    if (force || !adminExists) {
      await createInitialData();
    } else {
      console.log('Initial data already exists. Skipping seeding.');
    }
    
    console.log('Database initialization completed successfully');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
};

/**
 * Create initial/seed data for the application
 */
const createInitialData = async () => {
  try {
    console.log('Creating initial data...');
    
    // Create admin user with default values if config.initialAdmin is missing
    const defaultAdminConfig = {
      username: 'admin',
      password: 'Admin@123'
    };
    
    // Safely access config properties or use defaults
    const adminUsername = config.initialAdmin?.username || defaultAdminConfig.username;
    const adminPassword = config.initialAdmin?.password || defaultAdminConfig.password;
    const adminRole = config.roles?.ADMIN || 'admin';
    
    const hashedPassword = await hashPassword(adminPassword);
    
    const admin = await User.create({
      username: adminUsername,
      password_hash: hashedPassword,
      role: adminRole,
      temp_password_flag: true, // Force admin to change password on first login
      is_active: true
    });
    
    console.log(`Admin user created: ${admin.username}`);
    
    // Create sample users for development (optional)
    if (process.env.NODE_ENV === 'development') {
      // Create a sample secretary
      const secretaryPassword = await hashPassword('Secretaria@123');
      const secretary = await User.create({
        username: 'secretaria',
        password_hash: secretaryPassword,
        role: config.roles?.SECRETARY || 'secretary',
        temp_password_flag: true,
        is_active: true
      });
      
      // Create a sample technician
      const techPassword = await hashPassword('Tecnico@123');
      const technician = await User.create({
        username: 'tecnico',
        password_hash: techPassword,
        role: config.roles?.TECHNICIAN || 'technician',
        temp_password_flag: true,
        is_active: true
      });
      
      console.log('Sample users created for development');

      // Create sample clients for development
      const sampleClient = await Client.create({
        name: 'Anfer',
        phone: '123-456-7890',
        email: 'Anfer@email.com'
      });
      
      // Create sample orders for development
      const sampleOrder = await Order.create({
        client_id: sampleClient.id,
        client_name: sampleClient.name,
        client_phone: sampleClient.phone,
        client_email: sampleClient.email,
        service_type: 'equipment_repair',
        problem_description: 'Equipo no enciende correctamente',
        status: 'pending',
        assigned_technician_id: technician.id,
        created_by: secretary.id,
        accessories: JSON.stringify(['Cable de alimentación', 'Mouse'])
      });
      
      // Add a sample comment
      await OrderComment.create({
        order_id: sampleOrder.id,
        user_id: secretary.id,
        comment_type: 'client',
        content: 'Cliente indica que el problema comenzó después de una tormenta eléctrica'
      });
      
      console.log('Sample order created for development');
    }
    
    console.log('Initial data creation completed');
    return true;
  } catch (error) {
    console.error('Error creating initial data:', error);
    throw error;
  }
};

/**
 * Drop all tables and reset the database completely
 * Use with extreme caution!
 */
const resetDatabase = async () => {
  try {
    console.warn('WARNING: Resetting entire database! All data will be lost!');
    return await initializeDatabase(true);
  } catch (error) {
    console.error('Error resetting database:', error);
    return false;
  }
};

// Export functions for use in other parts of the application
module.exports = {
  initializeDatabase,
  createInitialData,
  resetDatabase
};

// Allow direct execution of this script
if (require.main === module) {
  // If this script is run directly from the command line
  const args = process.argv.slice(2);
  const forceReset = args.includes('--force') || args.includes('-f');
  
  console.log(`Running database initialization ${forceReset ? 'with' : 'without'} forced reset`);
  
  initializeDatabase(forceReset)
    .then(() => {
      console.log('Database initialization script completed');
      process.exit(0);
    })
    .catch(err => {
      console.error('Database initialization failed:', err);
      process.exit(1);
    });
}
