// Manages creations of pots and pot functions
class PotManager {
    pots = [];

    // Creates a new pot and adds it to the current list of pots, then returns that pot
    createPot() {
        const pot = new Pot();
        this.pots.push(pot);
        return pot;
    }

    // Resets pots for a new hand
    resetPots() {
        this.pots = [];
        return this.createPot();
    }
}

// Contans the contributions made by players and the total size of the pot
class Pot {
    potSize = 0;
    contributions = [];

    // Add a new contribution to the pot
    addContribution(player, amount) {

        // Check if player has already contributed to the pot
        let alreadyContributed = false;
        for (const contribution of this.contributions) {
            if (contribution.player.id === player.id) {
                // Add on amount to the contribution that already exists for that player
                contribution.addAmount(amount);
                alreadyContributed = true;
            }
        }
        if (!alreadyContributed) {
            this.contributions.push(new Contribution(player, amount));
        }
        // Add amount to total pot size
        this.potSize += amount;

        // Reset the player's currentBet
        player.currentBet = 0;
    }

    // Splits the pot based on the number of winners. If there are chips left over, they go to the player closest to dealer going clockwise
    splitPot(winners, closestToDealer) {
        const extraChips = this.potSize % winners.length;
        const splitAmount = (this.potSize-extraChips) / winners.length;
        const payouts = [];
        
        for (const winner of winners) {
            if (extraChips) {
                if (winner.id === closestToDealer.id) payouts.push(new Payout(winner, splitAmount + extraChips));
                else payouts.push(new Payout(winner, splitAmount));
            }
            else payouts.push(new Payout(winner, splitAmount));
        }
        return payouts;
    }
}

// Contribution made by a player to a pot
class Contribution {
    constructor(_player, _amount) {
        this.player = _player;
        this.amount = _amount;
    }

    // Adds onto a players contribution
    addAmount(amount) {
        this.amount += amount;
    }
}

// Payout amount to a player
class Payout {
    constructor(_player, _amount) {
        this.player = _player;
        this.amount = _amount;
    }
}

module.exports = {PotManager};