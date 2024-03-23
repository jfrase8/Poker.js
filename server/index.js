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

            // Update the player count of the lobby
            io.to(socket.id).emit('updatePlayerCount', (1));

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
        console.log(lobby);

        // Get the host of the lobby
        let host = lobby.host;

        // If host is the one who left lobby, force all of clients to leave
        if (socket.id == host){
            for (const client of [...lobby.clients])
            {
                lobbyManager.leaveLobby(lobbyName, client);
                io.to(client.id).emit('clientLeaveLobby', lobbyManager.getLobby(lobbyName));
            }
        }
        else {
            lobbyManager.leaveLobby(lobbyName, lobby.findClient(socket.id));
            io.to(socket.id).emit('clientLeaveLobby', lobby);

            // Have the clients still in the lobby update the amount of people in the lobby
            for (client of lobby.clients)
                io.to(client.id).emit('updatePlayerCount', lobby.clients.length);
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
                    if (client.id === host)
                    {
                        io.to(host).emit('startGameOption');
                    }    
                    else
                    {
                        io.to(client.id).emit('waitingForHostStart');
                        console.log(client.nickname + "joined");
                    }
                
                    // Have the clients still in the lobby update the amount of people in the lobby
                    io.to(client.id).emit('updatePlayerCount', (lobby.clients.length));
                }
            }
        }
        else{
            io.to(socket.id).emit('lobbyJoinFailed', lobbyName, joinLobby["reason"]);
        }
    })

    socket.on("getLobbies", () => {
        io.to(socket.id).emit('refreshLobbies', lobbyManager.getAllLobbyNames());
    });

    socket.on('startGame', (lobbyName) => {

        let lobby = lobbyManager.getLobby(lobbyName);

        // Set lobby to locked
        lobby.locked = true;

        // Deal Hands
        lobby.deck.dealHands(lobby.clients);

        // Turn order
        let turnNumber = 1;

        // Send an event to all clients to be redirected to match screen
        for (let client of lobby.clients)
        {
            io.to(client.id).emit('gameStarted');

            // Update turn number for client
            client.turnNumber = turnNumber;

            // Figure out if this client goes first
            if (lobby.clients.length == 3)
            {
                if (client.turnNumber == 1)
                {
                    console.log("3 players");
                    client.isYourTurn = true;
                }  
            }
            else if (lobby.clients.length > 3)
            {
                if (client.turnNumber == 4)
                {
                    console.log("More than 3 players");
                    client.isYourTurn = true;
                } 
            }     
            else
            {
                if (client.turnNumber == 1)
                {
                    console.log("Two players");
                    client.isYourTurn = true;
                }
            }       
            // Increase turn number
            turnNumber++;
        }

        for (let client of lobby.clients) {

            // Get this clients hand
            let clientHand = lobby.deck.getPlayerHand(client);

            // Find opponents
            let opponents = lobby.clients.filter(_client => _client.id !== client.id);

            // Send all info of players to this client
            io.to(client.id).emit('playerInfo', clientHand, client, opponents, lobby);
        }
    });

    socket.on('turnChoice', (lobby, choice) => {

        let player = lobby.findClient(socket.id);
        let handSize = lobby.deck.dealtHands[0].length;

        if (choice == 'fold')
        {
            player.status = 'folded';
        }
        else {
            player.status = 'continue'
        }

        if (choice == 'raise')
        {
            // If player raised, all other players now get another turn
            for (let client of lobby.clients)
            {
                if (client.id != player.id)
                    client.status = 'ready';
            }
        }

        if (choice == 'call')
        {
            // Find highest currentBet
            let highestcurrentBet = 0;
            for (let client of lobby.clients)
            {
                if (client.currentBet > highestcurrentBet)
                    highestcurrentBet = client.currentBet;
            }
            // Set players currentBet to the highest current bet
            player.currentBet = highestcurrentBet;
        }

        // See how many players are ready for next round
        let count = 0;
        for (let client of lobby.clients)
        {
            if (client.continue)
                count++;
        }

        // Check if this is last turn of the round
        if (count == lobby.clients.length) 
        {
            // Figure out who wins
            if (handSize == 7)
            {

            }
            else 
            {
                // Deal the next round of cards
                if (handSize == 2)
                    lobby.deck.dealFlop();
                else if (handSize > 2)
                    lobby.deck.dealTurnRiver();
                
                for (let client of lobby.clients)
                {
                    // Put their chips in the main pot
                    client.chipAmount -= client.currentBet;
                    lobby.pot += client.currentBet;
                    client.currentBet = 0;

                    // Get this players new hand
                    playerHand = lobby.deck.getPlayerHand(client)

                    // Send new round info to clients
                    io.to(client.id).emit('nextRound', playerHand, client.chipAmount);
                }
            }
        }

        if (choice == 'check')
        {
            // Switch turn to next player, or move onto next phase if all other plays are finished
            

            // Check if all players have finished this round
            if (count == lobby.clients.length)
            {
                
            }
            else {

            }
        }
    });
    socket.on('updateCurrentButt', (lobby, currentBet) => {

        console.log(lobby);

        // Get the client who sent this signal
        let client = lobby.findClient(socket.id);

        // Update their currentBet amount
        client.currentBet = currentBet;
    });
});

server.listen(3001, () => {
    console.log("SERVER IS RUNNING");
});