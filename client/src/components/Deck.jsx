import React from "react";
import Hand from "./Hand.jsx";

class Deck extends React.Component {
    constructor(props)
    {
        super(props);
        this.state = {
            cards: [
                {"suit":"clubs", "value":"ace"},
                {"suit":"clubs", "value":"king"},
                {"suit":"clubs", "value":"queen"},
                {"suit":"clubs", "value":"jack"},
                {"suit":"clubs", "value":"10"},
                {"suit":"clubs", "value":"9"},
                {"suit":"clubs", "value":"8"},
                {"suit":"clubs", "value":"7"},
                {"suit":"clubs", "value":"6"},
                {"suit":"clubs", "value":"5"},
                {"suit":"clubs", "value":"4"},
                {"suit":"clubs", "value":"3"},
                {"suit":"clubs", "value":"2"},
                {"suit":"diamonds", "value":"ace"},
                {"suit":"diamonds", "value":"king"},
                {"suit":"diamonds", "value":"queen"},
                {"suit":"diamonds", "value":"jack"},
                {"suit":"diamonds", "value":"10"},
                {"suit":"diamonds", "value":"9"},
                {"suit":"diamonds", "value":"8"},
                {"suit":"diamonds", "value":"7"},
                {"suit":"diamonds", "value":"6"},
                {"suit":"diamonds", "value":"5"},
                {"suit":"diamonds", "value":"4"},
                {"suit":"diamonds", "value":"3"},
                {"suit":"diamonds", "value":"2"},
                {"suit":"hearts", "value":"ace"},
                {"suit":"hearts", "value":"king"},
                {"suit":"hearts", "value":"queen"},
                {"suit":"hearts", "value":"jack"},
                {"suit":"hearts", "value":"10"},
                {"suit":"hearts", "value":"9"},
                {"suit":"hearts", "value":"8"},
                {"suit":"hearts", "value":"7"},
                {"suit":"hearts", "value":"6"},
                {"suit":"hearts", "value":"5"},
                {"suit":"hearts", "value":"4"},
                {"suit":"hearts", "value":"3"},
                {"suit":"hearts", "value":"2"},
                {"suit":"spades", "value":"ace"},
                {"suit":"spades", "value":"king"},
                {"suit":"spades", "value":"queen"},
                {"suit":"spades", "value":"jack"},
                {"suit":"spades", "value":"10"},
                {"suit":"spades", "value":"9"},
                {"suit":"spades", "value":"8"},
                {"suit":"spades", "value":"7"},
                {"suit":"spades", "value":"6"},
                {"suit":"spades", "value":"5"},
                {"suit":"spades", "value":"4"},
                {"suit":"spades", "value":"3"},
                {"suit":"spades", "value":"2"}
            ],
            dealtHand: []
        }
        this.dealHand = this.dealHand.bind(this);
    }
    componentDidMount() {
        // Deal a hand when the component mounts
        this.dealHand();
    }
    shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }
    // Creates a new card hand
    dealHand()
    {
        let shuffledDeck = this.shuffleDeck(this.state.cards.slice());
        let hand = [shuffledDeck.pop(), shuffledDeck.pop()];
        this.setState({ cards: shuffledDeck, dealtHand: hand });
    }
    render() {
        return (
            <>
                <div className="deck">Deck</div>
                <Hand cards={this.state.dealtHand}/>
                <button onClick={this.dealHand}>Deal Hand</button>
            </>
        )
    }
}

export default Deck;