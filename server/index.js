const lobbyManager = require("./lobbyManager");

const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    }
});

io.on("connection", (socket) => {

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

    socket.on("joinLobby", (lobbyName) => {
        if (lobbyManager.joinLobby(lobbyName, socket.id))
        {
            io.to(socket.id).emit('lobbyJoined', lobbyName);

            // Get the lobby that was joined
            let lobby = lobbyManager.getLobby(lobbyName);

            // Check if lobby has enough people to start
            if (lobby.clients.count = 2)
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

server.listen(3001, () => {
    console.log("SERVER IS RUNNING");
});