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
        console.log(this.props.cards);
        return(
            <>
                <div className='handArea'>
                    <div className='leftOfCards'>
                        <div className='yourName'>{this.props.yourName}</div>
                        <div className='chipAmount'>{"Chips: " + this.props.chipAmount}</div>
                    </div>
                    <div className='cardArea'>
                        {this.props.cards.map((card, index) => (<Card key={index} suit={card.suit} value={card.value} background={card.imageURL}/>))}
                    </div>
                </div>
            </>
        )
    }
}

export default Hand;