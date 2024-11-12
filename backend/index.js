const express = require('express');
const mongoose = require('mongoose');
const Room = require('./models/Room');
const User = require('./models/User.js');
const roomRoutes = require('./routes/room');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { app, server } = require("./socket.js");

// Cấu hình CORS
app.use(cors({
  origin: "http://localhost:3000", // Đảm bảo URL này là URL của frontend
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));


// Middleware để xử lý JSON
app.use(express.json());

// Kết nối MongoDB
mongoose.connect('mongodb://mongo:27017/gamelathinh', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Kết nối MongoDB thành công!'))
.catch(err => console.error('Kết nối MongoDB thất bại:', err));

// Route đăng ký người dùng
app.post('/api/users/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: 'User  already exists' });
    }

    const newUser  = new User({ username, password });
    await newUser .save();

    res.status(201).json({ message: 'User  registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

// Route đăng nhập người dùng
app.post('/api/users/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'User  not found' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, 'secretKey', { expiresIn: '1h' });
    res.json({ message: 'Login successful', token, username: user.username, userId: user._id });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// Sử dụng route Room
app.use('/api/rooms', roomRoutes);

// Khởi động server
server.listen(5000, () => {
  console.log('Server is running on port 5000');
});