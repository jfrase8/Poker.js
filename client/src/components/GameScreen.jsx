import React from "react";
import Hand from "./Hand.jsx";
import socket from "../socket.js";
import Opponent from "./Opponent.jsx";
import Pot from "./Pot.jsx";
import CommunityCards from "./CommunityCards.jsx";

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
            currentBet: "",
            flop: null,
            turnCard: null,
            riverCard: null,
            numOfBets: 0,
            role: "",
            turnChoices: [],
            lobbyName: "",
            actionChose: "",
            potAmount: 0,
        }
    }
    componentDidMount() {
        socket.on('playerInfo', (hand, yourInfo, opponents, lobbyName) => {
            this.setState({yourHand: hand, yourTurnNumber: yourInfo.turnNumber, yourName: yourInfo.nickname, 
                           chipAmount: yourInfo.chipAmount, currentBet: yourInfo.currentBet, isYourTurn: yourInfo.isYourTurn, lobbyName: lobbyName}, () => {
                            // Set your roll for a 3+ player game
                            if (opponents.length > 1)
                            {
                                // Host is dealer
                                if (this.state.yourTurnNumber == 1)
                                    this.setState({role: "Dealer"}, () => {this.checkYourTurn(); socket.emit('updateRole', this.state.role)});
                                // Small Blind
                                else if (this.state.yourTurnNumber == 2)
                                {
                                    this.setState({role: "Small Blind", currentBet:10, actionChose:"Small Blind", chipAmount: 1000-10}, () => 
                                    {
                                        this.checkYourTurn();
                                        socket.emit('updateCurrentBet', this.state.lobbyName, this.state.currentBet, this.state.actionChose);
                                        socket.emit('updateRole', this.state.role);
                                    });
                                }
                                // Big Blind
                                else if (this.state.yourTurnNumber == 3)
                                {
                                    this.setState({role: "Big Blind", currentBet: 20, actionChose:"Big Blind", chipAmount: 1000-20}, () => 
                                    {
                                        this.checkYourTurn();
                                        socket.emit('updateCurrentBet', this.state.lobbyName, this.state.currentBet, this.state.actionChose);
                                        socket.emit('updateRole', this.state.role);
                                    });
                                }
                                // No role
                                else
                                    this.checkYourTurn();
                            }
                            // Set your role for a 2 player game
                            else
                            {
                                // Small Blind and Dealer
                                if (this.state.yourTurnNumber == 1)
                                {
                                    this.setState({role: "Small Blind", currentBet: 10, actionChose:"Small Blind", chipAmount: 1000-10}, () => 
                                    {
                                        this.checkYourTurn();
                                        socket.emit('updateCurrentBet', this.state.lobbyName, this.state.currentBet, this.state.actionChose);
                                        socket.emit('updateRole', this.state.role);
                                    });
                                }
                                // Big Blind
                                else  
                                {
                                    this.setState({role: "Big Blind", currentBet: 20, actionChose:"Big Blind", chipAmount: 1000-20}, () =>
                                    {
                                        this.checkYourTurn()
                                        socket.emit('updateCurrentBet', this.state.lobbyName, this.state.currentBet, this.state.actionChose);
                                        socket.emit('updateRole', this.state.role);
                                    });
                                }
                            }

                            // Set opponents
                            this.setState({opponents: opponents});
                        });
        });
        socket.on('nextTurn', (you, opponents, choice) => {
            this.setState({isYourTurn: you.isYourTurn, chipAmount: you.chipAmount, currentBet: you.currentBet, opponents: opponents, actionChose: choice}, () => {
                this.checkYourTurn();
                console.log("Opponents: " + this.state.opponents[0].actionChose);
                console.log("You: " + this.state.actionChose);
            });
        });
        socket.on('updateOpponents', (opponents) => {
            this.setState({opponents: opponents});
        });
        socket.on('nextRound', (yourHand, you, opponents, pot) => {
            // Split your hand into your two cards and the flop/turn/river cards
            if (yourHand.length < 6)
            {
                let flop = [yourHand[2], yourHand[3], yourHand[4]];
                this.setState({flop: flop});
            }
            else if (yourHand.length < 7)
            {
                let turn = yourHand[5];
                this.setState({turnCard: turn});
            }
            else {
                let river = yourHand[6];
                this.setState({riverCard: river});
            }
            this.setState({opponents: opponents, currentBet: "", chipAmount: you.chipAmount, isYourTurn: you.isYourTurn, actionChose: '', potAmount: pot}, () => {
                this.checkYourTurn();
            });
        });
        socket.on('wonHand', (you) => {
            console.log("You won: " + this.state.potAmount + this.state.opponents.currentBet);
            this.setState({flop: null, turnCard: null, riverCard: null, currentBet: you.currentBet, chipAmount: you.chipAmount, potAmount: 0, role: you.role, 
                           actionChose: you.role, isYourTurn: you.isYourTurn, numOfBets: 0, chipAmount: you.chipAmount}, () => {
                this.checkYourTurn();
            });
        });
        socket.on('roundOver', (you) => {
            this.setState({flop: null, turnCard: null, riverCard: null, currentBet: you.currentBet, potAmount: 0, role: you.role, actionChose: you.role, 
                           isYourTurn: you.isYourTurn, numOfBets: 0, chipAmount: you.chipAmount}, () => {
                this.checkYourTurn();
            });
        });
        socket.on('updateHand', (yourHand) => {
            this.setState({yourHand: yourHand});
        });
    }
    componentWillUnmount() {
        // Remove event listeners when the component unmounts
        socket.off('playerInfo');
        socket.off('nextTurn');
        socket.off('updateBet');
        socket.off('wonHand');
        socket.off('roundOver');
        socket.off('updateHand');
        
    }

    checkYourTurn() {
        // Check if its your turn
        if (this.state.isYourTurn)
        {
            this.setState({turnChoices: this.determineTurnChoices()});
            this.setState({numOfBets: this.state.numOfBets+1});
        }
        else {
            this.setState({turnChoices: []});
        }
    }

    opponentCSSorder(opponentTurnNumber){
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
                <CommunityCards flop={this.state.flop} turnCard={this.state.turnCard} riverCard={this.state.riverCard}/>
                <div className="communityCards"></div>
                <Hand cards={this.state.yourHand} isYourTurn={this.state.isYourTurn} chipAmount={this.state.chipAmount} 
                             yourName={this.state.yourName} choices={this.state.turnChoices} lobbyName={this.state.lobbyName} currentBet={this.state.currentBet}
                             action={this.state.actionChose}/>
                {this.state.opponents.map((opponent, index) => (
                    <Opponent key={index} name={opponent.nickname} turnNumber={opponent.turnNumber} chipAmount={opponent.chipAmount}
                              cssOrderNum={this.opponentCSSorder(opponent.turnNumber)} isYourTurn={opponent.isYourTurn} 
                              currentBet={opponent.currentBet} currentAction={opponent.actionChose}/>
                ))}
                <Pot potAmount={this.state.potAmount}/>

            </>
        )
    }
}

export default GameScreen;