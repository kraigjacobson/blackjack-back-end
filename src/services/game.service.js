'use strict';

const Q = require('q');

module.exports = function (w) {

    this.currentDeck = [];
    this.players = [];
    this.dealer = {'hand': [], 'count': 0};
    this.table = {'one': null, 'two': null, 'three': null, 'four': null, 'five': null,};
    this.waitList = [];

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
        this.dealer = {'hand': [], 'count': 0};
        console.log('starting round');
        this.getNewDeck();
        // deal 2 cards to each player
        console.log('this.players', this.players);
        for (let i = 0; i < this.players.length; i++) {
            console.log(i);
            // let username = Object.keys(this.players)[i];
            console.log('thisplayer=====',this.players[i]);
            this.players[i].hand = [];
            for (let j = 0; j < 2; j++) {
                console.log(i);
                console.log('this.players', this.players);
                console.log('this.players[i]', this.players[i]);
                let card = this.dealCard();
                this.players[i].hand.push(card);
                this.players[i].count += card.value;
            }
            // console.log('cards', this.players[username].hand);
            // console.log('players', this.players);
        }
        // deal 2 cards to dealer
        for (let i = 0; i < 2; i++) {
            let card = this.dealCard();
            this.dealer.hand.push(card);
            this.dealer.count += card.value;
        }
        return {'players': this.players, 'dealer': this.dealer, 'table': this.table }
    };

    this.dealCard = () => {
        let index = Math.floor(Math.random() * this.currentDeck.length);
        let card = this.currentDeck.splice(index, 1)[0];
        console.log(card);
        return card;
    };

    this.isOpenSeat = () => {
        let keys = Object.keys(this.table);
        for (let i = 0; i < keys.length; i++) {
            if (!this.table[keys[i]]) {
                // found open spot
                return keys[i];
            }
        }
    };

    this.readyCheck = () => {
        console.log('Object.keys(this.players)', Object.keys(this.players));
        for (let i = 0; i < Object.keys(this.players).length; i++) {
            if (!this.players[Object.keys(this.players)[i]].ready) {
                return false;
            }
        }
        return true;
    };

    this.getIndexOfPlayer = (username) => {
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].username === username) {
                return i;
            }
        }
    };

};