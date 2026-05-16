const mongoose = require('mongoose');
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB: ${conn.connection.host}`);
  } catch (e) { console.error(e.message); process.exit(1); }
};
module.exports = connectDB;
