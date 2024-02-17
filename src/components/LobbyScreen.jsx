import React from 'react';

class LobbyScreen extends React.Component {

    constructor(props){
        super(props);
        this.state = {
            lobbies: [
                // None at first
            ]
        }
    }
    render()
    {
        const createLobby = (lobbyName) => {
            const newLobbyList = this.state.lobbies;
            newLobbyList.push({name: lobbyName});
            this.setState({lobbies: newLobbyList});
        }
        const joinLobby = (lobbyName) => {
            console.log(lobbyName);
        }

        return(
            <>
                <div className="lobbyScreen">
                    <button className='createLobby' onClick={() => createLobby("Joel")}>Create Lobby</button>
                    <ul>
                        {this.state.lobbies.map((lobby, index) => (<li><button onClick={() => joinLobby(lobby.name)}>{lobby.name}</button></li>))} 
                    </ul>
                </div>
            </>
        )
    }   
}

export default LobbyScreen;