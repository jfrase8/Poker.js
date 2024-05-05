import './App.css';
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
import WaitingScreen from "./components/WaitingScreen";

function App() {
  return (
    <>
      <Router basename='poker.js'>
        <Routes>
            <Route exact path="/" element={<Home />}/>
            <Route path="/Match/:lobbyName" element={<Match />}/>
            <Route path="/LobbyScreen" element={<LobbyScreen />}/>
            <Route path="/WaitingScreen/:lobbyName" element={<WaitingScreen />}/>
            <Route path="*" element={<Navigate to="/" />}/>
        </Routes>
      </Router>
    </>
  );
}

export default App;


