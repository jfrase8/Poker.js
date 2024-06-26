const lobbyManager = require("./lobbyManager");

const express  = require('express');
const app      = express();
const server   = require('http').createServer(app);
const io       = require('socket.io')(server, { path: `/poker.js/server/socket.io` });

var readyCount = 0;
var ready = true;

function emitToLobby(lobby, event, getOpponents, ...args) {
    for (const client of lobby.clients)
    {
        if (getOpponents){
            let opponents = lobby.clients.filter(_client => _client.id !== client.id);
            io.to(client.id).emit(event, opponents, ...args);
        }
        else {
            io.to(client.id).emit(event, ...args);
        }
        
    }
}

function updateCommunityCards(lobby) {
    for (let client of lobby.clients){
        let playerCards = lobby.deck.getPlayerHand(client).cards;
        io.to(client.id).emit('updateCommunity', playerCards);
    }
}

io.on("connection", (socket) => {
    console.log("client in");

    socket.on("updateReady", (lobbyName) => {
        readyCount++;
        let lobby = lobbyManager.getLobby(lobbyName);
        if (readyCount == lobby.clients.length)
        {
            ready = true;
            readyCount = 0;
        }
    });

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
            for (let client of lobby.clients)
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
            emitToLobby(lobby, 'updatePlayerCount', false, lobby.clients.length);
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

        // Set players initial cards
        for (let client of lobby.clients) {
            client.initialCards = [...lobby.deck.getPlayerHand(client).cards];
        }

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
                    client.isYourTurn = true;
                }  
            }
            else if (lobby.clients.length > 3)
            {
                if (client.turnNumber == 4)
                {
                    client.isYourTurn = true;
                } 
            }     
            else
            {
                if (client.turnNumber == 1)
                {
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

        // Check if player has already called for their info
        if (!player.infoGrabbed){
            player.infoGrabbed = true;
            io.to(socket.id).emit('playerInfo', playerHand, player, opponents, lobbyName);
        }
    });

    socket.on('turnChoice', (lobbyName, choice, betAmount) => {

        let lobby = lobbyManager.getLobby(lobbyName);
        console.log("Lobby:", lobby);
        console.log("Player ID:", socket.id);
        let player = lobby.findClient(socket.id);
        let handSize = lobby.deck.dealtHands[0].cards.length;
        let roundOver = false;

        console.log(player.nickname + " " + choice + "ed");

        // Update their chosen action
        player.actionChose = choice;

        if (choice == 'fold')
        {
            // show that this player is folded
            player.status = 'Folded';
        }
        else {
            player.played = true;
        }

        // Check if everyone has folded or is out of game except 1 (also get a number for total chips currrently bet by those that folded)
        let foldCount = 0;
        let totalCurrentBet = 0;
        for (let client of lobby.clients)
        {
            if (client.status == "Folded" || client.status == "Lost")
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

            // Set all in amounts for everyone except player who didnt fold
            for (let client of lobby.clients) {
                if (client.status !== "In") client.allInAmount = client.chipAmount;
            }

            for (let client of lobby.clients)
            {
                // This client won the hand
                if (client.status === "In")
                {
                    console.log(client.nickname, "won this hand");
                    if (client.currentBet == "") client.currentBet = 0;
                    client.chipAmount += parseInt(lobby.deck.pot) + parseInt(client.currentBet) + parseInt(totalCurrentBet);
                    client.currentBet = "";
                    


                    // Reset blinds
                    lobby.betBlinds();

                    io.to(client.id).emit('wonHand', client);

                    // Reset status
                    if (client.status !== "Lost") client.status = 'In';

                    break;
                }
            }
            for (let client of lobby.clients)
            {
                // These clients need to update
                if (client.status !== "In")
                {
                    console.log(client.nickname, "lost this hand");
                    // Reset status
                    if (client.status !== "Lost") client.status = 'In';
                    
                    // Make sure someone who doesn't have a blind has nothing as their current bet
                    if ((client.role == "") && client.currentBet != "") client.currentBet = "";

                    io.to(client.id).emit('roundOver', client);
                }
            }
            lobby.deck.resetDeck();

            // Redeal new hands and update opponents on players screens
            lobby.deck.dealHands(lobby.clients);
            // Set players initial cards
            for (let client of lobby.clients) {
                client.initialCards = [...lobby.deck.getPlayerHand(client).cards];
            }

            for (let client of lobby.clients)
            {
                let opponents = lobby.clients.filter(_client => _client.id !== client.id);

                if (client.status !== "Lost") {
                    io.to(client.id).emit('updateHand', lobby.deck.getPlayerHand(client).cards);
                }
                io.to(client.id).emit('updateOpponents', opponents);
            }
                
        }
        else
        {
            if (choice == 'bet') {
                player.currentBet = betAmount;
                player.chipAmount -= player.currentBet;

                if (player.chipAmount == 0) player.allIn = true;

                // If player bets, all other players now get another turn, unless they folded or are out of the game
                for (let client of lobby.clients)
                {
                    if (client.id != player.id && client.status === "In")
                        client.played = false;
                }
            }
    
            if (choice == 'raise')
            {
                // If player raised, all other players now get another turn, unless they folded
                for (let client of lobby.clients){
                    if (client.id != player.id && client.status === "In") {
                        client.played = false;
                    }
                }

                // Calculate added on amount and subtract that from players chips
                let addedBet = betAmount - player.currentBet;
                player.currentBet = betAmount;
                player.chipAmount -= addedBet;

                if (player.chipAmount == 0) player.allIn = true;
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
                // Set players currentBet to the highest current bet, if they have that many chips, otherwise, they put in all their chips
                if (highestcurrentBet > player.chipAmount+player.currentBet)
                {
                    // This player goes all in
                    player.currentBet = player.chipAmount+player.currentBet;
                    player.chipAmount = 0;
                    player.allIn = true;
                }
                else {
                    addedBet = highestcurrentBet - player.currentBet;
                    player.currentBet = highestcurrentBet;
        
                    // Subtract the added on bet from their chip amount
                    player.chipAmount -= addedBet;

                    if (player.chipAmount == 0) player.allIn = true;
                }
            }


            // See how many players are ready for next round. Also check for people who are all in
            let count = 0;
            let allInCount = 0;
            let outCount = 0;
            for (let client of lobby.clients)
            {
                if (client.played) 
                {
                    count++;
                }
                else if (client.status !== "In")
                {
                    count++;
                    outCount++;
                }
                if (client.allIn) allInCount++;
            }
    
            console.log("Out Count:", outCount + allInCount);
            console.log("Ready Count:", count);

            // Check if this is last turn of the round
            if (count == lobby.clients.length) 
            {
                // Figure out who wins
                if (handSize == 7)
                {
                    let winners = lobby.deck.findWinner(lobbyName, lobbyManager);

                    let winnerIDs = [];

                    let singleWinnerPotWon = 0;
                    let splitPotWon = 0;

                    if (winners.length == 1)
                    {
                        console.log(`${winners[0][0].nickname} won with ${winners[0][1][0]}`);
                        
                        for (let client of lobby.clients)
                        {
                            // Reset status
                            client.played = false;

                            // This client won the hand
                            if (client.id == winners[0][0].id)
                            {
                                if (client.currentBet == "") client.currentBet = 0;
                                singleWinnerPotWon = parseInt(lobby.deck.pot) + parseInt(client.currentBet) + parseInt(totalCurrentBet);
                                client.chipAmount += singleWinnerPotWon;
                                client.currentBet = "";

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
                            splitPotWon = splitAmount + parseInt(winner[0].currentBet);
                            winner[0].chipAmount += splitPotWon;
                            winner[0].currentBet = "";

                            io.to(winner[0].id).emit('wonHand', winner[0], winner[1][0], splitPotWon, winners);

                            // Reset status
                            client.played = false;

                            winnerIDs.push(winner[0].id);
                        }
                    }

                    let lostCount = 0;

                    // Check if players have no more chips
                    for (let client of lobby.clients){
                        if (client.chipAmount <= 0 && client.status !== "Lost"){
                            // Send message to client that they lost, then they enter spectate mode
                            client.status = "Lost";
                            lostCount++;
                            io.to(client.id).emit('lostGame');
                        }

                        // Set clients all in amount to their new amount of chips
                        client.allInAmount = client.chipAmount;
                    }

                    if (lostCount == lobby.clients.length - 1)
                    {
                        // Find the person who won
                        for (let client of lobby.clients){
                            if (client.status !== "Lost"){
                                console.log(client.nickname, "won!");
                                io.to(client.id).emit('wonGame');
                            }
                        }
                    }

                    lobby.switchRoles();
                    lobby.setTurns();
                    lobby.betBlinds();

                    for (let client of lobby.clients)
                    {
                        // These clients need to update
                        if (!winnerIDs.includes(client.id))
                        {
                            // Reset status
                            if (client.status !== "Lost") client.status = 'In';
                            
                            // Make sure someone who doesn't have a blind has nothing as their current bet
                            if ((client.role == "") && client.currentBet != "") client.currentBet = "";

                            if (winners.length > 1) io.to(client.id).emit('roundOver', client, winners, "", splitPotWon);
                            else io.to(client.id).emit('roundOver', client, winners, winners[0][1][0], singleWinnerPotWon);
                        }
                        else {
                            io.to(client.id).emit('wonHand', client, winners[0][1][0], singleWinnerPotWon, winners);
                        }
                    }

                    roundOver = true;
                    lobby.deck.resetDeck();

                    // Redeal new hands and update opponents on players screen
                    lobby.deck.dealHands(lobby.clients);
                    for (let client of lobby.clients)
                    {
                        let opponents = lobby.clients.filter(_client => _client.id !== client.id);
                        if (client.status !== "Lost")
                            io.to(client.id).emit('updateHand', lobby.deck.getPlayerHand(client).cards);
                        io.to(client.id).emit('updateOpponents', opponents);
                    }
                }
                // Enough people are all in to start automatically going through the rest of the phases
                else if (outCount + allInCount >= lobby.clients.length - 1)
                {
                    console.log('Auto phases');

                    // Reveal opponents cards
                    emitToLobby(lobby, 'revealCards', false);

                    // Start showing cards in phases
                    setTimeout(() => {
                        if (handSize == 2){
                            lobby.deck.dealFlop();
                            updateCommunityCards(lobby);
                            setTimeout(() => {
                                lobby.deck.dealTurnRiver();
                                updateCommunityCards(lobby);
                                setTimeout(() => {
                                    lobby.deck.dealTurnRiver();
                                    updateCommunityCards(lobby);
                                }, 2000);
                            }, 2000);
                        }
                        else if (handSize == 5) {
                            setTimeout(() => {
                                lobby.deck.dealTurnRiver();
                                updateCommunityCards(lobby);
                                setTimeout(() => {
                                    lobby.deck.dealTurnRiver();
                                    updateCommunityCards(lobby);
                                }, 2000);
                            }, 2000);
                        }
                        else {
                            setTimeout(() => {
                                lobby.deck.dealTurnRiver();
                                updateCommunityCards(lobby);
                            }, 2000);
                        }
                    }, 2000);

                    // Figure out winner

                    // Move onto next round

                }
                else
                {
                    player.isYourTurn = false;

                    // Check if there is a small blind
                    let smallBlind = "Big Blind";
                    for (let client of lobby.clients){
                        if (client.role == "Small Blind") {
                            smallBlind = "Small Blind";
                            break;
                        }
                    }

                    for (let client of lobby.clients)
                    {
                        if (client.role == smallBlind && client.status != "Folded" && !client.allIn)
                        {
                            client.isYourTurn = true;
                        }
                        else if (client.role == smallBlind){
                            while (true) {
                                let boundCheck = client.turnNumber;
                                if (boundCheck == lobby.clients.length) boundCheck = 0;
        
                                if (lobby.clients[boundCheck].status !== "In" || lobby.clients[boundCheck].allIn){
                                    boundCheck++;
                                }
                                else {
                                    lobby.clients[boundCheck].isYourTurn = true;
                                    break;
                                }
                            }
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
                        if (client.status != 'Folded')
                        {
                            client.actionChose = "";
                            client.played = false;
                        }
                    }
                    for (let client of lobby.clients)
                    {
                        if (client.status !== "Lost")
                        {
                            // Get this players new cards
                            playerHand = lobby.deck.getPlayerHand(client).cards;
    
                            // Get opponents
                            let opponents = lobby.clients.filter(_client => _client.id !== client.id);
        
                            // Send new round info to clients
                            io.to(client.id).emit('updateCommunity', playerHand);
                            io.to(client.id).emit('nextRound', client, opponents, lobby.deck.pot);
                        }
                        else {
                            // Get opponents
                            let opponents = lobby.clients.filter(_client => _client.id !== client.id);
                            console.log(opponents);


                            let opponentHand = lobby.deck.getPlayerHand(opponents[0]).cards;

                            // Send new round info to clients
                            io.to(client.id).emit('nextRoundSpectate', client, opponents, opponentHand, lobby.deck.pot);
                        }
                    }
                }
            }
            else 
            {
                player.isYourTurn = false;
    
                // Switch turn to next available player
                let nextPlayer = player.turnNumber+1;
    
                while (true)
                {
                    // Make sure not to go out of bounds
                    if (nextPlayer > lobby.clients.length) nextPlayer = 1;

                    console.log("Next player is:", lobby.clients[nextPlayer-1].nickname);

                    // Make sure this player is still in round
                    if (lobby.clients[nextPlayer-1].status !== 'In')
                        nextPlayer++;
                    else
                        break;
                }
    
                console.log("Selected player to go next is:", lobby.clients[nextPlayer-1].nickname);
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

    socket.on('getHighestBet', (lobbyName) => {
        let lobby = lobbyManager.getLobby(lobbyName);

        let highestBet = 0;
        for (let client of lobby.clients){
            if (typeof client.currentBet !== '')
                if (parseInt(client.currentBet) > highestBet) highestBet = parseInt(client.currentBet);
        }
        io.to(socket.id).emit('returnHighestBet', highestBet);
    });
});

server.listen(3001, () => {
    console.log("SERVER IS RUNNING");
});