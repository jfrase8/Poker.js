import React, {useEffect, useState} from "react";
import socket from "../socket";
import { useParams } from "react-router-dom";

const DefaultWait = (props) => {
    return (
        <>
            <div className="defaultWaitMessage">Waiting for 1 more player - Total Players: {props.totalJoined}/6</div>
        </>
    )
};

const WaitingForHost = (props) => {
    return (
        <>
            <div className="defaultWaitMessage">Waiting for host to start - Total Players: {props.totalJoined}/6</div>
        </>
    )
}
const HostStart = () => {
    return (
        <>
            <button className="startGame">Start Game</button>
        </>
    )
}

const WaitingScreen = () => {

    const { lobbyName } = useParams();

    // Use state to manage waitingObject
    const [waitingObject, setWaitingObject] = useState(<DefaultWait totalJoined={1} />);

    useEffect(() => {
        // Sends a signal to server to retrieve lobby info
        socket.emit('getStartupInfo');
        // Creates a start button for the host of this lobby that can start the game
        socket.on('startGameOption', () => {
            console.log("You are host");
            setWaitingObject(<HostStart />);
        }, []);

        // Cleanup the socket listener when the component is unmounted
        return () => {
            socket.off('startGameOption');
        };
    }); // Include navigate in the dependency array
    return (
        <>
            <div className="lobbyNameTitle">{lobbyName}</div>
            {waitingObject}
        </>
    );
}

export default WaitingScreen;