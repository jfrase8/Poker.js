import React from "react";
import Hand from "./Hand.jsx";
import socket from "../socket.js";
import Opponent from "./Opponent.jsx";
import Pot from "./Pot.jsx";
import CommunityCards from "./CommunityCards.jsx";
import ContinueScreen from "./ContinueScreen.jsx";

class GameScreen extends React.Component {
    constructor(props)
    {
        super(props);
        this.state = {
            infoGrabbed: false,
            yourHand: [],
            yourTurnNumber: 1,
            yourName: "",
            yourColor: "",
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
            status: "In",
            showContinue: false,
            continueMessage: "",
        }
        this.toggleContinue = this.toggleContinue.bind(this);
    }
    componentDidMount() {
        socket.emit('grabInfo', this.state.lobbyName);


        socket.on('playerInfo', (hand, yourInfo, opponents, lobbyName) => {
            console.log(yourInfo);
            this.setState({yourHand: hand, yourTurnNumber: yourInfo.turnNumber, yourName: yourInfo.nickname, yourColor: yourInfo.color,
                           chipAmount: yourInfo.chipAmount, currentBet: yourInfo.currentBet, isYourTurn: yourInfo.isYourTurn, lobbyName: lobbyName}, () => {
                            
                            console.log("Player info called");
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
                                    });
                                }
                                // Big Blind
                                else  
                                {
                                    this.setState({role: "Big Blind", currentBet: 20, actionChose:"Big Blind", chipAmount: 1000-20}, () =>
                                    {
                                        this.checkYourTurn()
                                        socket.emit('updateCurrentBet', this.state.lobbyName, this.state.currentBet, this.state.actionChose);
                                    });
                                }
                            }

                            // Set opponents
                            this.setState({opponents: opponents});
                        });
        });
        socket.on('nextTurn', (you, opponents, choice) => {
            console.log("Before:", you.isYourTurn);
            this.setState({isYourTurn: you.isYourTurn, chipAmount: you.chipAmount, currentBet: you.currentBet, opponents: opponents, actionChose: choice, status: you.status}, () => {
                console.log("After:",this.state.isYourTurn);
                this.checkYourTurn();
            });
        });
        socket.on('updateOpponents', (opponents) => {
            this.setState({opponents: opponents}, () => {
                this.checkYourTurn();
            });
        });
        socket.on('updateCommunity', (yourHand) => {
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
            this.setState({communityCards: newCards});

        });
        socket.on('nextRound', (you, opponents, pot) => { 
            this.setState({opponents: opponents, currentBet: "", chipAmount: you.chipAmount, 
                           isYourTurn: you.isYourTurn, actionChose: '', potAmount: pot, numOfBets: 0, status: you.status}, () => {
                this.checkYourTurn();
            });
        });
        socket.on('wonHand', (you, handType, potWon, winners) => {
            // Show continueScreen
            let message = '';
            if (winners.length > 1) {
                let winnerNames = "";
                for (let winner of winners){
                    if (winner[0].nickname !== you.nickname) {
                        if (winnerNames == "") winnerNames.concat(winner[0].nickname);
                        else winnerNames.concat(", " + winner[0].nickname);
                    }
                }
                message = `You split the pot with ${winnerNames} and won ${potWon}`;
            }
            else message = `You won ${potWon} with ${handType}`;

            this.setState({communityCards: [], currentBet: you.currentBet, chipAmount: you.chipAmount, potAmount: 0, role: you.role, 
                           actionChose: you.role, isYourTurn: you.isYourTurn, numOfBets: 0, status: you.status, continueMessage: message,
                           showContinue: true}, () => {
                this.checkYourTurn();
            });
        });
        socket.on('roundOver', (you, winners, handType, potWon) => {
            let shownText = "";
            if (you.actionChose === "fold") shownText = "fold";
            else shownText = you.role;

            let message = "";
            if (winners.length > 1) {
                let winnerNames = "";
                for (let winner of winners){
                    if (winnerNames == "") winnerNames.concat(winner[0].nickname);
                    else winnerNames.concat(", " + winner[0].nickname);
                }
                message = `${winnerNames} split the pot and won ${potWon} each`;
            }
            else message = `${winners[0][0].nickname} won ${potWon} with ${handType}`;
            

            this.setState({communityCards: [], currentBet: you.currentBet, potAmount: 0, role: you.role, actionChose: shownText, 
                           isYourTurn: you.isYourTurn, numOfBets: 0, chipAmount: you.chipAmount, status: you.status,
                           showContinue: true, continueMessage: message}, () => {
                this.checkYourTurn();
            });
        });
        socket.on('updateHand', (yourHand) => {
            this.setState({yourHand: yourHand});
        });
        socket.on('lostGame', () => {
            this.setState({status: "Lost"});
            alert("You lost. You can now spectate.");
        });
        socket.on('wonGame', () => {
            setTimeout(() => {
                alert("You Won!");
            }, 100); // 100 milliseconds delay
            // Do winning things
        });
        socket.on('nextRoundSpectate', (you, opponents, opponentHand, pot) => {
            let cardsToAdd = [];
            // Add cards to the community cards state
            if (opponentHand.length < 6)
            {
                cardsToAdd = [opponentHand[2], opponentHand[3], opponentHand[4]];
            }
            else if (opponentHand.length < 7)
            {
                cardsToAdd.push(opponentHand[5]);
            }
            else {
                cardsToAdd.push(opponentHand[6]);
            }
            let newCards = this.state.communityCards.concat(cardsToAdd);
            this.setState({communityCards: newCards, opponents: opponents, currentBet: "", chipAmount: you.chipAmount, 
                           isYourTurn: you.isYourTurn, actionChose: '', potAmount: pot, numOfBets: 0, status: you.status}, () => {
                this.checkYourTurn();
            });
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
        socket.off('lostGame');
        socket.off('wonGame');
        socket.off('nextRoundSpectate');
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
        // Check if you are able to raise what the last person bet
        for (let opponent of this.state.opponents)
        {
            let totalChips = this.state.currentBet !== "" ? this.state.chipAmount + parseInt(this.state.currentBet): this.state.chipAmount;
            console.log("Total chips:", totalChips);
            console.log("Opponent Bet:", opponent.currentBet);
            if (totalChips <= opponent.currentBet)
            {
                return ["call", "fold"];
            }
                
        }

        // Check if this isn't the first time you have bet this round
        if (this.state.numOfBets > 0)
            return ["call", "raise", "fold"];

        // Check if you currently have highest best
        let highestBet = true;  
        for (let opponent of this.state.opponents)
        {
            if (this.state.currentBet < opponent.currentBet)
            {
                highestBet = false;
            }
                
        }
        // It is first round of betting
        if (this.state.communityCards.length === 0)
        {
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
            if (highestBet)
                return ["check", "bet", "fold"];
            // Someone else has bet
            else
                return ["call", "raise", "fold"];
        }
    }

    toggleContinue(){
        this.setState({showContinue: !this.state.showContinue});
        socket.emit('updateReady');
    }

    render() {
        console.log("Hand:", this.state.yourHand);
        return (
            <>
                <div className="deck"></div>
                <CommunityCards cards={this.state.communityCards}/>
                <div className="communityCards"></div>

                <Hand cards={this.state.yourHand} isYourTurn={this.state.isYourTurn} chipAmount={this.state.chipAmount} 
                             yourName={this.state.yourName} yourColor={this.state.yourColor} choices={this.state.turnChoices} lobbyName={this.state.lobbyName} currentBet={this.state.currentBet}
                             action={this.state.actionChose} currentBlind={this.state.currentBlind} status={this.state.status} 
                             currentChips={this.state.currentBet !== "" ? this.state.chipAmount + parseInt(this.state.currentBet): this.state.chipAmount}/>
                {this.state.opponents.map((opponent, index) => (
                    <Opponent key={index} name={opponent.nickname} turnNumber={opponent.turnNumber} chipAmount={opponent.chipAmount}
                              cssOrderNum={this.opponentCSSorder(opponent.turnNumber)} isYourTurn={opponent.isYourTurn} 
                              currentBet={opponent.currentBet} currentAction={opponent.actionChose} status={opponent.status} color={opponent.color}
                              cards={opponent.initialCards}/>
                ))}
                <Pot potAmount={this.state.potAmount}/>
                <ContinueScreen show={this.state.showContinue} message={this.state.continueMessage} onClose={this.toggleContinue}/>
            </>
        )
    }
}

export default GameScreen;