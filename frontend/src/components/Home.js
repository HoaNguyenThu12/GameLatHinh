// components/Home.js
import React, { useEffect, useState } from 'react';
import './Home.css'; 
import axios from 'axios'; 
import { useNavigate } from 'react-router-dom';

function Home() {
  const [username, setUsername] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [roomId, setRoomId] = useState(''); // State để lưu ID phòng
  const navigate = useNavigate();

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  const handleCreateRoom = async () => {
    try {
      const token = localStorage.getItem('token');
      const creatorId = localStorage.getItem('userId');
  
      if (!creatorId) {
        setErrorMessage('Không tìm thấy ID người tạo.');
        return;
      }
  
      console.log("Creating room with creatorId:", creatorId);
  
      const response = await axios.post('http://localhost:5000/api/rooms/create', { creatorId }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
  
      const roomId = response.data.room.roomId;
      alert(`Phòng đã được tạo: ${roomId}`);
      navigate(`/InGame/${roomId}`);
    } catch (error) {
      console.error('Lỗi khi tạo phòng:', error);
      alert('Không thể tạo phòng: ' + (error.response ? error.response.data.message : error.message));
    }
  };
  
  

  const handleJoinRoom = async () => {
    try {
      const playerId = localStorage.getItem('userId'); // Người chơi tham gia
      const username = localStorage.getItem('username');

      if (!roomId || !playerId || !username) {
        alert("Thông tin người chơi hoặc phòng không đầy đủ");
        return;
      }

      console.log("Joining room with roomId:", roomId, "playerId:", playerId, "username:", username);

      const response = await axios.post('http://localhost:5000/api/rooms/join-room', {
        roomId,
        playerId,
        username
      });

      alert('Đã tham gia phòng thành công');
      // Điều hướng người dùng đến trang chơi game
      navigate(`/InGame/${roomId}`);
    } catch (error) {
      console.error('Lỗi khi tham gia phòng:', error.response?.data?.message || error.message);
      alert('Không thể tham gia phòng: ' + (error.response ? error.response.data.message : error.message));
    }
  };
  
  
  
  

  return (
    <div className="container">
      <div className="home-container">
        <div className="user-info">
          <p>Chào mừng, {username}!</p>
        </div>
        <h1>Chào mừng đến với Phòng Game</h1>
        <div className="create-room-container">
          <button className="create-room-button" onClick={handleCreateRoom}>
            Tạo phòng
          </button>
        </div>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        <div className="search-container">
          <input 
            type="text" 
            placeholder="Nhập ID phòng" 
            className="search-input" 
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)} // Cập nhật state roomId
          />
          <button className="join-room-button" onClick={handleJoinRoom}>
            Vào phòng
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;
