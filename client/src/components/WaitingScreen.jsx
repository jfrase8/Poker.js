import React, {useEffect, useState} from "react";
import socket from "../socket";
import { useParams } from "react-router-dom";
import LeaveLobbyButton from "./LeaveLobbyButton";
import { useNavigate } from "react-router-dom";
import StartGameButton from "./StartGameButton";

const HostDefault = () => {
    return (
        <>
            <div className="defaultWaitMessage">Waiting for 1 more player</div>
        </>
    )
};

const WaitingForHost = () => {
    return (
        <>
            <div className="defaultWaitMessage">Waiting for host to start</div>
        </>
    )
}

const TotalPlayers = () => {

    const { lobbyName } = useParams();

    const [playerCount, setPlayerCount] = useState(0);

    useEffect(() => {
        socket.emit('getPlayerCount', lobbyName);

        socket.on("updatePlayerCount", (clients) => {
            setPlayerCount(clients);
        });

        return(() => {
            socket.off('updatePlayerCount');
        });

    });

    return (
        <>
            <div className="totalPlayers">Total Players: {playerCount}/5</div>
        </>
    )
}



const WaitingScreen = () => {

    const { lobbyName } = useParams();

    // Use state to manage waitingObject
    const [waitingObject, setWaitingObject] = useState(<WaitingForHost />);
    
    const navigate = useNavigate(); // Access the useNavigate hook directly

    useEffect(() => {
        console.log("Refreshed");
        
        socket.emit('checkIfHost', lobbyName);

        socket.on('hostDefault', () => {
            setWaitingObject(<HostDefault />);
        });

        // Creates a start button for the host of this lobby that can start the game
        socket.on('startGameOption', () => {
            setWaitingObject(<StartGameButton name={lobbyName}/>);
        });

        socket.on('clientLeaveLobby', (lobby) => {
            console.log(lobby);
            setTimeout(() => navigate('/LobbyScreen'), 0);
        });

        socket.on('gameStarted', () => {
            navigate("/Match");
        });

        // Cleanup the socket listener when the component is unmounted
        return () => {
            socket.off('startGameOption');
            socket.off('gameStarted');
            socket.off('clientLeaveLobby');
            socket.off('hostDefault');
        };
    }, []);
    return (
        <>
            <div className="lobbyNameTitle">{lobbyName}</div>
            {waitingObject}
            {<TotalPlayers />}
            <LeaveLobbyButton name={lobbyName}/>
        </>
    );
}

export default WaitingScreen;