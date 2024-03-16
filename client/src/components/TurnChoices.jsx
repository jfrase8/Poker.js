import React, { useEffect, useState } from 'react';
import socket from '../socket';

const TurnChoices = (props) => {

    const sendChoice = (choice) => {
        socket.emit('turnChoice', choice);
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