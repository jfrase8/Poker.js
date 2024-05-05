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
            communityCards: [],
            numOfBets: 0,
            role: "",
            turnChoices: [],
            lobbyName: this.props.lobbyName,
            actionChose: "",
            potAmount: 0,
            currentBlind: 20,
        }
    }
    componentDidMount() {
        socket.emit('grabInfo', this.state.lobbyName);

        socket.on('playerInfo', (hand, yourInfo, opponents, lobbyName) => {
            this.setState({yourHand: hand, yourTurnNumber: yourInfo.turnNumber, yourName: yourInfo.nickname, 
                           chipAmount: yourInfo.chipAmount, currentBet: yourInfo.currentBet, isYourTurn: yourInfo.isYourTurn, lobbyName: lobbyName}, () => {
                            // Set your roll for a 3+ player game
                            if (opponents.length > 1)
                            {
                                // Small Blind
                                if (this.state.yourTurnNumber === 2)
                                {
                                    this.setState({role: "Small Blind", currentBet:10, actionChose:"Small Blind", chipAmount: 1000-10}, () => 
                                    {
                                        this.checkYourTurn();
                                        socket.emit('updateCurrentBet', this.state.lobbyName, this.state.currentBet, this.state.actionChose);
                                        socket.emit('updateRole', this.state.role);
                                    });
                                }
                                // Big Blind
                                else if (this.state.yourTurnNumber === 3)
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
                                // Small Blind
                                if (this.state.yourTurnNumber === 1)
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
            let cardsToAdd = [];
            // Add cards to the community cards state
            if (yourHand.length < 6)
            {
                cardsToAdd = [yourHand[2], yourHand[3], yourHand[4]];
            }
            else if (yourHand.length < 7)
            {
                cardsToAdd.push(yourHand[5]);
            }
            else {
                cardsToAdd.push(yourHand[6]);
            }
            let newCards = this.state.communityCards.concat(cardsToAdd);
            this.setState({communityCards: newCards, opponents: opponents, currentBet: "", chipAmount: you.chipAmount, 
                           isYourTurn: you.isYourTurn, actionChose: '', potAmount: pot, numOfBets: 0}, () => {
                this.checkYourTurn();
            });
        });
        socket.on('wonHand', (you, handType) => {
            let currentBet = this.state.opponents.currentBet;
            if (currentBet === '') currentBet = 0;
            if (handType != null) alert("You won with " + handType);
            else alert("You won because everyone folded");
            this.setState({communityCards: [], currentBet: you.currentBet, chipAmount: you.chipAmount, potAmount: 0, role: you.role, 
                           actionChose: you.role, isYourTurn: you.isYourTurn, numOfBets: 0}, () => {
                this.checkYourTurn();
            });
        });
        socket.on('roundOver', (you) => {
            let shownText = "";
            if (you.actionChose === "fold") shownText = "fold";
            else shownText = you.role;
            this.setState({communityCards: [], currentBet: you.currentBet, potAmount: 0, role: you.role, actionChose: shownText, 
                           isYourTurn: you.isYourTurn, numOfBets: 0, chipAmount: you.chipAmount}, () => {
                alert("You lost this hand.");
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
        socket.off('winner');
    }

    checkYourTurn() {
        console.log("checking turn");
        // Check if its your turn
        if (this.state.isYourTurn)
        {
            console.log("Is your turn");
            console.log("# of bets: ", this.state.numOfBets);
            this.setState({turnChoices: this.determineTurnChoices()});
            this.setState({numOfBets: this.state.numOfBets+1});
        }
        else {
            console.log("Not your turn");
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
        if (this.state.opponents.length === 4)
            return cssNumbersWith5[key];
        if (this.state.opponents.length === 3)
            return cssNumbersWith4[key];
        if (this.state.opponents.length === 2)
            return cssNumbersWith3[key];
        else
            return cssNumbersWith2[key];
    }

    determineTurnChoices(){

        console.log("Determining Choices");
        console.log("# of bets: ", this.state.numOfBets);
        // Check if this isn't the first time you have bet this round
        if (this.state.numOfBets > 0)
            return ["call", "raise", "fold"];

        // Check if you currently have highest best
        let highestBet = true;  
        for (let opponent of this.state.opponents)
        {
            console.log(opponent);
            if (this.state.currentBet < opponent.currentBet)
            {
                console.log(this.state.currentBet, opponent.currentBet);
                highestBet = false;
                console.log("happened");
            }
                
        }
        console.log(this.state.communityCards.length);
        // It is first round of betting
        if (this.state.communityCards.length === 0)
        {
            console.log("Community cards: " + this.state.communityCards.length);
            // You are the big blind
            if (this.state.role === "Big Blind")
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
            console.log(highestBet);
            if (highestBet)
                return ["check", "bet", "fold"];
            // Someone else has bet
            else
                return ["call", "raise", "fold"];
        }
    }

    render() {
        console.log(this.state.yourHand);
        return (
            <>
                <div className="deck"></div>
                <CommunityCards cards={this.state.communityCards}/>
                <div className="communityCards"></div>
                <Hand cards={this.state.yourHand} isYourTurn={this.state.isYourTurn} chipAmount={this.state.chipAmount} 
                             yourName={this.state.yourName} choices={this.state.turnChoices} lobbyName={this.state.lobbyName} currentBet={this.state.currentBet}
                             action={this.state.actionChose} currentBlind={this.state.currentBlind} />
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