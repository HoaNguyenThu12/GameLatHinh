import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate từ react-router-dom
import axios from 'axios';
import './Signin.css';

const SignIn = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate(); // Khởi tạo hook useNavigate

  const handleSignIn = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('http://localhost:5000/api/users/login', { username, password });
      alert(response.data.message);

      // Lưu token và username vào localStorage
      localStorage.setItem('token', response.data.token);
      
      localStorage.setItem('username', response.data.username); // Lưu username vào localStorage
      localStorage.setItem('userId', response.data.userId); // Lưu userId vào localStorage

      // Điều hướng đến trang Home
      navigate('/Home');
    } catch (error) {
      alert(error.response?.data?.message || 'Error occurred');
    }
  };

  const handleSignUp = () => {
    navigate('/SignUp'); // Điều hướng đến trang Sign Up
  };

  return (
    <div className="container">
      <div className="signin-container">
        <h2>Sign In</h2>
        <form onSubmit={handleSignIn}>
          <div className="form-group">
            <label>Username:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="button-container">
            <button type="button" onClick={handleSignUp} className="signup-button">
              Sign Up
            </button>
            <button type="submit">Sign In</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignIn;
