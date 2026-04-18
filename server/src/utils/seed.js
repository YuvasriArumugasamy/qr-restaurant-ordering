import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Admin from '../models/Admin.js';
import Table from '../models/Table.js';
import MenuItem from '../models/MenuItem.js';

const MENU = [
  { name: 'Margherita Pizza', description: 'Classic tomato, mozzarella, basil.', price: 9.5, category: 'Pizza' },
  { name: 'Pepperoni Pizza', description: 'Tomato, mozzarella, pepperoni.', price: 11.0, category: 'Pizza' },
  { name: 'Caesar Salad', description: 'Romaine, parmesan, croutons, caesar dressing.', price: 7.0, category: 'Salads' },
  { name: 'Veggie Burger', description: 'House-made patty with lettuce, tomato, onion.', price: 8.5, category: 'Burgers' },
  { name: 'Chicken Burger', description: 'Grilled chicken, cheddar, pickles.', price: 9.0, category: 'Burgers' },
  { name: 'French Fries', description: 'Crispy golden fries, sea salt.', price: 3.5, category: 'Sides' },
  { name: 'Coke', description: 'Chilled 330ml.', price: 2.0, category: 'Drinks' },
  { name: 'Fresh Lime Soda', description: 'Sweet or salted.', price: 2.5, category: 'Drinks' },
  { name: 'Chocolate Brownie', description: 'Warm brownie with vanilla ice cream.', price: 4.5, category: 'Desserts' },
];

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');
  await mongoose.connect(uri);

  const email = (process.env.ADMIN_EMAIL || 'admin@restaurant.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  const existingAdmin = await Admin.findOne({ email });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(password, 10);
    await Admin.create({ email, passwordHash, name: 'Admin' });
    console.log(`Seeded admin: ${email} / ${password}`);
  } else {
    console.log(`Admin already exists: ${email}`);
  }

  const existingMenuCount = await MenuItem.countDocuments();
  if (existingMenuCount === 0) {
    await MenuItem.insertMany(MENU);
    console.log(`Seeded ${MENU.length} menu items`);
  } else {
    console.log(`Menu already seeded (${existingMenuCount} items)`);
  }

  const existingTableCount = await Table.countDocuments();
  if (existingTableCount === 0) {
    const tables = [];
    for (let i = 1; i <= 6; i++) tables.push({ number: i, label: `Table ${i}` });
    await Table.insertMany(tables);
    console.log(`Seeded ${tables.length} tables`);
  } else {
    console.log(`Tables already seeded (${existingTableCount} tables)`);
  }

  await mongoose.disconnect();
  console.log('Seed complete.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
