const mongoose = require('mongoose');

// Định nghĩa schema cho Card
const cardSchema = new mongoose.Schema({
  value: {
    type: String,
    required: true, // Giá trị của thẻ
  },
  isFlipped: {
    type: Boolean,
    default: false, // Trạng thái của thẻ (đã lật hay chưa)
  },
});

// Định nghĩa schema cho Room
const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
  },
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  player1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  player2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  status: {
    type: String,
    enum: ['created', 'waiting', 'full', 'started'],
    default: 'created',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  cards: [cardSchema],
  turn: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  scores: {
    player1: { type: Number, default: 0 },
    player2: { type: Number, default: 0 },
  },
  countdown: {
    type: Number,
    default: 30,
  },
});

const Room = mongoose.model('Room', roomSchema);
module.exports = Room;
