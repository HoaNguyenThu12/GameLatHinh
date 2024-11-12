import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { useParams } from 'react-router-dom';
import './style.css';
import axios from 'axios';

const socket = io('http://localhost:5000', {
  transports: ['websocket', 'polling'],
  withCredentials: true,
});

function InGame() {
  const { roomId } = useParams();
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [creator, setCreator] = useState('');
  const [player2, setPlayer2] = useState('');
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [turnMessage, setTurnMessage] = useState('');
  const [winnerMessage, setWinnerMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const playerName = localStorage.getItem('username');
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    socket.emit('joinRoom', { roomId, playerName });

    return () => {
      socket.emit('leaveRoom', roomId);
      socket.off();
    };
  }, [roomId, playerName]);

  useEffect(() => {
    socket.on('roomUpdated', ({ player1, player2 }) => {
      setCreator(player1);
      setPlayer2(player2);
    });

    socket.on('gameStarted', ({ cards, status, turn, turnPlayerName }) => {
      setCards(cards);
      setIsGameStarted(status === 'started');
      setCurrentPlayer(turn);
      setTurnMessage(`Lượt của ${turnPlayerName}`);
    });

    socket.on('gameState', (roomData) => {
      setCards(roomData.cards);
      setScores(roomData.scores);
      setCurrentPlayer(roomData.turn);
      setIsGameStarted(roomData.status === 'started');
      setCreator(roomData.player1);
      setPlayer2(roomData.player2);
    });

    socket.on('cardFlipped', ({ isMatch, scores, cards }) => {
      setScores(scores);
      setCards(cards.map(card => ({
        ...card,
        isFlipped: card.isMatched || card.isFlipped, // Keep matched cards flipped
      })));
      if (!isMatch) {
        // Delay flipping back the unmatched cards
        setTimeout(() => {
          setCards(prevCards =>
            prevCards.map(card => ({
              ...card,
              isFlipped: card.isMatched, // Only keep matched cards flipped
            }))
          );
        }, 2000); // 2-second delay before flipping unmatched cards back
      }
      setFlippedCards([]);
      setTurnMessage(isMatch ? `Chúc mừng! ${playerName} đã tìm thấy một cặp!` : 'Không khớp! Chuyển lượt.');
    });

    socket.on('turnChanged', ({ turn, turnPlayerName }) => {
      setCurrentPlayer(turn);
      setTurnMessage(`Lượt của ${turnPlayerName}`);
    });

    socket.on('gameEnded', ({ winner, scores }) => {
      setScores(scores);
      setWinnerMessage(winner === 'Hòa' ? 'Trò chơi kết thúc với kết quả hòa!' : `Người chiến thắng là ${winner}!`);
      setIsGameStarted(false);
    });
    

    socket.on('error', ({ message }) => {
      setErrorMessage(message);
      setTimeout(() => {
        setErrorMessage('');
      }, 3000);
    });

    return () => {
      socket.off('roomUpdated');
      socket.off('gameStarted');
      socket.off('gameState');
      socket.off('cardFlipped');
      socket.off('turnChanged');
      socket.off('gameEnded');
      socket.off('error');
    };
  }, [roomId, playerName]);

  const startGame = async () => {
    try {
      await axios.post(`http://localhost:5000/api/rooms/start/${roomId}`, { creatorId: userId });
      socket.emit('startGame', { roomId, creatorId: userId });
    } catch (error) {
      console.error('Lỗi khi bắt đầu trò chơi', error);
    }
  };

  const handleFlip = (cardIndex) => {
    // Check conditions to prevent flipping the card
    if (
      flippedCards.length === 2 ||
      currentPlayer !== userId ||
      cards[cardIndex].isFlipped ||
      cards[cardIndex].isMatched
    ) {
      setErrorMessage('Không phải lượt của bạn');
      setTimeout(() => {
        setErrorMessage('');
      }, 2000);
      return;
    }
  
    // Flip the selected card
    const updatedCards = cards.map((card, index) =>
      index === cardIndex ? { ...card, isFlipped: true } : card
    );
  
    setCards(updatedCards);
    setFlippedCards(prev => [...prev, cardIndex]);
  
    // If this is the second flipped card
    if (flippedCards.length === 1) {
      const card1Index = flippedCards[0];
      const card1 = cards[card1Index];
      const card2 = updatedCards[cardIndex];
  
      // Emit event to the server to check card match status
      socket.emit('flipCard', {
        roomId,
        playerId: currentPlayer,
        cardIndex1: card1Index,
        cardIndex2: cardIndex,
      });
  
      // Delay the handling of unmatched cards
      setTimeout(() => {
        if (card1.value !== card2.value) {
          // If the cards do not match, flip them back
          const resetCards = updatedCards.map((card, index) => {
            if (index === card1Index || index === cardIndex) {
              return { ...card, isFlipped: false };
            }
            return card;
          });
          setCards(resetCards);
        } else {
          // If the cards match, mark them as matched
          const matchedCards = updatedCards.map((card, index) => {
            if (index === card1Index || index === cardIndex) {
              return { ...card, isMatched: true };
            }
            return card;
          });
          setCards(matchedCards);
        }
        setFlippedCards([]); // Reset flipped cards
      }, 2000); // 2-second delay
    }
  };
  
  const handlePlayAgain = async () => {
    try {
      setCards([]);
      setScores({ player1: 0, player2: 0 });
      setFlippedCards([]);
      setCurrentPlayer(null);
      setIsGameStarted(false);
      setTurnMessage('');
      setWinnerMessage('');
      setErrorMessage('');

      await axios.post(`http://localhost:5000/api/rooms/reset/${roomId}`);
      socket.emit('resetGame', { roomId });
    } catch (error) {
      console.error('Lỗi khi bắt đầu lại trò chơi', error);
    }
  };

  const handleLeaveGame = () => {
    window.location.href = '/Home';
  };

  return (
    <div className="container">
      <div className="profile top">
        <div className="name">{creator || 'Người chơi 1'}</div>
        <div className="coins">
          <i className="fas fa-coins"></i> {scores.player1}
        </div>
      </div>

      <div className="game-info">
        <h2>Room ID: {roomId}</h2>
        <h3>{turnMessage}</h3>
        {winnerMessage && (
          <div className="winner-message">
            <h2>{winnerMessage}</h2>
            <button onClick={handlePlayAgain}>Chơi lại</button>
            <button onClick={handleLeaveGame}>Thoát game</button>
          </div>
        )}
      </div>

      {!isGameStarted && player2 && !winnerMessage && (
        <button className="start-game-button" onClick={startGame}>
          Bắt đầu trò chơi
        </button>
      )}

      <div className="grid-container">
        <div className="grid grid-4x4">
          {cards.map((card, index) => (
            <div
              key={index}
              className={`cell ${card.isFlipped ? 'flipped' : ''}`}
              onClick={() => handleFlip(index)}
            >
              {card.isFlipped ? card.value : '?'}
            </div>
          ))}
        </div>
      </div>

      <div className="profile bottom">
        <div className="name">{player2 || 'Đang chờ người chơi 2'}</div>
        <div className="coins">
          <i className="fas fa-coins"></i> {scores.player2}
        </div>
      </div>
    </div>
  );
}

export default InGame;
