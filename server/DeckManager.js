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
            if (player.status !== "Lost"){
                let hand = [shuffledDeck.pop(), shuffledDeck.pop()];
                this.dealtHands.push(new Hand(player, hand));
            }
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
    getPlayer(id){
        for (let hand of this.dealtHands) {
            if (hand.player.id == id)
            {
                console.log("Found player");
                return hand.player;
            }
                
        }
    }
    getPlayerHand(player) {
        for (let hand of this.dealtHands) {
            if (hand.player.id == player.id)
            {
                console.log("Found hand");
                return hand;
            }
                
        }
        return this.dealtHands[0];
    }
    resetDeck() {
        this.cards = [...this.deckDefault];
        this.dealtHands = [];
        this.pot = 0;
    }
    findWinner(lobby, reason) {
        
        if (reason === 'folding') {
            for (const client of this.clients) {
                if (client.status === 'In') {
                    return [client];
                }
            }
        }

        let handChecker = new HandChecker();

        let _hands = []
        for (let hand of this.dealtHands)
        {
            // Make sure this hand hasn't folded
            if (hand.player.status != "Folded")
            {
                let handType = handChecker.checkHandType(hand);
                console.log(hand.player.nickname, handType);
                let handScore = handChecker.scoreHand(handType, hand);
                console.log("Score:", handScore);
                _hands.push([hand, handScore, handType]);
                
            }
        }
        // Sort hands by score
        _hands.sort((a, b) => b[1] - a[1]);

        let winners = [[_hands[0][0].player, _hands[0][2]]]
        console.log(_hands[0][2])
        let highestScore = _hands[0][1];
        _hands.shift()
        for (let hand of _hands) {
            console.log(hand[1]);
            if (hand[1] == highestScore) winners.push([hand[0].player, hand[2]]);
        }
        return winners;
    }
}

class HandChecker {
    constructor(){
        this.conversions = {
            "king": 13,
            "queen": 12,
            "jack": 11,
        }
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

        let highestFlush = 0;
        let highestStraight = 0;

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
                if (straight[straight.length-1] == 13) straight.push(14);
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
            console.log(straight);

            if (straight.length >= 5)
            {
                // Possible Royal flush if hand is also a flush
                if (straight[straight.length-1] == "ace") nutStraight = true;

                handHierarchy["Straight"] = true;
                highestStraight = straight[straight.length-1];
            } 

            // Check for flush
            let suitFreq = {};
            handSuits.forEach(suit => {
                if (!suitFreq[suit]) suitFreq[suit] = 1;
                else suitFreq[suit]++;
            });
            Object.keys(suitFreq).forEach(key => {
                if (suitFreq[key] >= 5) 
                {
                    handHierarchy["Flush"] = true;
                    let biggestNum = 0;
                    hand.cards.forEach(card => {
                        let tempVal = card.value;
                        if (tempVal == "ace") tempVal = 14;
                        if (tempVal == "king") tempVal = 13;
                        if (tempVal == "queen") tempVal = 12;
                        if (tempVal == "jack") tempVal = 11;

                        if (card.suit == key && tempVal > biggestNum) biggestNum = tempVal;
                    });
                    highestFlush = biggestNum;
                }
            });

            // Check for straight flush and royal flush
            if (handHierarchy["Straight"] && handHierarchy["Flush"])
            {
                handHierarchy["Straight Flush"] = true;
                
                // This would be a royal flush
                if (nutStraight) handHierarchy["Royal Flush"] = true;
            }
        }

        // Return the best hand type
        let keys = Object.keys(handHierarchy);
        for(let key of keys) {
            if (handHierarchy[key] == true && key == 'Flush') return [key, highestFlush];
            else if (handHierarchy[key] == true && key == 'Straight') return [key, highestStraight];
            else if (handHierarchy[key] == true) return [key];
        }

        return ["High Card"]; // If player has nothing else, will default to high card
    }
    scoreHand(handType, hand) {

        let handScore = 0;

        // Create Hand Frequencies
        let valueFreq = {};
        let suitFreq = {};
        hand.cards.forEach(card => {
            // Convert king, queen, jack, and ace to numbers
            let tempVal = card.value;
            if (tempVal == "ace") tempVal = 14
            else if (tempVal == "king") tempVal = 13
            else if (tempVal == "queen") tempVal = 12
            else if (tempVal == "jack") tempVal = 11
            tempVal = parseInt(tempVal);

            // Value Frequencies
            if (!valueFreq[tempVal]) valueFreq[tempVal] = 1;
            else valueFreq[tempVal]++;
            // Suit Frequencies
            if (!suitFreq[card.suit]) suitFreq[card.suit] = 1;
            else suitFreq[card.suit]++;
        });

        let leftovers = [];
        let biggest3 = 0;
        let biggest2 = 0;
        switch (handType[0]) {
            case "Royal Flush":
                handScore = 200000;
                break;
            case "Four of a Kind":
                handScore = 180000;
                break;
            case "Straight Flush":
                handScore = 160000;
                break;
            case "Full House":
                handScore = 140000;
                biggest2 = 0;
                biggest3 = 0;
                Object.keys(valueFreq).forEach(key => {
                    if (valueFreq[key] == 3 && key > biggest3) biggest3 = key;
                    if (valueFreq[key] == 2 && key > biggest2) biggest2 = key; 
                });
                handScore += (biggest3 * 1000);
                handScore += (biggest2 * 10);
                break;
            case "Flush":
                handScore = 120000;
                let flushCards = Object.keys(valueFreq);
                flushCards.sort((a, b) => b - a);
                handScore += (flushCards[0] * 1000);
                handScore += (flushCards[1] * 10);
                handScore += (flushCards[2] * 0.1);
                handScore += (flushCards[3] * 0.001);
                handScore += (flushCards[4] * 0.00001);
                break;
            case "Straight":
                handScore = 100000;
                handScore += (handType[1] * 1000);
                break;
            case "Three of a Kind":
                handScore = 80000;
                leftovers = [];
                biggest3 = 0;
                Object.keys(valueFreq).forEach(key => {
                    if (valueFreq[key] == 3 && key > biggest3) biggest3 = key;
                    if (valueFreq[key] == 1) leftovers.push(key);
                });
                // Sort all the leftover cards
                leftovers.sort((a, b) => b - a);

                handScore += (biggest3 * 1000);
                handScore += (leftovers[0] * 10)
                handScore += (leftovers[1] * 0.1)
                break;
            case "Two Pair":
                handScore = 60000;
                let pairs = [];
                leftovers = [];
                Object.keys(valueFreq).forEach(key => {
                    if (valueFreq[key] == 2) pairs.push(key);
                    if (valueFreq[key] == 1) leftovers.push(key);
                });
                // Sort all the pairs and leftovers
                pairs.sort((a, b) => b - a);
                leftovers.sort((a, b) => b - a);

                handScore += (pairs[0] * 1000);
                handScore += (pairs[1] * 10);
                handScore += (leftovers[0] * 0.1);
                break;
            case "One Pair":
                handScore = 40000;
                let pair = 0;
                leftovers = [];
                Object.keys(valueFreq).forEach(key => {
                    if (valueFreq[key] == 2) pair = key;
                    if (valueFreq[key] == 1) leftovers.push(key);
                });
                // Sort all the pairs and leftovers
                leftovers.sort((a, b) => b - a);

                handScore += (pair * 1000);
                handScore += (leftovers[0] * 10);
                handScore += (leftovers[1] * 0.1);
                handScore += (leftovers[2] * 0.001);
                break;
            case "High Card":
                handScore = 20000;
                let keys = Object.keys(valueFreq);
                keys.sort((a, b) => b - a);
                handScore += (keys[0] * 1000);
                handScore += (keys[1] * 10);
                handScore += (keys[2] * 0.1);
                handScore += (keys[3] * 0.001);
                handScore += (keys[4] * 0.00001);
                break;
        }

        return handScore;
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