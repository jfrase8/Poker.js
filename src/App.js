import './App.css';
import io from "socket.io-client";
import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Home from "./components/Home";
import Match from "./components/Match";
import LobbyScreen from "./components/LobbyScreen";

const socket = io.connect("http://localhost:3001");

function App() {
  return (
    <>
      <Router>
        <Routes>
            <Route exact path="/" element={<Home />}/>
            <Route path="/Match" element={<Match />}/>
            <Route path="/LobbyScreen" element={<LobbyScreen />}/>
            <Route path="*" element={<Navigate to="/" />}/>
        </Routes>
      </Router>
    </>
  );
}

export default App;


