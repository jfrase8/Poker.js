const lobbyManager = require("./lobbyManager");

const express  = require('express');
const app      = express();
const server   = require('http').createServer(app);
const io       = require('socket.io')(server, { path: `/poker.js/server/socket.io` });

io.on("connection", (socket) => {
    console.log("client in");
    socket.on("createLobby", (lobbyName) => {

        if (lobbyManager.createLobby(lobbyName, socket.id))
        {
            // After creating a lobby, redirect client to lobby screen
            io.to(socket.id).emit('lobbyCreated', lobbyName);

            // Refresh the list of lobbies for all clients connected to server
            const lobbies = lobbyManager.getAllLobbyNames();
            io.emit('displayLobbies', lobbies);
        }
        else
        {
            io.to(socket.id).emit('lobbyCreationFailed', "Lobby already exists");
        }
    });

    socket.on("serverLeaveLobby", (lobbyName) => {
        
        // Get the lobby that client is leaving
        let lobby = lobbyManager.getLobby(lobbyName);

        // Get the host of the lobby
        let host = lobby.host;

        // If host is the one who left lobby, force all of clients to leave
        if (socket.id == host){
            for (const client of [...lobby.clients])
            {
                console.log(lobby.clients);
                console.log(client + " left");
                lobbyManager.leaveLobby(lobbyName, client);
                io.to(client).emit('clientLeaveLobby', (lobbyManager.getLobby(lobbyName)));
            }
        }
        else {
            lobbyManager.leaveLobby(lobbyName, socket.id);
            io.to(socket.id).emit('clientLeaveLobby', (lobbyManager.getLobby(lobbyName)));
        }
    });

    socket.on("joinLobby", (lobbyName) => {
        const joinLobby = lobbyManager.joinLobby(lobbyName, socket.id);
        if (joinLobby["status"])
        {
            io.to(socket.id).emit('lobbyJoined', lobbyName);

            // Get the lobby that was joined
            let lobby = lobbyManager.getLobby(lobbyName);

            // Check if lobby has enough people to start
            if (lobby.clients.length == 2)
            {
                // Get the host of lobby
                let host = lobby.host;
                for (client of lobby.clients)
                {
                    // If client is host, create start button
                    if (client === host)
                    {
                        io.to(host).emit('startGameOption');
                    }    
                    else
                        io.to(client).emit('waitingForHostStart');
                }
            }
        }
        else{
            io.to(socket.id).emit('lobbyJoinFailed', (lobbyName, joinLobby["reason"]));
        }
    })

    socket.on("getLobbies", () => {
        io.to(socket.id).emit('refreshLobbies', lobbyManager.getAllLobbyNames());
    });

    socket.on('startGame', (lobbyName) => {

        let lobby = lobbyManager.getLobby(lobbyName);
        console.log(lobby);


        // Send an event to all clients to be redirected to match screen
        for (client of lobby.clients)
        {
            io.to(client).emit('gameStarted', (lobbyName));
        }
        
    });
});

server.listen(3001, () => {
    console.log("SERVER IS RUNNING");
});