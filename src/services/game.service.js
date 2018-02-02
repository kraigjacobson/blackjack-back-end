'use strict';

const Q = require('q');

module.exports = function (w) {

    this.currentDeck = [];
    this.players = {};
    this.dealerCards = [];
    this.table = {'one': null, 'two': null, 'three': null, 'four': null, 'five': null, };
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
        console.log('starting round');
        this.getNewDeck();
        // deal 2 cards to each player
        for (let i = 0; i < Object.keys(this.players).length; i++) {
            let username = Object.keys(this.players)[i];
            let cards = this.players[username].hand;
            cards = [];
            for (let i = 0; i < 2; i++) {
                cards.push(this.dealCard());
            }
            console.log('cards', cards);
        }
        // deal 2 cards to dealer
        this.dealerCards = [];
        for (let i = 0; i < 2; i++) {
            this.dealerCards.push(this.dealCard());
        }
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

};