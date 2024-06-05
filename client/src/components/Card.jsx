import React from 'react';

class Card extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            reveal1: {},
            reveal2: {},
        };
    }
    // Props inherited from Parent: suit, value, cardType
    componentDidMount(){
        this.setState({reveal1: {animation: 'reveal 1s forwards'}});
        setTimeout(() => {
            this.setState({reveal2: {backgroundImage: `url("../Cards/${this.props.value}_of_${this.props.suit}.png")`, animation: 'reveal 1s forwards'}});
        }, 1000);
    }
    render() {
        return(
            <>
                <div className='card' style={this.state.reveal1}>
                    <div className='card' style={this.state.reveal2}></div>
                </div>
            </>
        )
    }
}

export default Card;