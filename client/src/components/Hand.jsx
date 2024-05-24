import React from 'react';
import Card from './Card';
import TurnChoices from './TurnChoices';

class Hand extends React.Component {
    // Default properties for a poker hand
    constructor(props) {
        super(props);
        this.state = {
            maxHandSize: 2,
            winPercent: 0.0,
        };
    }
    render() {
        let borderColor = "red";
        if (this.props.status !== "Folded" && this.props.isYourTurn) borderColor = "lightgreen";
        else if (this.props.status === "Folded") borderColor = "gray";
        return(
            <>
                <div className={`handArea${this.props.status}`} style={{outline: `5px solid ${borderColor}`}}>
                    <div className='leftOfCards'>
                        <div className='yourBet'>{`${this.props.action} ${this.props.currentBet}`}</div>
                        <div className="yourName" style={{backgroundColor: this.props.status !== "Folded" ? this.props.yourColor: "gray"}}>{this.props.yourName}</div>
                        <div className='chipAmount'>{"Chips: " + this.props.chipAmount}</div>
                    </div>
                    <div className='cardArea' style={{opacity: this.props.status !== "Folded" ? 1.0: 0.25}}>
                        {this.props.cards.map((card, index) => (<Card key={index} suit={card.suit} value={card.value} background={card.imageURL}/>))}
                    </div>
                    <div className='rightOfCards'>
                        <TurnChoices lobbyName={this.props.lobbyName} choices={this.props.choices} currentBlind={this.props.currentBlind} currentChips={this.props.currentChips}/>
                    </div>
                </div>
            </>
        )
    }
}

export default Hand;