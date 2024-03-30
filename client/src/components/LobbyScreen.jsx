import React, { useEffect, useState } from 'react';
import socket from '../socket';
import { useNavigate } from 'react-router-dom';

const LobbyScreen = () => {
    const [lobbies, setLobbies] = useState([]);
    const [inputValue, setInputValue] = useState('');

    const navigate = useNavigate(); // Access the useNavigate hook directly

    useEffect(() => {

        // Checks for if a new lobby has been created
        socket.on('lobbyCreated', (lobbyName) => {
            const newLobbyList = [...lobbies, { name: lobbyName }];
            setLobbies(newLobbyList);
            navigate(`/WaitingScreen/${lobbyName}`);
        });
        // Checks if a lobby is joined
        socket.on('lobbyJoined', (lobbyName) => {
            navigate(`/WaitingScreen/${lobbyName}`);
        })

        // Checks for lobby creation failure
        socket.on('lobbyCreationFailed', (reason) => {
            console.log(reason);
        });
        //Checks for lobby join failure
        socket.on('lobbyJoinFailed', (lobbyName, reason) => {
            alert("Failed to join: " + lobbyName + " Reason: " + reason);
        });

        // On Startup, get the lobbies currently on the server
        socket.emit('getLobbies');
        // then refresh lobby list
        socket.on('refreshLobbies', (serverLobbies) => {
            // Create a new array based on the existing state
            const newLobbyList = [...lobbies];

            serverLobbies.forEach(lobby => {
            // Check if the lobby is already in the list
                if (!newLobbyList.some(existingLobby => existingLobby.name === lobby)) {
                    newLobbyList.push({ name: lobby });
                }
            });

            // Update the state with the new array
            setLobbies(newLobbyList);
        });

        // Cleanup the socket listener when the component is unmounted
        return () => {
            socket.off('lobbyCreated');
            socket.off('lobbyJoined');
            socket.off('lobbyCreationFailed');
            socket.off('lobbyJoinFailed');
            socket.off('refreshLobbies');
        };
    }, [navigate]); // Include navigate in the dependency array

    // createLobby emits an event to server called 'createLobby'
    const createLobby = (lobbyName) => {
        // Make sure lobby name is not an empty string
        if (lobbyName != "")
            socket.emit('createLobby', lobbyName);
    };

    const joinLobby = (lobbyName) => {
        socket.emit('joinLobby', lobbyName);
    };

    const handleInputChange = (event) => {
        setInputValue(event.target.value);
      };

    return (
        <>
            <div className="lobbyScreen">
                <input type="text" value={inputValue} onChange={handleInputChange}></input>
                <button className="createLobby" onClick={() => createLobby(inputValue)}>Create Lobby</button>
                {lobbies.map((lobby, index) => (
                    <button className="newlobbies" onClick={() => joinLobby(lobby.name)}  key={index}>
                        {lobby.name}
                    </button>
                ))}
            </div>
        </>
    );
};

export default LobbyScreen;