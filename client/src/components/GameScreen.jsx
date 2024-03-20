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
            role: null,
            turnChoices: null,
        }
    }
    componentDidMount() {
        socket.on('playerInfo', (hand, yourInfo, opponents) => {
            this.setState({yourHand: hand, yourTurnNumber: yourInfo.turnNumber, yourName: yourInfo.nickname, 
                           chipAmount: yourInfo.chipAmount, currentBet: yourInfo.currentBet, isYourTurn: yourInfo.isYourTurn}, () => {
                            // Set your roll
                            if (opponents.length > 1)
                            {
                                if (this.state.yourTurnNumber == 1)
                                    this.setState({role: "Dealer"}, () => {this.checkYourTurn()});
                                else if (this.state.yourTurnNumber == 2) 
                                    this.setState({role: "Small Blind"}, () => {this.checkYourTurn()});
                                else if (this.state.yourTurnNumber == 3) 
                                    this.setState({role: "Big Blind"}, () => {this.checkYourTurn()});
                                else
                                    this.checkYourTurn();
                            }
                            else
                            {
                                if (this.state.yourTurnNumber == 1) this.setState({role: "Small Blind Dealer"}, () => {this.checkYourTurn()});
                                else this.setState({role: "Big Blind"}, () => {this.checkYourTurn()});
                            }

                            // Set opponents
                            this.setState({opponents: opponents});
                        });
        });
    }
    componentWillUnmount() {
        // Remove event listeners when the component unmounts
        socket.off('playerInfo');
    }

    checkYourTurn() {
        // Check if its your turn
        if (this.state.isYourTurn)
        {
            this.setState({turnChoices: this.determineTurnChoices()});
            this.setState({numOfBets: this.state.numOfBets+1});
        }
    }

    opponentCSSorder(opponentTurnNumber){
        console.log(this.state.yourTurnNumber);
        const cssNumbersWith5 = {
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
        const cssNumbersWith4 = {
            "1-2": 1,
            "2-3": 1,
            "3-4": 1,
            "4-1": 1,

            "1-3": 2,
            "2-4": 2,
            "3-1": 2,
            "4-2": 2,

            "1-4": 3,
            "2-1": 3,
            "3-2": 3,
            "4-3": 3,
        }
        const cssNumbersWith3 = {
            "1-2": 1,
            "2-3": 1,
            "3-1": 1,

            "1-3": 2,
            "2-1": 2,
            "3-2": 2,
        }
        const cssNumbersWith2 = {
            "1-2": 1,
            "2-1": 1,
        }
        let key = this.state.yourTurnNumber + '-' + opponentTurnNumber;
        if (this.state.opponents.length == 4)
            return cssNumbersWith5[key];
        if (this.state.opponents.length == 3)
            return cssNumbersWith4[key];
        if (this.state.opponents.length == 2)
            return cssNumbersWith3[key];
        else
            return cssNumbersWith2[key];
    }

    determineTurnChoices(){

        console.log(this.state.role);

        // Check if this isn't the first time you have bet this round
        if (this.state.numOfBets > 0)
            return ["Call", "Raise", "Fold"];

        // Check if you currently have highest best
        let highestBet = true;  
        for (let opponent in this.state.opponents)
        {
            if (this.state.currentBet < opponent.currentBet)
                highestBet = false;
        }

        // It is first round of betting
        if (this.state.flop === null)
        {
            // You are the big blind
            if (this.state.role == "Big Blind")
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
            if (this.state.role.contains("Small Blind") || highestBet)
                return ["check", "bet", "fold"];
            // Someone else has bet
            else
                return ["Call", "Raise", "Fold"];
        }
    }

    render() {
        console.log(this.state.turnChoices);
        return (
            <>
                <div className="deck"></div>
                <Hand cards={this.state.yourHand} isYourTurn={this.state.isYourTurn} chipAmount={this.state.chipAmount} yourName={this.state.yourName}/>
                
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