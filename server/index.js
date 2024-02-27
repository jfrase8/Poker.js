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

    socket.on("leaveLobby", (lobbyName) => {
        

        let lobby = lobbyManager.getLobby(lobbyName);

        let host = lobby.host;
        if (socket.id == host){
            io.to(socket.id).emit('destroyLobby');
        }



        if (lobby.clients.count == 0)
        {
            io.to(socket.id).emit('emptyLobby');
        }
    });

    socket.on("joinLobby", (lobbyName) => {
        if (lobbyManager.joinLobby(lobbyName, socket.id))
        {
            io.to(socket.id).emit('lobbyJoined', lobbyName);

            // Get the lobby that was joined
            let lobby = lobbyManager.getLobby(lobbyName);

            // Check if lobby has enough people to start
            if (lobby.clients.count == 2)
            {
                // Get the host of lobby
                let host = lobby.host;
                for (client of lobby.clients)
                {
                    // If client is host, create start button
                    if (client === host)
                        io.to(host).emit('startGameOption');
                    else
                        io.to(client).emit('waitingForHostStart');
                }
            }
        }
        else{
            io.to(socket.id).emit('lobbyJoinFailed', lobbyName);
        }
    })

    socket.on("getLobbies", () => {
        io.to(socket.id).emit('refreshLobbies', lobbyManager.getAllLobbyNames());
    })

    socket.on("getStartupInfo", () => {
        
    });
});

server.listen(4001, () => {
    console.log("SERVER IS RUNNING");
});