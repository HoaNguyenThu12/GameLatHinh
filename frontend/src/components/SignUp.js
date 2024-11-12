import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Signup.css';

const SignUp = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [registered, setRegistered] = useState(false); // Trạng thái để theo dõi xem đã đăng ký thành công chưa
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('http://localhost:5000/api/users/register', { username, password });
      alert(response.data.message);

      // Xóa giá trị của username và password sau khi đăng ký thành công
      setUsername('');
      setPassword('');

      // Cập nhật trạng thái để hiển thị thông báo sau khi đăng ký
      setRegistered(true);
    } catch (error) {
      alert(error.response?.data?.message || 'Error occurred');
    }
  };

  const handleBackToSignIn = () => {
    navigate('/'); // Điều hướng về trang Sign In
  };

  const handleStayOnSignUp = () => {
    // Ở lại trang Sign Up - reset trạng thái để hiển thị lại form
    setRegistered(false);
  };

  return (
    <div className="container">
      <div className="signup-container">
        <h2>Sign Up</h2>
        {!registered ? (
          // Form đăng ký nếu chưa đăng ký thành công
          <form onSubmit={handleSignUp}>
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
              <button type="submit">Sign Up</button>
            </div>
          </form>
        ) : (
          // Hiển thị thông báo sau khi đăng ký thành công
          <div className="success-message">
            <p>User registered successfully! Do you want to go back to the Sign In page or stay here?</p>
            <div className="button-container">
              <button onClick={handleBackToSignIn}>Back to Sign In</button>
              <button onClick={handleStayOnSignUp}>Stay on Sign Up</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignUp;
