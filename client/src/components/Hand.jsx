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
        console.log(this.props.yourColor);
        return(
            <>
                <div className={`handArea${this.props.status} ${this.props.isYourTurn ? "yourTurn": "notYourTurn"}`}>
                    <div className='leftOfCards'>
                        <div className='yourBet'>{`${this.props.action} ${this.props.currentBet}`}</div>
                        <div className="yourName" style={{backgroundColor: this.props.yourColor}}>{this.props.yourName}</div>
                        <div className='chipAmount'>{"Chips: " + this.props.chipAmount}</div>
                    </div>
                    <div className='cardArea'>
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