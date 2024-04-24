class DeckManager {
    constructor(cards = [
                    new Card("clubs", "ace"),new Card("clubs", "king"),new Card("clubs", "queen"),new Card("clubs", "jack"),new Card("clubs", "10"),new Card("clubs", "9"),new Card("clubs", "8"),new Card("clubs", "7"),new Card("clubs", "6"),new Card("clubs", "5"),new Card("clubs", "4"),new Card("clubs", "3"),new Card("clubs", "2"),
                    new Card("hearts", "ace"),new Card("hearts", "king"),new Card("hearts", "queen"),new Card("hearts", "jack"),new Card("hearts", "10"),new Card("hearts", "9"),new Card("hearts", "8"),new Card("hearts", "7"),new Card("hearts", "6"),new Card("hearts", "5"),new Card("hearts", "4"),new Card("hearts", "3"),new Card("hearts", "2"),
                    new Card("diamonds", "ace"),new Card("diamonds", "king"),new Card("diamonds", "queen"),new Card("diamonds", "jack"),new Card("diamonds", "10"),new Card("diamonds", "9"),new Card("diamonds", "8"),new Card("diamonds", "7"),new Card("diamonds", "6"),new Card("diamonds", "5"),new Card("diamonds", "4"),new Card("diamonds", "3"),new Card("diamonds", "2"),
                    new Card("spades", "ace"),new Card("spades", "king"),new Card("spades", "queen"),new Card("spades", "jack"),new Card("spades", "10"),new Card("spades", "9"),new Card("spades", "8"),new Card("spades", "7"), new Card("spades", "6"),new Card("spades", "5"),new Card("spades", "4"),new Card("spades", "3"),new Card("spades", "2"),
                ],
                deckDefault = [
                    new Card("clubs", "ace"),new Card("clubs", "king"),new Card("clubs", "queen"),new Card("clubs", "jack"),new Card("clubs", "10"),new Card("clubs", "9"),new Card("clubs", "8"),new Card("clubs", "7"),new Card("clubs", "6"),new Card("clubs", "5"),new Card("clubs", "4"),new Card("clubs", "3"),new Card("clubs", "2"),
                    new Card("hearts", "ace"),new Card("hearts", "king"),new Card("hearts", "queen"),new Card("hearts", "jack"),new Card("hearts", "10"),new Card("hearts", "9"),new Card("hearts", "8"),new Card("hearts", "7"),new Card("hearts", "6"),new Card("hearts", "5"),new Card("hearts", "4"),new Card("hearts", "3"),new Card("hearts", "2"),
                    new Card("diamonds", "ace"),new Card("diamonds", "king"),new Card("diamonds", "queen"),new Card("diamonds", "jack"),new Card("diamonds", "10"),new Card("diamonds", "9"),new Card("diamonds", "8"),new Card("diamonds", "7"),new Card("diamonds", "6"),new Card("diamonds", "5"),new Card("diamonds", "4"),new Card("diamonds", "3"),new Card("diamonds", "2"),
                    new Card("spades", "ace"),new Card("spades", "king"),new Card("spades", "queen"),new Card("spades", "jack"),new Card("spades", "10"),new Card("spades", "9"),new Card("spades", "8"),new Card("spades", "7"), new Card("spades", "6"),new Card("spades", "5"),new Card("spades", "4"),new Card("spades", "3"),new Card("spades", "2"),
                ],  
                dealtHands = [], 
                pot = 0){
        this.cards = cards;
        this.dealtHands = dealtHands;
        this.pot = pot;
        this.deckDefault = deckDefault;
        this.hierarchy = ["Royal Flush", "Four of a Kind", "Straight Flush", "Full House", "Flush", "Straight", 
                          "Three of a Kind", "Two Pair", "One Pair", "High Card"];
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
        // Get rid of one card for burn card
        let burnCard = this.cards.pop();
        let flop = [this.cards.pop(), this.cards.pop(), this.cards.pop()];
        this.dealtHands.forEach(hand => { hand.cards = hand.cards.concat(flop); });
    }
    dealTurnRiver() {
        // Get rid of one card for burn card
        let burnCard = this.cards.pop();
        let turnRiver = this.cards.pop();
        this.dealtHands.forEach(hand => { hand.cards.push(turnRiver) });
    }
    getPlayerHand(player) {
        for (let hand of this.dealtHands) {
            if (hand.player.id == player.id)
            {
                console.log("Found hand");
                return hand;
            }
                
        }
    }
    resetDeck() {
        this.cards = this.deckDefault;
        this.dealtHands = [];
        this.pot = 0;
    }
    findWinner(lobbyName, lobbyManager) {
        let lobby = lobbyManager.getLobby(lobbyName);

        let handChecker = new HandChecker();

        let bestHands = {};        
        let madeHands = {};

        for (let hand of this.dealtHands)
        {
            if (hand.player.status != 'folded')
            {
                let handType = handChecker.checkHandType(hand);
                console.log(`${hand.player.nickname} Hand Type: `, handType);
                madeHands[hand.player] = handType;
            }
        }
        let handType = handChecker.checkHandType(new Hand(lobby.clients[0], [new Card("spades", "ace"), new Card("spades", "king"), new Card("spades", "queen"), new Card("spades", "jack"), 
                                                                             new Card("hearts", "9"), new Card("spades", "10"), new Card("spades", "5")]));
        console.log("Made up hand: ", handType);

        for (let type of this.hierarchy) {
            Object.keys(madeHands).forEach(key => {
                if (madeHands[key] == type) bestHands[key] = lobby.deck.getPlayerHand(key);
            });
            let numHands = Object.keys(bestHands).length;
            // If multiple people have the same hand, compare those hands to get the best
            if (numHands > 1){
                let tiebreakers = [];
                Object.keys(bestHands).forEach(key => {
                    tiebreakers.push(handChecker.getTieBreaker(handChecker, bestHands[key], madeHands[key]));
                });
                handChecker.compareHands(hands, type);
            }
            // If anyone has a hand of this type, they win with the best hand
            else if (numHands == 1) return [Object.keys(bestHands)[0], type];
        }
    }
}

class HandChecker {
    constructor(){
        this.conversions = {
            "king": 13,
            "queen": 12,
            "jack": 11,
        }
        this.straightTieBreakers = {}
    }
    checkHandType(hand) {
        let handHierarchy = {
            "Royal Flush": false, 
            "Four of a Kind": false, 
            "Straight Flush": false, 
            "Full House": false, 
            "Flush": false, 
            "Straight": false,
            "Three of a Kind": false,
            "Two Pair": false,
            "One Pair": false,
            "High Card": false,
        }
        let handSuits = []
        let handValues = []
        let nutStraight = false;
        let aceCount = 0;

        // Turn hand into its suits and values arrays
        hand.cards.forEach(card => {
            if (card.value != "ace")
            {
                let cardValueCopy = card.value;
        
                // Convert any card values to numbers
                if (this.conversions.hasOwnProperty(card.value)) cardValueCopy = this.conversions[card.value];
                handValues.push(parseInt(cardValueCopy));
            }
            else {
                aceCount++;
            }
            handSuits.push(card.suit);
        });
        handValues.sort((a, b) => a - b);

        // Check 4 of a kind, 3 of a kind, 2 pair, and pair
        let valueFreq = {};
        valueFreq["ace"] = aceCount;
        handValues.forEach(value => {
            if (!valueFreq[value]) valueFreq[value] = 1;
            else valueFreq[value]++;
        });
        // Variable to check for two pair
        let pairCount = 0;

        Object.keys(valueFreq).forEach(key => {
            if (valueFreq[key] == 2)
            {
                handHierarchy["One Pair"] = true;
                pairCount++;
                if (pairCount == 2) handHierarchy["Two Pair"] = true;
            }
            else if (valueFreq[key] == 3) handHierarchy["Three of a Kind"] = true;
            else if (valueFreq[key] == 4) handHierarchy["Four of a Kind"] = true;
        });
        // Check full house
        if (handHierarchy["Three of a Kind"] == true && handHierarchy["One Pair"] == true)
            handHierarchy["Full House"] = true;


        // Remove aces before checking for straights
        delete valueFreq.ace;

        // Check for straight and flush only if the player cannot make a four of a kind or full house
        if (handHierarchy["Four of a Kind"] == false && handHierarchy["Full House"] == false)
        {
            // Check for a straight
            let straight = [];
            let lastNum = -100;
            if (aceCount > 0)
            {
                
                lastNum = 1;
                straight.push(1);
                for (let i = 0; i < handValues.length; i++)
                {
                    console.log("Last number added:", lastNum);
                    console.log("Current Straight:", straight);

                    if (handValues[i] == lastNum+1) straight.push(handValues[i]);
                    else {
                        if (straight.length >= 5) break;
                        else {
                            straight = [];
                            straight.push(handValues[i]);
                        }
                    }

                    lastNum = handValues[i];

                }
                // Check ace as last value
                if (straight[straight.length-1] == 13) straight.push("ace");
            }
            else {
                for (let i = 0; i < 7; i++)
                {
                    if (handValues[i] == lastNum+1) straight.push(handValues[i]);
                    else {
                        if (straight.length >= 5) break;
                        else {
                            straight = [];
                            straight.push(handValues[i]);
                        }
                    }

                    lastNum = handValues[i];
                }
            }
            console.log("Hand Values Sorted:", handValues);
            console.log("Final Straight:", straight);
            if (straight.length >= 5)
            {
                // Possible Royal flush if hand is also a flush
                if (straight[straight.length-1] == "ace") nutStraight = true;

                handHierarchy["Straight"] = true;
                this.straightTieBreakers[hand.player.nickname] = straight[straight.length-1];
                console.log(this.straightTieBreakers);
                console.log(hand.player.nickname, "Straight: ", straight);
            } 

            // Check for flush
            let suitFreq = {};
            handSuits.forEach(suit => {
                if (!suitFreq[suit]) suitFreq[suit] = 1;
                else suitFreq[suit]++;
            });
            Object.keys(suitFreq).forEach(key => {
                if (suitFreq[key] >= 5) handHierarchy["Flush"] = true;
                console.log(key, ":", suitFreq[key]);
            });

            // Check for straight flush and royal flush
            if (handHierarchy["Straight"] && handHierarchy["Flush"])
            {
                handHierarchy["Straight Flush"] = true;
                
                // This would be a royal flush
                if (nutStraight) handHierarchy["Royal Flush"] = true;
            }
        }
        
        Object.keys(valueFreq).forEach(key => {
            console.log(key, ":", valueFreq[key]);
        });

        // Return the best hand type
        let keys = Object.keys(handHierarchy);
        for(let key of keys) {
            if (handHierarchy[key] == true) return key;
        }

        return "High Card"; // If player has nothing else, will default to high card
    }
    getTieBreaker(handChecker, hand, handType) {
        // Straight
        if (handType == "Straight" || handType == "Straight Flush" || handType == "Royal Flush"){
            return handChecker.straightTieBreakers[hand.player.nickname];
        }
        // Flush
        if (handType == "Flush")
        {
            let suitFreq = {};
            let suitToCheck = "";
            hand.cards.forEach(card => {
                if (suitFreq[card.suit]) suitFreq[card.suit]++;
                else suitFreq[card.suit] = 1;
            });
            Object.keys(suitFreq).forEach(key => {
                if (suitFreq[key] >= 5) suitToCheck = key;
            });

            let biggestNumber = 0;
            for (let card of hand.cards){
                if (card.suit == suitToCheck && card.value == "ace") return "ace";
                else if (card.suit == suitToCheck && card.value > biggestNumber) biggestNumber = card.value;
            }
            return biggestNumber;
        }
        let valueFreq = {};
        for (let card of cards)
        {
            if (valueFreq[card.value]) valueFreq[card.value]++;
            else valueFreq[card.value] = 1;
        }
        // Convert Queen, King and Jack to values
        Object.keys(valueFreq).forEach(key => {

        });

        // Four of a kind
        if (handType == "Four of a Kind")
        {
            Object.keys(valueFreq).forEach(key => {
                if (valueFreq[key] == 4) return key;
            });
        }
        // Three of a kind
        if (handType == "Three of a Kind")
        {
            let biggestNum = 0;
            let aceFound = false;
            Object.keys(valueFreq).forEach(key => {

                if (aceFound){}
                else if (valueFreq[key] == 3 && key == "ace")
                {
                    biggestNum == "ace";
                    aceFound = true
                }
                else if (valueFreq[key] == 3)
                {
                    if (key == "king") key == 13;
                    if (key == "queen") key == 12;
                    if (key == "jack") key == 11;

                    if (key > biggestNum) biggestNum = key;
                } 
            });
            return biggestNum;
        }

    }
    compareHands(hands, handType) {
        
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