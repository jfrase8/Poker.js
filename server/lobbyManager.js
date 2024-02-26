class Lobby
{
    constructor(name, host){
        this.name = name;
        this.host = host;
        this.clients = [host];
    }

    addClient(clientID){
        this.clients.push(clientID);
    }

    removeClient(clientID){
        const index = this.clients.indexOf(clientID);
        if (index !== -1)
            this.clients.splice(index, 1);
    }

    getClientsCount(){
        return this.clients.length;
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
            console.log(lobbyName);
            return { status: false, reason: 'Lobby does not exist' };
        }
        else if (lobby.getClientsCount() == 5)
        {
            return { status: false, reason: 'Lobby is full' };
        }
        else
        {
            lobby.addClient(clientID);
            return { status: true }; // Joined lobby successfully
        }
    }

    leaveLobby(lobbyName, clientID)
    {
        const lobby = this.lobbies[lobbyName];
        if (lobby)
        {
            lobby.removeClient(clientID);
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

    getAllLobbyNames()
    {
        return Object.keys(this.lobbies); // Returns an array of lobby names
    }
}

const lobbyManager = new LobbyManager();

module.exports = lobbyManager;