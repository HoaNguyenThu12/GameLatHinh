const express = require('express');
const mongoose = require('mongoose');
const Room = require('../models/Room');
const User = require('../models/User'); // Sửa lại đường dẫn này cho đúng
const router = express.Router();

// Route để tạo phòng
router.post('/create', async (req, res) => {
  const { creatorId } = req.body;

  console.log("Received request to create room with creatorId:", creatorId);

  try {
    if (!creatorId) {
      console.log("creatorId is missing");
      return res.status(400).json({ message: 'creatorId is required' });
    }

    const creator = await User.findById(creatorId);
    if (!creator) {
      console.log("Không tìm thấy người tạo với ID:", creatorId);
      return res.status(400).json({ message: 'Không tìm thấy người tạo' });
    }

    const roomId = Math.random().toString(36).substr(2, 9);
    const newRoom = new Room({
      roomId,
      creatorId,
      player1: creatorId,
      scores: { player1: 0, player2: 0 },
    });

    console.log("Creating new room:", newRoom);

    await newRoom.save();
    res.status(201).json({ message: 'Phòng đã tạo thành công', room: newRoom });
  } catch (error) {
    console.error('Lỗi khi tạo phòng:', error);
    res.status(500).json({ message: 'Lỗi khi tạo phòng', error: error.message });
  }
});

// Route để lấy thông tin phòng
router.get('/:roomId', async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId })
      .populate('player1', 'username')
      .populate('player2', 'username');

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json({ room });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching room details', error: error.message });
  }
});

// Route để player2 tham gia phòng
router.post('/join-room', async (req, res) => {
  const { roomId, playerId, username } = req.body;

  console.log("Request to join room:", req.body);

  if (!roomId || !playerId || !username) {
    console.log("Thiếu thông tin tham gia phòng");
    return res.status(400).json({ message: 'Thiếu thông tin tham gia phòng' });
  }

  try {
    // Tìm kiếm phòng theo `roomId`
    const room = await Room.findOne({ roomId });

    if (!room) {
      console.log("Không tìm thấy phòng với ID:", roomId);
      return res.status(404).json({ message: 'Không tìm thấy phòng' });
    }

    // Kiểm tra xem người chơi tham gia có phải là `player1` không
    if (room.player1.toString() === playerId) {
      console.log("Người tạo phòng không thể tham gia lại phòng");
      return res.status(400).json({ message: 'Người tạo phòng không thể tham gia lại phòng' });
    }

    // Kiểm tra nếu đã có `player2` thì không thể thêm nữa
    if (room.player2) {
      console.log("Phòng đã đầy, không thể thêm người chơi");
      return res.status(400).json({ message: 'Phòng đã có hai người chơi' });
    }

    // Tìm kiếm người dùng hoặc tạo người dùng mới nếu chưa có
    let player2 = await User.findOne({ username });
    if (!player2) {
      player2 = new User({ username });
      await player2.save();
    }

    // Cập nhật thông tin người chơi thứ hai
    room.player2 = player2._id;
    room.status = 'full';
    await room.save();

    console.log("Người chơi thứ hai đã tham gia thành công:", player2.username);
    return res.json({ room });
  } catch (error) {
    console.error('Lỗi khi tham gia phòng:', error);
    res.status(500).json({ message: 'Lỗi khi tham gia phòng', error: error.message });
  }
});




// Route để bắt đầu trò chơi
router.post('/start/:roomId', async (req, res) => {
  const { creatorId } = req.body;

  try {
    const room = await Room.findOne({ roomId: req.params.roomId });

    if (!room || room.status !== 'full') {
      return res.status(400).json({ message: 'Cannot start game, room is not full or not found' });
    }

    if (!room.creatorId.equals(mongoose.Types.ObjectId(creatorId))) {
      return res.status(403).json({ message: 'Only the room creator can start the game' });
    }

    // Khởi tạo danh sách thẻ
    const cards = [];
    for (let i = 1; i <= 8; i++) {
      cards.push({ value: `card${i}`, isFlipped: false });
      cards.push({ value: `card${i}`, isFlipped: false });
    }
// Xáo trộn thẻ
    const shuffledCards = cards.sort(() => Math.random() - 0.5);
    room.cards = shuffledCards; // Cập nhật cards theo cấu trúc mới
    room.turn = room.player1;
    room.status = 'started';

    await room.save();
    res.json({ message: 'Game started', cards: shuffledCards, roomStatus: room.status });
  } catch (error) {
    console.error('Error starting game:', error.message);
    res.status(500).json({ message: 'Error starting game', error: error.message });
  }
});



// Route xử lý việc lật thẻ
router.post('/flip/:roomId', async (req, res) => {
  const { playerId, cardIndex1, cardIndex2 } = req.body;

  try {
    const room = await Room.findOne({ roomId: req.params.roomId });

    if (!room || room.status !== 'started') {
      return res.status(400).json({ message: 'Game not started or room not found' });
    }

    const card1 = room.cards[cardIndex1];
    const card2 = room.cards[cardIndex2];

    if (card1 && card2) {
      if (card1.value === card2.value) {
        // Cập nhật điểm cho người chơi tương ứng
        if (playerId === room.player1.toString()) {
          room.scores.player1 += 1;
        } else {
          room.scores.player2 += 1;
        }

        card1.isFlipped = true;
        card2.isFlipped = true;
        await room.save();

        return res.json({ isMatch: true, scores: room.scores });
      }
    }

    return res.json({ isMatch: false, scores: room.scores });
  } catch (error) {
    console.error('Error flipping cards:', error);
    res.status(500).json({ message: 'Error flipping cards', error: error.message });
  }
});



// Route để chuyển lượt
router.post('/switchTurn/:roomId', async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });

    if (!room || room.status !== 'started') {
      return res.status(400).json({ message: 'Game not started or room not found' });
    }

    room.turn = room.turn.equals(room.player1) ? room.player2 : room.player1;
    await room.save();

    res.json({ turn: room.turn });
  } catch (error) {
    console.error('Error in switchTurn route:', error);
    res.status(500).json({ message: 'Error switching turn', error: error.message });
  }
});

module.exports = router;