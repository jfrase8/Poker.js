import React from "react";
import RedirectButton from "./RedirectButton";

function Title(props) {
    return <div className="title" data-text={props.text}>{props.text}</div>
}

function Subtitle(props) {
    return <div className="subTitle">{props.text}</div>
}

function Home(){

    return (
        <>
            <Title text="Poker.js"/>
            <Subtitle text="Online Texas Holdem"/>
            <RedirectButton id="play" to="/LobbyScreen" label="Play" />
        </>
    )
}

export default Home;