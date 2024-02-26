import React from 'react';

class Card extends React.Component {
    // Props inherited from Parent: suit, value
    state = {
        imageUrl: `Cards/${this.props.value}_of_${this.props.suit}.png`
    };
    render() {
        console.log(this.state.imageUrl);
        return(
            <>
                <div className="card" style={{backgroundImage: `url("Cards/${this.props.value}_of_${this.props.suit}.png")`}}>
                    <div className="cardSuit"></div>
                    <div className="cardValue"></div>
                </div>
            </>
        )
    }
}

export default Card;