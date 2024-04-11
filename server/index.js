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

            // Set up roles on server
            if (lobby.clients.length > 2)
            {
                if (client.turnNumber == 1) client.role = "Dealer";
                if (client.turnNumber == 2) client.role = "Small Blind";
                if (client.turnNumber == 3) client.role = "Big Blind";
            }
            else {
                if (client.turnNumber == 1) client.role = "Small Blind";
                else client.role = "Big Blind";
            }
            // Get this clients hand
            let clientHand = lobby.deck.getPlayerHand(client);

            // Find opponents
            let opponents = lobby.clients.filter(_client => _client.id !== client.id);

            // Send all info of players to this client
            io.to(client.id).emit('playerInfo', clientHand, client, opponents, lobbyName);
        }
    });

    socket.on('turnChoice', (lobbyName, choice, betAmount) => {

        let lobby = lobbyManager.getLobby(lobbyName);
        let player = lobby.findClient(socket.id);
        let handSize = lobby.deck.dealtHands[0].cards.length;
        let roundOver = false;

        console.log(player.nickname + " " + choice + "ed");

        lobby.clients.forEach(client => {
            console.log(`Client ${client.turnNumber-1} role: ${client.role}`);
        });

        // Update their chosen action
        player.actionChose = choice;

        if (choice == 'fold')
        {
            // show that this player is folded
            player.status = 'folded';
        }
        else {
            player.status = 'done'
        }

        // Check if everyone has folded (also get a number for total chips currrently bet by those that folded)
        let foldCount = 0;
        let totalCurrentBet = 0;
        for (let client of lobby.clients)
        {
            if (client.status == "folded")
            {
                foldCount++;
                if (client.currentBet != "")
                    totalCurrentBet += client.currentBet;
            }
        }
        // Round is over, all but one player folded
        if (foldCount == lobby.clients.length-1)
        {
            lobby.switchRoles();
            lobby.setTurns();
            for (let client of lobby.clients)
            {
                // This client won the hand
                if (client.status != "folded")
                {
                    if (client.currentBet == "") client.currentBet = 0;
                    client.chipAmount += parseInt(lobby.deck.pot) + parseInt(client.currentBet) + parseInt(totalCurrentBet);
                    console.log(client.chipAmount);
                    client.currentBet = "";
                    
                    // Reset blinds
                    lobby.betBlinds();

                    io.to(client.id).emit('wonHand', client);

                    // Reset status
                    client.status = 'ready';
                }
            }
            for (let client of lobby.clients)
            {
                // These clients need to update
                if (client.status == "folded")
                {
                    // Reset status
                    client.status = 'ready';
                    
                    // Make sure someone who doesn't have a blind has nothing as their current bet
                    if ((client.role == "" || client.role == "Dealer") && client.currentBet != "") client.currentBet = "";

                    console.log(client);
                    io.to(client.id).emit('roundOver', client);
                }
            }

            roundOver = true;
            lobby.deck.resetDeck();

            // Redeal new hands and update opponents on players screens
            lobby.deck.dealHands(lobby.clients);
            for (let client of lobby.clients)
            {
                let opponents = lobby.clients.filter(_client => _client.id !== client.id);
                io.to(client.id).emit('updateHand', (lobby.deck.getPlayerHand(client)));
                io.to(client.id).emit('updateOpponents', opponents);
            }
                
        }

        // Make sure round is not over because of everyone folding
        if (!roundOver)
        {
            if (choice == 'bet') {
                player.currentBet = betAmount;
                client.chipAmount -= client.currentBet;
            }
    
            if (choice == 'raise')
            {
                // If player raised, all other players now get another turn
                for (let client of lobby.clients)
                {
                    if (client.id != player.id)
                        client.status = 'ready';
                }
    
                // Calculate added on amount and subtract that from players chips
                let addedBet = betAmount - player.currentBet;
                player.currentBet = betAmount;
                client.chipAmount -= addedBet;
            }
    
            if (choice == 'call')
            {
                // Keep track of the added bet
                let addedBet = 0;
    
                // Find highest currentBet
                let highestcurrentBet = 0;
                for (let client of lobby.clients)
                {
                    if (client.currentBet > highestcurrentBet)
                        highestcurrentBet = client.currentBet;
                        
                }
                addedBet = highestcurrentBet - player.currentBet;
    
                console.log("Highest Current Bet: " + highestcurrentBet);
                console.log("Added Bet: " + addedBet);
    
                // Set players currentBet to the highest current bet
                player.currentBet = highestcurrentBet;
    
                // Subtract the added on bet from their chip amount
                player.chipAmount -= addedBet;
            }
    
            // See how many players are ready for next round
            let count = 0;
            for (let client of lobby.clients)
            {
                if (client.status == 'done' || client.status == 'folded')
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
                    player.isYourTurn = false;
    
                    // After cards are flipped, turn switches to person after the dealer who is still in round
                    let nextPlayer = 2;
    
                    while (true)
                    {
                        // Make sure this player is still in round
                        if (lobby.clients[nextPlayer-1].status == 'folded')
                            nextPlayer++;
                        else
                            break;
                    }
                    
                    lobby.clients[nextPlayer-1].isYourTurn = true;
    
                    // Deal the next round of cards
                    if (handSize == 2)
                    {
                        lobby.deck.dealFlop();
                    }
                    else if (handSize > 2)
                        lobby.deck.dealTurnRiver();
                    
                    for (let client of lobby.clients)
                    {
                        // Put their chips in the main pot
                        lobby.deck.pot += client.currentBet;
                        client.currentBet = "";

                        // Check if client has folded
                        if (client.status != 'folded')
                        {
                            client.actionChose = "";
                            client.status = "ready";
                        }
                    }
                    for (let client of lobby.clients)
                    {
                        // Get this players new hand
                        playerHand = lobby.deck.getPlayerHand(client);
    
                        // Get opponents
                        let opponents = lobby.clients.filter(_client => _client.id !== client.id);
    
                        // Send new round info to clients
                        io.to(client.id).emit('nextRound', playerHand, client, opponents, lobby.deck.pot);
                    }
                }
            }
            else 
            {
                player.isYourTurn = false;
    
                // Switch turn to next available player
                let nextPlayer = player.turnNumber+1;
    
                // Make sure not to go out of bounds
                if (nextPlayer > lobby.clients.length)
                    nextPlayer = 1;
    
                while (true)
                {
                    // Make sure this player is still in round
                    if (lobby.clients[nextPlayer-1].status == 'folded')
                        nextPlayer++;
                    else
                        break;
                }
    
                lobby.clients[nextPlayer-1].isYourTurn = true;
    
                for (let client of lobby.clients)
                {
                    // Get opponents
                    let opponents = lobby.clients.filter(_client => _client.id !== client.id);
    
                    // Send next turn info to clients
                    io.to(client.id).emit('nextTurn', client, opponents, client.actionChose);
                }
    
            }
        }
    });
    socket.on('updateCurrentBet', (lobbyName, currentBet, action) => {

        // Get the lobby
        let lobby = lobbyManager.getLobby(lobbyName);

        // Get the client who sent this signal
        let client = lobby.findClient(socket.id);

        // Update their currentBet amount
        client.currentBet = currentBet;
        client.chipAmount -= client.currentBet;

        // Update their chosen action
        client.actionChose = action;

        // Other clients
        let otherClients = lobby.clients.filter(client => client.id !== socket.id);

        // Send this new info to all other clients
        for (let client of otherClients)
        {
            let opponents = lobby.clients.filter(opponent => opponent.id !== client.id);

            io.to(client.id).emit('updateOpponents', opponents);
        }
    });
});

server.listen(3001, () => {
    console.log("SERVER IS RUNNING");
});