// App.js
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import React from 'react';
import Home from './components/Home';
import InGame from './components/InGame';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SignIn />} />
        <Route path="/Home" element={<Home />} />
        <Route path="/SignUp" element={<SignUp />} />
        {/* Route nhận roomId như một tham số động */}
        <Route path="/InGame/:roomId" element={<InGame />} />
      </Routes>
    </Router>
  );
}

export default App;
