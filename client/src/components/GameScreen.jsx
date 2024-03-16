import React from "react";
import Hand from "./Hand.jsx";
import socket from "../socket.js";
import Opponent from "./Opponent.jsx";
import TurnChoices from "./TurnChoices.jsx";

class GameScreen extends React.Component {
    constructor(props)
    {
        super(props);
        this.state = {
            yourHand: [],
            yourTurnNumber: 1,
            yourName: "",
            opponents: [],
            isYourTurn: false,
            chipAmount: 0,
            currentBet: 0,
            flop: null,
            turnCard: null,
            riverCard: null,
            numOfBets: 0,
        }
    }
    componentDidMount() {
        socket.on('playerInfo', (hand, yourInfo) => {
            this.setState({yourHand: hand, yourTurnNumber: yourInfo.turnNumber, yourName: yourInfo.nickname, 
                           isYourTurn: yourInfo.isYourTurn, chipAmount: yourInfo.chipAmount, currentBet: yourInfo.currentBet});
        });
        socket.on('opponentsInfo', (opponents) => {
            this.setState({opponents: opponents});
            console.log(opponents);
        });
        socket.on('yourTurn', () =>{
            console.log("It is your turn!");
            this.setState({isYourTurn: true});
        })
    }
    componentWillUnmount() {
        // Remove event listeners when the component unmounts
        socket.off('playerInfo');
        socket.off('opponentsInfo');
        socket.off();
    }

    opponentCSSorder(opponentTurnNumber){
        const cssNumbers = {
            "1-2": 1,
            "2-3": 1,
            "3-4": 1,
            "4-5": 1,
            "5-1": 1,

            "1-3": 2,
            "2-4": 2,
            "3-5": 2,
            "4-1": 2,
            "5-2": 2,

            "1-4": 3,
            "2-5": 3,
            "3-1": 3,
            "4-2": 3,
            "5-3": 3,

            "1-5": 4,
            "2-1": 4,
            "3-2": 4,
            "4-3": 4,
            "5-4": 4,
        }
        let key = this.state.yourTurnNumber + '-' + opponentTurnNumber;
        return cssNumbers[key];
    }

    determineTurnChoices(){

        // Check if this isn't the first time you have bet this round
        if (this.state.numOfBets > 0)
            return ["Call", "Raise", "Fold"];

        // Check if you currently have highest best
        highestBet = true;  
        for (let opponent in this.state.opponents)
        {
            if (currentBet < opponent.currentBet)
                highestBet = false;
        }

        // It is first round of betting
        if (this.state.flop === null)
        {
            // You are the big blind
            if (this.state.yourTurnNumber == 3)
            {
                // Big blind is the highest bet amount
                if (highestBet)
                    return ["check", "raise", "fold"];
                else
                    return ["call", "raise", "fold"];
            } 
            // Everyone else can only call, raise or fold
            else
                return ["call", "raise", "fold"];
        }
        // It is after the flop
        else
        {
            // You are first to bet or everyone else has checked so far
            if (this.state.yourTurnNumber == 2 || highestBet)
                return ["check", "bet", "fold"];
            // Someone else has bet
            else
                return ["Call", "Raise", "Fold"];
        }
    }

    render() {
        let turnChoices = [];
        if (this.state.isYourTurn)
        {
            turnChoices = determineTurnChoices();
            this.setState({numOfBets: numOfBets+1});
        }
        return (
            <>
                <div className="deck"></div>
                <Hand cards={this.state.yourHand} isYourTurn={this.state.isYourTurn} chipAmount={this.state.chipAmount} yourName={this.state.yourName}/>
                <TurnChoices choices={turnChoices}/>
                {this.state.opponents.map((opponent, index) => (
                    <Opponent key={index} name={opponent.nickname} turnNumber={opponent.turnNumber} chipAmount={opponent.chipAmount}
                              cssOrderNum={this.opponentCSSorder(opponent.turnNumber)} isYourTurn={opponent.isYourTurn} 
                              currentBet={opponent.currentBet}/>
                ))}
            </>
        )
    }
}

export default GameScreen;