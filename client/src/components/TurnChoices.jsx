import React, { useEffect, useState } from 'react';
import socket from '../socket';

const TurnChoices = (props) => {

    const sendChoice = (choice) => {
        let betAmount = 0; // Temporary value
        socket.emit('turnChoice', props.lobbyName, choice, betAmount);
    };

    return(
        <>
            {props.choices.map((choice, index) => (
                <button className="choice" onClick={() => sendChoice(choice)}  key={index}>
                    {choice}
                </button>
            ))}
        </>
    );


}

export default TurnChoices;