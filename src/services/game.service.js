'use strict';

const Q = require('q');

module.exports = function (w) {

    this.currentDeck = [];
    this.players = [];
    this.dealer = {'hand': [], 'count': 0};
    this.dealerHidden = null;
    this.waitlist = [];
    this.activePlay = false;

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
        return deck;
    };


    this.deal = () => {
        this.currentPlayerPosition = 0;
        this.activePlay = true;
        console.log('starting round');
        this.dealer = {'hand': [], 'count': 0};
        this.currentDeck = this.getNewDeck();
        // deal 2 cards to each player
        this.players.forEach((player) => {
            player.user.hand = [];
            for (let j = 0; j < 2; j++) {
                player.user.hand.push(this.dealCard());
                player.user.count = this.calculateCount(player.user.hand);
                if (j === 1 && player.user.count === 21){
                    // BLACKJACK
                    player.user.money += Math.ceil(player.user.bet * 2);
                    player.emit('alert', {'type':'SUCCESS','message': 'You got a BlackJack!'});
                    player.user.active = false;
                    player.user.turn = false;
                    player.user.gone = true;
                    player.emit('buttons', [
                        {'button':'hit','condition':false},
                        {'button':'stay','condition':false}]);
                }
            }
        });
        // deal 1 showing card and 1 hidden card to dealer
        this.dealer.hand.push(this.dealCard());
        this.dealerHidden = this.dealCard();
        this.dealer.count = this.calculateCount(this.dealer.hand);
        this.nextPlayer();
    };

    this.nextPlayer = () => {
        console.log('next player');
        this.sendUpdate();

        let playersDone = 0;
        for (let i = 0; i < this.players.length; i++) {
            let player = this.players[i];
            if (!player.user.gone) {
                console.log('this player\'s turn');
                player.user.turn = true;
                player.emit('alert', {'type':'INFO','message': 'Your turn!'});
                this.sendUpdate();
                break;
            } else {
                playersDone++;
                console.log('already gone');
            }
            console.log(playersDone);
            console.log(this.players.length);
            if (playersDone === this.players.length) {
                console.log('finishing round');
                this.finishRound();
            }
        }
        this.sendUpdate();
    };

    this.finishRound = () => {
        console.log('finishing up round');
        // flip dealer card over
        this.dealer.hand.push(this.dealerHidden);
        this.dealer.count = this.calculateCount(this.dealer.hand);
        // dealer hits until 17 or bust
        while (this.dealer.count < 17) {
            let card = this.dealCard();
            this.dealer.hand.push(card);
            this.dealer.count = this.calculateCount(this.dealer.hand);
            if (this.dealer.count > 21) {
                w.io.emit('alert', {'type':'SUCCESS','message': 'Dealer Busts!'});
            }
        }

        this.players.forEach((player) => {
            if (player.user.active) {
                if (this.dealer.count > 21 || this.dealer.count < player.user.count) {
                    // player wins
                    player.emit('alert', {'type':'SUCCESS','message': 'You Win!'});
                    player.user.money += player.user.bet;
                } else if (this.dealer.count > player.user.count) {
                    // player loses
                    player.emit('alert', {'type':'DANGER','message': 'You Lose!'});
                    player.user.money -= player.user.bet;
                    if (player.user.money <= 0 ) {
                        // player is out of money
                        player.emit('alert', {'type':'DANGER','message': 'You are out of money!'});
                        player.disconnect();
                    }
                } else {
                    // player pushes
                    player.emit('alert', {'type':'INFO','message': 'You push!'});
                }
            }
        });

        w.io.emit('buttons', [
            {'button':'ready', 'condition':true}]);
        for (let j = 0; j < this.players.length; j++) {
            let player = this.players[j];
            if (player){
                player.user.ready = false;
                player.user.active = true;
                player.user.gone = false;
            }
        }
        this.sendUpdate();
        this.activePlay = false;
        console.log('this.waitlist.length', this.waitlist.length);
        if (this.waitlist.length) {
            this.waitlist.forEach((player) => {
                if (this.players.length < 5) {
                    this.sit(this.waitlist.shift());
                } else {
                    socket.emit('alert', {'type':'WARNING','message': `Sorry there are still no seats avalable.`});
                }
            });
        }
    };

    this.playerHits = (player) => {
        let card = this.dealCard();
        player.user.hand.push(card);
        player.user.count = this.calculateCount(player.user.hand);
        if (player.user.count > 21) {
            console.log('player busts');
            player.emit('alert', {'type':'DANGER','message': 'You Busted!'});
            player.user.turn = false;
            player.user.active = false;
            player.user.money -= player.user.bet;
            player.user.gone = true;
            this.nextPlayer();
        }
        this.sendUpdate();
    };

    this.dealCard = () => {
        let index = Math.floor(Math.random() * this.currentDeck.length);
        return this.currentDeck.splice(index, 1)[0];
    };

    this.calculateCount = (hand) => {
        let total = 0;
        hand.forEach((card) => {
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

    this.preparedPlayers = () => {
        let users = [];
        for (let i = 0; i < this.players.length; i++) {
            users.push(this.players[i].user);
        }
        return users;
    };

    this.readyCheck = () => {
        let ready = true;
        this.players.forEach((player) => {
            if (player.user.ready === false){
                w.io.emit('message', `Waiting on ${player.user.username}...`);
                ready = false;
            }
        });
        if (ready) {
            console.log('game active');
            this.deal();
        }
    };

    this.sit = (socket) => {
        if (this.players.length < 5) {
            this.players.push(socket);
            socket.emit('alert', {'type':'SUCCESS','message': `You have been seated.`});
            socket.emit('buttons', [
                {'button':'ready', 'condition':true},
                {'button':'hit','condition':false},
                {'button':'stay','condition':false}]);
        }
        this.sendUpdate();
    };

    this.sendToWaitlist = (socket) => {
        this.waitlist.push(socket);
        player.emit('alert', {'type':'WARNING','message': `There are no available seats. You've been placed on a waitlist.`});
        player.emit('buttons', [
            {'button':'ready', 'condition':false}]);
        this.sendUpdate();
    };

    this.resetGame = () => {
        this.currentDeck = [];
        this.players = [];
        this.dealer = {'hand': [], 'count': 0};
        this.dealerHidden = null;
        this.waitlist = [];
        this.activePlay = false;
    };

    this.sendUpdate = () => {
        w.io.emit('dataUpdate', {'players': this.preparedPlayers(), 'dealer': this.dealer, 'waitlist': this.waitlist, 'activePlay': this.activePlay });
    };
};