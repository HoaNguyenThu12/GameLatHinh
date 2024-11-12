const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Định nghĩa schema cho người dùng
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true, // Đảm bảo username là duy nhất
  },
  password: {
    type: String,
    required: true, // Mật khẩu bắt buộc
  },
});

// Middleware để hash (mã hóa) mật khẩu trước khi lưu vào database
userSchema.pre('save', async function (next) {
  // Nếu mật khẩu chưa được thay đổi, bỏ qua bước mã hóa
  if (!this.isModified('password')) return next();
  
  // Tạo salt và hash mật khẩu
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next(); // Chuyển sang bước tiếp theo
});

// Phương thức so sánh mật khẩu khi đăng nhập
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password); // Trả về true nếu mật khẩu khớp
};

// Tạo và xuất model User
const User = mongoose.model('User', userSchema);
module.exports = User;