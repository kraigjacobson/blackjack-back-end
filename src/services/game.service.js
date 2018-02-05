'use strict';

const Q = require('q');

module.exports = function (w) {

    this.currentDeck = [];
    this.players = [null, null, null, null, null];
    this.dealer = {'hand': [], 'count': 0};
    this.waitList = [];
    this.activePlay = false;
    this.currentPlayer = null;

    this.getNewDeck = () => {
        let deck = [];
        let suites = ['spade', 'heart', 'diamond', 'club'];
        let faces = ['jack', 'queen', 'king', 'ace'];
        let numbers = [{'name': 'two', 'value': 2}, {'name': 'three', 'value': 3}, {
            'name': 'four',
            'value': 4
        }, {'name': 'five', 'value': 5}, {'name': 'six', 'value': 6}, {'name': 'seven', 'value': 7}, {
            'name': 'eight',
            'value': 8
        }, {'name': 'nine', 'value': 9}, {'name': 'ten', 'value': 10}];
        // foreach suite
        for (let j = 0; j < suites.length; j++) {
            // generate number cards
            for (let i = 0; i < numbers.length; i++) {
                deck.push({
                    name: numbers[i].name,
                    suite: suites[j],
                    value: numbers[i].value,
                })
            }
            // generate face cards
            for (let i = 0; i < faces.length; i++) {
                deck.push({
                    name: faces[i],
                    suite: suites[j],
                    value: 10
                })
            }
        }
        this.currentDeck = deck;
    };


    this.startRound = () => {
        this.activePlay = true;
        this.dealer = {'hand': [], 'count': 0};
        console.log('starting round');
        this.getNewDeck();
        // deal 2 cards to each player
        for (let i = 0; i < this.players.length; i++) {
            let player = this.players[i];
            if (player) {
                player.hand = [];
                for (let j = 0; j < 2; j++) {
                    let card = this.dealCard();
                    player.hand.push(card);
                    player.count = this.calculateCount(player.hand);
                    if (player.count === 21){
                        // BLACKJACK
                        //TODO: tell player they get a blackjack
                        player.money += Math.ceil(player.bet * 1.5);
                    }
                }
            }
        }
        // deal 2 cards to dealer
        for (let i = 0; i < 2; i++) {
            let card = this.dealCard();
            this.dealer.hand.push(card);
            this.dealer.count = this.calculateCount(this.dealer.hand);
        }
        return {'players': this.players, 'dealer': this.dealer }
    };

    this.nextPlayer = () => {
        let thisPlayer;
        if (!this.currentPlayer) {
            thisPlayer = 0;
        } else if (this.currentPlayer === this.currentPlayer.length) {
            // round over
            this.currentPlayer = 0;
            this.finishRound();
        } else {
            thisPlayer = this.currentPlayer;
        }
        for (let i = thisPlayer; i < this.players.length; i++) {
            if (this.players[i]) {
                this.currentPlayer = i;
                break;
            }
        }
    };

    this.finishRound = () => {
        for (let i = thisPlayer; i < this.players.length; i++) {
            let player = this.players[i];
            // if player hasn't busted
            if (this.players[i] && player.count <=21) {
                if (dealer.count > player.count) {
                    // player loses
                    // TODO: tell player they lose
                    player.money -= player.bet;
                    if (player.money <= 0 ) {
                        // player is out of money
                        // TODO: kick player back to login screen
                    }
                } else if (dealer.count > player.count) {
                    // player wins
                    // TODO: tell player they win
                    player.money += player.bet;
                } else {
                    // player pushes
                    // TODO: tell player they push
                }
            }
        }
    };

    this.playerHits = (seat) => {
        let card = this.dealCard();
        this.players[seat].hand.push(card);
        this.players[seat].count = this.calculateCount(this.players[seat].hand);
        return {'players': this.players, 'dealer': this.dealer }
    };

    this.dealCard = () => {
        let index = Math.floor(Math.random() * this.currentDeck.length);
        return this.currentDeck.splice(index, 1)[0];
    };

    this.calculateCount = (hand) => {
        let total = 0;
        hand.forEach(function(card) {
            if (card.name === "ace") {
                if (total + 11 <= 21) {
                    total += 11;
                } else if (total + 1 <= 21) {
                    total += 1;
                }
            } else {
                total += card.value;
            }
        });
        return total;
    };

    this.isOpenSeat = () => {
        for (let i = 0; i < this.players.length; i++) {
            if (!this.players[i]) {
                // found open spot
                return i;
            }
        }
    };

    this.readyCheck = () => {
        let ready = true;
        this.players.forEach(function(player) {
            if (player && !player.ready) {
                ready = false;
            }
        });
        return ready;
    };

    this.getIndexOfPlayer = (username) => {
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].username === username) {
                return i;
            }
        }
    };

};