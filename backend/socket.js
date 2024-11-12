const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const Room = require('./models/Room');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log("User connected:", socket.id);

  // Handle player joining a room
  socket.on('joinRoom', async ({ roomId, playerName }) => {
    socket.join(roomId);
    console.log(`${socket.id} joined room ${roomId}`);

    try {
      const room = await Room.findOne({ roomId }).populate('player1', 'username').populate('player2', 'username');
      if (room) {
        // Update player2 if it's empty and the player joining is not player1
        if (!room.player2 && room.player1.username !== playerName) {
          let player2 = await User.findOne({ username: playerName });
          if (!player2) {
            player2 = new User({ username: playerName });
            await player2.save();
          }
          room.player2 = player2._id;
          await room.save();
        }

        // Broadcast updated room information to all clients in the room
        io.to(roomId).emit('roomUpdated', {
          player1: room.player1 ? room.player1.username : 'Waiting for Player 1',
          player2: room.player2 ? room.player2.username : 'Waiting for Player 2',
        });

        // Broadcast the current game state
        io.to(roomId).emit('gameState', {
          cards: room.cards,
          scores: room.scores,
          turn: room.turn,
          status: room.status,
          player1: room.player1 ? room.player1.username : 'Waiting for Player 1',
          player2: room.player2 ? room.player2.username : 'Waiting for Player 2',
        });
      } else {
        socket.emit('error', { message: 'Room not found' });
      }
    } catch (error) {
      console.error("Error finding room:", error);
      socket.emit('error', { message: 'An error occurred while joining the room' });
    }
  });

  // Handle game start event
  socket.on('startGame', async ({ roomId, creatorId }) => {
    try {
      const room = await Room.findOne({ roomId }).populate('player1', 'username').populate('player2', 'username');
      if (room && room.creatorId.equals(creatorId)) {
        // Initialize cards
        const cards = [];
        for (let i = 1; i <= 8; i++) {
          cards.push({ value: `card${i}`, isFlipped: false });
          cards.push({ value: `card${i}`, isFlipped: false });
        }
        // Shuffle cards
        const shuffledCards = cards.sort(() => Math.random() - 0.5);
        room.cards = shuffledCards;
        room.status = 'started';
        room.turn = room.player1;
        await room.save();

        // Broadcast game start event to all players
        io.to(roomId).emit('gameStarted', { cards: shuffledCards, status: 'started', turn: room.turn, turnPlayerName: room.player1.username });
      }
    } catch (error) {
      console.error("Error starting game:", error);
    }
  });

  // Handle card flip event
  socket.on('flipCard', async ({ roomId, playerId, cardIndex1, cardIndex2 }) => {
    try {
      const room = await Room.findOne({ roomId }).populate('player1', 'username').populate('player2', 'username');
      if (!room || room.status !== 'started') {
        return;
      }
  
      if (!room.turn.equals(playerId)) {
        socket.emit('error', { message: 'Not your turn' });
        return;
      }
  
      if (cardIndex1 === cardIndex2) {
        return;
      }
  
      const card1 = room.cards[cardIndex1];
      const card2 = room.cards[cardIndex2];
  
      if (card1 && card2) {
        let isMatch = false;
        if (card1.value === card2.value) {
          if (playerId === room.player1._id.toString()) {
            room.scores.player1 += 1;
          } else {
            room.scores.player2 += 1;
          }
          card1.isFlipped = true;
          card2.isFlipped = true;
          card1.isMatched = true;
          card2.isMatched = true;
          isMatch = true;
        }
  
        await room.save();
  
        io.to(roomId).emit('cardFlipped', { isMatch, scores: room.scores, cards: room.cards });
  
        const allCardsFlipped = room.cards.every(card => card.isMatched);
if (allCardsFlipped) {
  let winner;
  if (room.scores.player1 > room.scores.player2) {
    winner = room.player1.username;
  } else if (room.scores.player2 > room.scores.player1) {
    winner = room.player2.username;
  } else {
    winner = 'Hòa';
  }

  // Emit the winner information
  io.to(roomId).emit('gameEnded', { winner, scores: room.scores });
  room.status = 'ended';
  await room.save();
  return;
}

  
        setTimeout(async () => {
          const nextTurn = room.turn.equals(room.player1._id) ? room.player2 : room.player1;
          room.turn = nextTurn;
          await room.save();
          io.to(roomId).emit('turnChanged', { turn: nextTurn._id, turnPlayerName: nextTurn.username });
        }, isMatch ? 0 : 2000);
      }
    } catch (error) {
      console.error("Error handling card flip:", error);
      socket.emit('error', { message: 'An error occurred while flipping cards' });
    }
  });
  
  
  socket.on('leaveRoom', async (roomId) => {
    socket.leave(roomId);
    console.log(`User left room ${roomId}`);
    try {
      const room = await Room.findOne({ roomId });
      if (room) {
        io.to(roomId).emit('playerLeft', { message: 'A player has left the room' });
      }
    } catch (error) {
      console.error("Error handling leaveRoom:", error);
    }
  });

  socket.on('resetGame', async ({ roomId }) => {
    try {
      const room = await Room.findOne({ roomId }).populate('player1', 'username').populate('player2', 'username');
      if (room) {
        // Resetting cards, scores, etc.
        const cards = [];
        for (let i = 1; i <= 8; i++) {
          cards.push({ value: `card${i}`, isFlipped: false });
          cards.push({ value: `card${i}`, isFlipped: false });
        }
        const shuffledCards = cards.sort(() => Math.random() - 0.5);
        room.cards = shuffledCards;
        room.scores = { player1: 0, player2: 0 };
        room.status = 'started';
        room.turn = room.player1; // Reset turn to player1 or however you'd like to manage turns
        await room.save();
  
        // Emit game start event to all clients
        io.to(roomId).emit('gameStarted', { cards: shuffledCards, status: 'started', turn: room.turn, turnPlayerName: room.player1.username });
      }
    } catch (error) {
      console.error('Error resetting game:', error);
    }
  });
  
  // Handle disconnect event
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

module.exports = { app, server };
