import React, { useEffect, useState } from 'react';
import socket from '../socket';
import { useNavigate } from 'react-router-dom';
import { useParams } from "react-router-dom";

const LeaveLobbyButton = () => {

    const { lobbyName } = useParams();

    const leaveLobby = (lobbyName) => {
        socket.emit('leaveLobby', lobbyName);
    };

    return(
        <button className='leaveLobby' onClick={() => leaveLobby(lobbyName)}>Exit Lobby</button>
    )

};


export default LeaveLobbyButton;