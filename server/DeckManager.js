class DeckManager {
    constructor(cards = [new Card("clubs", "ace"),
                         new Card("clubs", "king"),
                         new Card("clubs", "queen"),
                         new Card("clubs", "jack"),
                         new Card("clubs", "10"),
                         new Card("clubs", "9"),
                         new Card("clubs", "8"),
                         new Card("clubs", "7"),
                         new Card("clubs", "6"),
                         new Card("clubs", "5"),
                         new Card("clubs", "4"),
                         new Card("clubs", "3"),
                         new Card("clubs", "2"),
                         new Card("hearts", "ace"),
                         new Card("hearts", "king"),
                         new Card("hearts", "queen"),
                         new Card("hearts", "jack"),
                         new Card("hearts", "10"),
                         new Card("hearts", "9"),
                         new Card("hearts", "8"),
                         new Card("hearts", "7"),
                         new Card("hearts", "6"),
                         new Card("hearts", "5"),
                         new Card("hearts", "4"),
                         new Card("hearts", "3"),
                         new Card("hearts", "2"),
                         new Card("diamonds", "ace"),
                         new Card("diamonds", "king"),
                         new Card("diamonds", "queen"),
                         new Card("diamonds", "jack"),
                         new Card("diamonds", "10"),
                         new Card("diamonds", "9"),
                         new Card("diamonds", "8"),
                         new Card("diamonds", "7"),
                         new Card("diamonds", "6"),
                         new Card("diamonds", "5"),
                         new Card("diamonds", "4"),
                         new Card("diamonds", "3"),
                         new Card("diamonds", "2"),
                         new Card("spades", "ace"),
                         new Card("spades", "king"),
                         new Card("spades", "queen"),
                         new Card("spades", "jack"),
                         new Card("spades", "10"),
                         new Card("spades", "9"),
                         new Card("spades", "8"),
                         new Card("spades", "7"),
                         new Card("spades", "6"),
                         new Card("spades", "5"),
                         new Card("spades", "4"),
                         new Card("spades", "3"),
                         new Card("spades", "2"),], dealtHands = []){
        this.cards = cards;
        this.dealtHands = dealtHands;
    }
    shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }
    // Creates a new card hand
    dealHands(players)
    {
        let shuffledDeck = this.shuffleDeck(this.cards);
        for (let player of players) {
            let hand = [shuffledDeck.pop(), shuffledDeck.pop()];
            this.dealtHands.push(new Hand(player, hand));
        }
    }
    dealFlop() {
        let flop = [shuffledDeck.pop(), shuffledDeck.pop(), shuffledDeck.pop()];
        for (let hand of this.dealtHands) {
            hand = hand.cards.concat(flop);
        }
    }
    dealTurnRiver() {
        for (let hand of this.dealtHands) {
            hand.cards.push(this.shuffleDeck.pop());
        }
    }
    getPlayerHand(player) {
        console.log("checking player: " + player);
        for (let hand of this.dealtHands) {
            if (hand.player.id == player.id)
            {
                console.log("Found hand");
                return hand.cards;
            }
                
        }
    }
}

class Card {
    constructor(suit, value){
        this.suit = suit;
        this.value = value;
    }
}

class Hand {
    constructor(player, cards) {
        this.player = player;
        this.cards = cards;
    }
}

module.exports = {DeckManager, Hand, Card};