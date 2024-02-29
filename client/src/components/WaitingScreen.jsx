import React, {useEffect, useState} from "react";
import socket from "../socket";
import { useParams } from "react-router-dom";
import LeaveLobbyButton from "./LeaveLobbyButton";
import { useNavigate } from "react-router-dom";
import StartGameButton from "./StartGameButton";

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

const WaitingScreen = () => {

    const { lobbyName } = useParams();

    // Use state to manage waitingObject
    const [waitingObject, setWaitingObject] = useState(<DefaultWait totalJoined={1} />);

    const navigate = useNavigate(); // Access the useNavigate hook directly

    useEffect(() => {
        // Creates a start button for the host of this lobby that can start the game
        socket.on('startGameOption', () => {
            console.log("You are host");
            setWaitingObject(<StartGameButton name={lobbyName}/>);
        });

        socket.on('clientLeaveLobby', (lobby) => {
            console.log(lobby);
            navigate("/LobbyScreen");
        });

        socket.on('gameStarted', (lobbyName) => {
            navigate("/Match");
        });

        // Cleanup the socket listener when the component is unmounted
        return () => {
            socket.off('startGameOption');
            socket.off('destroyLobby');
            socket.off('gameStarted');
        };
    }, [navigate]); // Include navigate in the dependency array
    return (
        <>
            <div className="lobbyNameTitle">{lobbyName}</div>
            {waitingObject}
            <LeaveLobbyButton name={lobbyName}/>
        </>
    );
}

export default WaitingScreen;