import React, { useEffect, useState } from 'react';
import socket from '../socket';

const LeaveLobbyButton = (props) => {

    const leaveLobby = () => {
        socket.emit('serverLeaveLobby', props.name);
    };

    return(
        <button className='leaveLobby' onClick={leaveLobby}>Exit Lobby</button>
    )

};


export default LeaveLobbyButton;