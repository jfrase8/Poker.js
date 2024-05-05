import React from "react";
import GameScreen from "./GameScreen";
import { useParams } from "react-router-dom";

function Match(){
    const { lobbyName } = useParams();

    return (
        <>
            <GameScreen lobbyName={lobbyName}/>
        </>
    );
}


export default Match;