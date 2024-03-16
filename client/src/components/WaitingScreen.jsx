import React, {useEffect, useState} from "react";
import socket from "../socket";
import { useParams } from "react-router-dom";
import LeaveLobbyButton from "./LeaveLobbyButton";
import { useNavigate } from "react-router-dom";
import StartGameButton from "./StartGameButton";

const DefaultWait = (props) => {
    return (
        <>
            <div className="defaultWaitMessage">Waiting for 1 more player</div>
        </>
    )
};

const WaitingForHost = (props) => {
    return (
        <>
            <div className="defaultWaitMessage">Waiting for host to start</div>
        </>
    )
}

const TotalPlayers = () => {
    const [playerCount, setPlayerCount] = useState(() => {
        // Retrieve the player count from session storage or default to 1
        const storedCount = sessionStorage.getItem('playerCount');
        return storedCount ? parseInt(storedCount, 10) : 1;
    });

    //const navigate = useNavigate();

    useEffect(() => {
        socket.on("updatePlayerCount", (clients) => {
            setPlayerCount(clients);
        });

        // Update session storage whenever the player count changes
        sessionStorage.setItem('playerCount', playerCount.toString());

        return(() => {
            socket.off('updatePlayerCount');
        });

    }, [playerCount]);

    return (
        <>
            <div className="totalPlayers">Total Players: {playerCount}/6</div>
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
        };
    }, [navigate, lobbyName]); // Include navigate in the dependency array
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