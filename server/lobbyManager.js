const {DeckManager} = require("./DeckManager");

class Client {
    constructor(_id, _nickname, _color){
        this.id = _id;
        this.nickname = _nickname;
        this.color = _color;
        this.turnNumber = 0;
        this.isYourTurn = false;
        this.chipAmount = 1000;
        this.currentBet = "";
        this.status = 'In';
        this.played = false;
        this.actionChose = "";
        this.role = "";
        this.infoGrabbed = false;
        this.allIn = false;
        this.allInAmount = 1000;
        this.initialCards = [];
    }
}

class Lobby
{
    constructor(name, host){
        this.name = name;
        this.host = host;
        this.clients = [];
        this.deck = new DeckManager();
        this.locked = false;
        this.playerNames = ["Big Bob", "Snormoo Beanieborn", "Peabs Droopyeye", "Buzzy Woolham", "Crocky Oinkbrain", "Binroid Sniffer", "Eggbert", "Wumbus", "Darth Paul"];
        this.colors = ["#ff8ba1", "#ffb943", "#00b98f", "#9a70ff", "#fff700", "#0092ff", "#7e571c"];
        this.currentBlinds = [10, 20];
    }

    addClient(clientID){
        this.clients.push(new Client(clientID, this.chooseRandomName(), this.chooseRandomColor()));
    }

    removeClient(client){
        const index = this.clients.indexOf(client);
        if (index !== -1)
            this.clients.splice(index, 1);
    }

    getClientsCount(){
        return this.clients.length;
    }

    findClient(clientID){
        for (let client of this.clients)
        {
            if (clientID == client.id)
                return client;
        }
    }

    chooseRandomName(){
        // Generate a random index
        const randomIndex = Math.floor(Math.random() * this.playerNames.length);

        // Retrieve the element at the random index
        const randomName = this.playerNames[randomIndex];

        // Remove the element from the array
        this.playerNames.splice(randomIndex, 1);

        return randomName;
    }
    chooseRandomColor(){
        // Generate a random index
        const randomIndex = Math.floor(Math.random() * this.colors.length);

        // Retrieve the element at the random index
        const randomColor = this.colors[randomIndex];

        // Remove the element from the array
        this.colors.splice(randomIndex, 1);

        return randomColor;
    }

    switchRoles() {

        let playersIn = {};
        let playersOut = {};

        let bigBlindOut = false;

        let hasNewRole = "";

        // Find players who are in and players who are knocked out and what roles they have
        for (let client of this.clients) {
            if (client.status !== "Lost"){
                playersIn[client.turnNumber] = client.role;
            }
            else {
                playersOut[client.turnNumber] = client.role;
            }
        }
        // Check if the big blind was knocked out
        for (let key in playersOut) {
            if (playersOut[key] === "Big Blind") {
                bigBlindOut = true;
            }
        }

        // Situation 1 - Big Blind gets knocked out
        if (bigBlindOut) {
            for (let key in playersOut) {
                if (playersOut[key] == "Big Blind"){
                    // Find next available player to the left
                    let nextPlayerIndex = parseInt(key); // Next player is gonna be the same as current players turn number (turn number - 1 = clients array index)
                    while (true) {
                        if (nextPlayerIndex == this.clients.length) nextPlayerIndex = 0; // Bounds check
                        else if (this.clients[nextPlayerIndex].status === "Lost") nextPlayerIndex++;
                        else {
                            this.clients[nextPlayerIndex].role = "Big Blind";
                            hasNewRole += this.clients[nextPlayerIndex].nickname;
                            break;
                        }
                    }
                    break;
                }
            }
        }
        // Situation 2 - Rotate Normally
        else {
            for (let key in playersIn) {
                if (playersIn[key] == "Big Blind") {
                    let nextPlayerIndex = parseInt(key);

                    // Current Big blind becomes small blind
                    this.clients[nextPlayerIndex-1].role = "Small Blind";
                    hasNewRole += this.clients[nextPlayerIndex-1].nickname;

                    // Shift big blind to next available player
                    while (true) {
                        if (nextPlayerIndex == this.clients.length) nextPlayerIndex = 0; // Bounds check
                        else if (this.clients[nextPlayerIndex].status === "Lost") nextPlayerIndex++;
                        else {
                            this.clients[nextPlayerIndex].role = "Big Blind";
                            hasNewRole += this.clients[nextPlayerIndex].nickname;
                            break;
                        }
                    }
                    break;
                }
            }
        }

        // Change all other players current roles to nothing
        for (let client of this.clients) {
            if (!hasNewRole.includes(client.nickname)) client.role = "";
        }

        // Make sure their role is displayed
        for (let client of this.clients) client.actionChose = client.role;

        // Testing
        console.log(this.clients[0].nickname, this.clients[0].role);
        console.log(this.clients[1].nickname, this.clients[1].role);
    }

    betBlinds() {
        for (let client of this.clients)
        {
            if (client.status !== "Lost")
            {
                if (client.role == "Big Blind")
                {
                    client.currentBet = this.currentBlinds[1];
                    client.chipAmount -= client.currentBet;
                }
                if (client.role == "Small Blind")
                {
                    client.currentBet = this.currentBlinds[0];
                    client.chipAmount -= client.currentBet;
                }  
            }   
        }
    }

    setTurns() {
        this.clients.forEach(client => {
            // Reset all clients turns
            client.isYourTurn = false;
        });

        for (let client of this.clients)
        {
            if (this.clients.length > 2)
            {
                if (client.role == "Big Blind")
                {
                    let boundCheck = client.turnNumber;
                    while (true) {
                        // Technically client to the left of this client (check for out of bounds)
                        if (boundCheck == this.clients.length) boundCheck = 0;

                        if (this.clients[boundCheck].status === "Lost"){
                            boundCheck++;
                        }
                        else {
                            this.clients[boundCheck].isYourTurn = true;
                            console.log(this.clients[boundCheck]);
                            break;
                        }
                    }
                }
            }
            else if (client.role == "Small Blind") client.isYourTurn = true;
        }
    }
}

class LobbyManager
{
    constructor(){
        this.lobbies = {};
    }

    createLobby(lobbyName, host)
    {
        if (!this.lobbies[lobbyName])
        {
            console.log("Added lobby: " + lobbyName);
            this.lobbies[lobbyName] = new Lobby(lobbyName, host);
            this.lobbies[lobbyName].addClient(host);
            console.log("Host: " + this.lobbies[lobbyName].clients[0].nickname);

            return true;
        }
        else{
            return false; // Lobby already exists
        }
    }

    joinLobby(lobbyName, clientID)
    {
        const lobby = this.lobbies[lobbyName];
        if (!lobby)
        {
            return { status: false, reason: 'Lobby does not exist' };
        }
        else if (lobby.getClientsCount() == 5)
        {
            return { status: false, reason: 'Lobby is full' };
        }
        else if (lobby.locked)
        {
            return {status: false, reason: "Lobby has already started"}
        }
        else
        {
            lobby.addClient(clientID);
            console.log(this.lobbies[lobbyName].clients);
            return { status: true }; // Joined lobby successfully
        }
    }

    leaveLobby(lobbyName, client)
    {
        const lobby = this.lobbies[lobbyName];
        if (lobby)
        {
            // Add this clients nickname back into nickname pool
            lobby.playerNames.push(client.nickname);

            // Remove the client
            lobby.removeClient(client);

            // Delete the lobby once lobby is empty
            if (lobby.getClientsCount() === 0)
            {
                delete this.lobbies[lobbyName];
            }
            return true; // Left lobby successfully
        }
        return false; // Lobby doesn't exist
    }

    getLobby(lobbyName)
    {
        const lobby = this.lobbies[lobbyName];
        if (lobby)
            return lobby;
        else
            return false;
    }

    // Returns an array of the names of all lobbies that are currrently joinable
    getAllLobbyNames()
    {
        let unlockedLobbies = [];
        for (let lobbyName in this.lobbies)
        {
            let lobby = lobbyManager.getLobby(lobbyName);
            if (!lobby.locked)
            {
                unlockedLobbies.push(lobby.name);
            }
                

        }
        return unlockedLobbies; // Returns an array of lobby names
    }
}

const lobbyManager = new LobbyManager();

module.exports = lobbyManager;