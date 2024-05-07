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
            {
                // Have host change waitingObject back to default if they're only one left in lobby
                if (client.id == lobby.host && lobby.clients.length == 1) io.to(client.id).emit('hostDefault');
                
                io.to(client.id).emit('updatePlayerCount', lobby.clients.length);
            }
                

        }
    });

    socket.on("joinLobby", (lobbyName) => {
        const joinLobby = lobbyManager.joinLobby(lobbyName, socket.id);
        if (joinLobby["status"])
        {
            io.to(socket.id).emit('lobbyJoined', lobbyName);

            // Get the lobby that was joined
            let lobby = lobbyManager.getLobby(lobbyName);

            // Host
            for (let client of lobby.clients)
            {
                if (client.id == lobby.host && lobby.clients.length == 1) io.to(client.id).emit('hostDefault');
            }

            // Check if lobby has enough people to start
            if (lobby.clients.length == 2)
            {
                // Get the host of lobby
                let host = lobby.host;
                for (let client of lobby.clients)
                {
                    // If client is host, create start button
                    if (client.id === host)
                    {
                        io.to(host).emit('startGameOption');
                    }    
                    else
                    {
                        console.log(client.nickname + "joined");
                    }
                }
            }
            for (let client of lobby.clients)
            {
                // Have the clients still in the lobby update the amount of people in the lobby
                io.to(client.id).emit('updatePlayerCount', lobby.clients.length);
            }
        }
        else{
            io.to(socket.id).emit('lobbyJoinFailed', lobbyName, joinLobby["reason"]);
        }
    })

    socket.on("getLobbies", () => {
        io.to(socket.id).emit('refreshLobbies', lobbyManager.getAllLobbyNames());
    });
    socket.on('getPlayerCount', (lobbyName) => {
        let lobby = lobbyManager.getLobby(lobbyName);
        io.to(socket.id).emit('updatePlayerCount', lobby.clients.length);
    });
    socket.on('checkIfHost', (lobbyName) => {
        let lobby = lobbyManager.getLobby(lobbyName);
        if (lobby.host == socket.id) io.to(socket.id).emit('hostDefault');
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
                if (client.turnNumber == 2) client.role = "Small Blind";
                if (client.turnNumber == 3) client.role = "Big Blind";
            }
            else {
                if (client.turnNumber == 1) client.role = "Small Blind";
                else client.role = "Big Blind";
            }
        }
    });
    socket.on('grabInfo', (lobbyName) => {
        let lobby = lobbyManager.getLobby(lobbyName);
        let player = lobby.findClient(socket.id);

        // Get this players cards
        let playerHand = lobby.deck.getPlayerHand(player).cards;
        // Find opponents
        let opponents = lobby.clients.filter(_client => _client.id !== player.id);

        console.log(playerHand);

        io.to(socket.id).emit('playerInfo', playerHand, player, opponents, lobbyName);
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
                    if (!client.lost) client.status = 'ready';
                }
            }
            for (let client of lobby.clients)
            {
                // These clients need to update
                if (client.status == "folded")
                {
                    // Reset status
                    if (!client.lost) client.status = 'ready';
                    
                    // Make sure someone who doesn't have a blind has nothing as their current bet
                    if ((client.role == "") && client.currentBet != "") client.currentBet = "";


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
                io.to(client.id).emit('updateHand', (lobby.deck.getPlayerHand(client).cards));
                io.to(client.id).emit('updateOpponents', opponents);
            }
                
        }

        // Make sure round is not over because of everyone folding
        if (!roundOver)
        {
            if (choice == 'bet') {
                player.currentBet = betAmount;
                player.chipAmount -= player.currentBet;

                // If player bets, all other players now get another turn, unless they folded
                for (let client of lobby.clients)
                {
                    if (client.id != player.id && client.status != "folded")
                        client.status = 'ready';
                }
            }
    
            if (choice == 'raise')
            {
                // If player raised, all other players now get another turn, unless they folded
                for (let client of lobby.clients)
                {
                    if (client.id != player.id, client.status != "folded")
                        client.status = 'ready';
                }

                // Calculate added on amount and subtract that from players chips
                let addedBet = betAmount - player.currentBet;
                player.currentBet = betAmount;
                player.chipAmount -= addedBet;

                console.log("Player current bet:", player.currentBet);
                console.log("Player chip total:", player.chipAmount);
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
                    let winners = lobby.deck.findWinner(lobbyName, lobbyManager);

                    let winnerIDs = [];

                    lobby.switchRoles();
                    lobby.setTurns();

                    if (winners.length == 1)
                    {
                        console.log(`${winners[0][0].nickname} won with ${winners[0][1][0]}`);
                        
                        for (let client of lobby.clients)
                        {
                            // This client won the hand
                            if (client.id == winners[0][0].id)
                            {
                                if (client.currentBet == "") client.currentBet = 0;
                                client.chipAmount += parseInt(lobby.deck.pot) + parseInt(client.currentBet) + parseInt(totalCurrentBet);
                                console.log(client.chipAmount);
                                client.currentBet = "";
                                
                                // Reset blinds
                                lobby.betBlinds();

                                io.to(client.id).emit('wonHand', client, winners[0][1][0]);

                                // Reset status
                                client.status = 'ready';
                                winnerIDs.push(winners[0][0].id);
                            }
                        }
                    }
                    // Split pot
                    else {
                        let pot = parseInt(lobby.deck.pot) + parseInt(totalCurrentBet);
                        let extraChips = pot % winners.length;
                        
                        lobby.deck.pot -= extraChips;
                        let splitAmount = pot / winners.length;

                        for (let winner of winners)
                        {
                            if (winner[0].currentBet == "") winner[0].currentBet = 0;
                            winner[0].chipAmount += splitAmount + parseInt(winner[0].currentBet);
                            client.currentBet = "";
                            
                            // Reset blinds
                            lobby.betBlinds();

                            io.to(client.id).emit('wonHand', client, winner[1][0]);

                            // Reset status
                            client.status = 'ready';

                            winnerIDs.push(winner[0].id);
                        }
                    }

                    for (let client of lobby.clients)
                    {
                        // These clients need to update
                        if (!winnerIDs.includes(client.id))
                        {
                            // Reset status
                            if (!client.lost) client.status = 'ready';
                            
                            // Make sure someone who doesn't have a blind has nothing as their current bet
                            if ((client.role == "") && client.currentBet != "") client.currentBet = "";

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
                        io.to(client.id).emit('updateHand', (lobby.deck.getPlayerHand(client).cards));
                        io.to(client.id).emit('updateOpponents', opponents);
                    }


                    // Check if players have no more chips
                    for (let client of lobby.clients){
                        if (client.chipAmount <= 0){
                            // Send message to client that they lost, then they enter spectate mode
                            client.lost = true;
                            client.status = "folded";
                            io.to(client.id).emit('lostGame');
                        }
                    }

                    // Check how many players have lost
                    let lostCount = 0;
                    for (let client of lobby.clients){
                        if (client.lost){
                            lostCount++;
                        }
                    }
                    if (lostCount == lobby.clients.count - 1)
                    {
                        // Find the person who won
                        for (let client of lobby.clients){
                            if (!client.lost){
                                console.log(client.nickname, "won!");
                                io.to(client.id).emit('wonGame');
                            }
                        }
                    }
                }
                else 
                {
                    player.isYourTurn = false;
                    nextPlayer = 0;

                    for (let client of lobby.clients)
                    {
                        if (client.role == "Small Blind" && client.status != "folded")
                        {
                            client.isYourTurn = true;
                        }
                        else if (client.role == "Small Blind"){
                            nextPlayer = client.turnNumber;
                            while (true)
                            {
                                // Make sure this player is still in round
                                if (lobby.clients[nextPlayer].status == 'folded')
                                    nextPlayer++;
                                else
                                    break;
                            }
                            lobby.clients[nextPlayer-1].isYourTurn = true;
                            break;
                        }
                    }
                    
    
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
                        if (lobby.deck.pot == "") lobby.deck.pot = 0; // Make sure to switch pot to an int if this is the first time chips are going in
                        if (client.currentBet == "") client.currentBet = 0; // Make sure to change clients current bet to 0 if it is a blank string
                        lobby.deck.pot += parseInt(client.currentBet);
                        client.currentBet = "";

                        // Check if client has folded
                        console.log(client.nickname, client.status);
                        if (client.status != 'folded')
                        {
                            client.actionChose = "";
                            client.status = "ready";
                        }
                    }
                    for (let client of lobby.clients)
                    {
                        // Get this players new cards
                        playerHand = lobby.deck.getPlayerHand(client).cards;
    
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
    
                console.log("Next player turn number again:", nextPlayer);
                while (true)
                {
                    // Make sure not to go out of bounds
                    if (nextPlayer > lobby.clients.length) nextPlayer = 1;

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
    
                    console.log(client);

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

    socket.on('getHighestBet', (lobbyName) => {
        let lobby = lobbyManager.getLobby(lobbyName);

        let highestBet = 0;
        for (let client of lobby.clients){
            if (client.currentBet > highestBet) highestBet = client.currentBet;
        }
        io.to(socket.id).emit('returnHighestBet', highestBet);
    });
});

server.listen(3001, () => {
    console.log("SERVER IS RUNNING");
});