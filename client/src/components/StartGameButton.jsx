import React from "react";
import socket from "../socket";

const StartGameButton = (props) => {

    const startGame = () => {
        console.log(props.name);
        socket.emit('startGame', (props.name));
    }

    return (
        <>
            <button className="startGame" onClick={startGame}>Start Game</button>
        </>
    )
}

export default StartGameButton;