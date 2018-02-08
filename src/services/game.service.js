'use strict';

const Q = require('q');

module.exports = function (w) {

    this.currentDeck = [];
    this.players = [null, null, null, null, null];
    this.dealer = {'hand': [], 'count': 0};
    this.waitList = [];
    this.activePlay = false;
    this.currentPlayerPosition = 0;

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
        console.log('deck done');
    };


    this.deal = () => {
        this.currentPlayerPosition = 0;
        this.activePlay = true;
        console.log('starting round');
        this.dealer = {'hand': [], 'count': 0};
        this.getNewDeck();
        // deal 2 cards to each player
        for (let i = 0; i < this.players.length; i++) {
            let player = this.players[i];
            if (player) {
                player.session.user.hand = [];
                for (let j = 0; j < 2; j++) {
                    let card = this.dealCard();
                    player.session.user.hand.push(card);
                    player.session.user.count = this.calculateCount(player.session.user.hand);
                    if (j === 1 && player.session.user.count === 21){
                        // BLACKJACK
                        player.session.user.money += Math.ceil(player.session.user.bet * 1.5);
                        player.emit('alert', {'type':'SUCCESS','message': 'You got a BlackJack!'});
                        player.session.user.active = false;
                        player.session.user.gone = true;
                        player.emit('buttons', [
                            {'button':'hit','condition':false},
                            {'button':'stay','condition':false}]);
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
        this.nextPlayer();
        return {'players': this.preparedPlayers(), 'dealer': this.dealer };
    };

    this.nextPlayer = () => {
        console.log('next player');
        let turnsLeft = false;
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i] && !this.players[i].session.user.gone) {
                this.currentPlayerPosition = i;
                turnsLeft = true;
                console.log('currentPlayer', this.players[i].session.user.username);
                    this.players[i].emit('alert', {'type':'INFO','message': 'Your turn!'});
                    this.players[i].emit('buttons', [
                        {'button':'hit','condition':true},
                        {'button':'stay','condition':true}]);
                    return;
            } else {
                console.log('empty seat');
            }
        }
        if (!turnsLeft) {
            this.finishRound();
        }
    };

    this.finishRound = () => {
        console.log('finishing up round');
        // flip dealer card over
        while (this.dealer.count < 17) {
            let card = this.dealCard();
            this.dealer.hand.push(card);
            this.dealer.count = this.calculateCount(this.dealer.hand);
            if (this.dealer.count > 21) {
                w.io.emit('alert', {'type':'SUCCESS','message': 'Dealer Busts!'});
            }
        }
        for (let l = 0; l < this.players.length; l++) {
            let player = this.players[l];
            if (player) {
                if (player.session.user.active) {
                    if (this.dealer.count > 21 || this.dealer.count < player.session.user.count) {
                        // player wins
                        player.emit('alert', {'type':'SUCCESS','message': 'You Win!'});
                        player.session.user.money += player.session.user.bet;
                    } else if (this.dealer.count > player.session.user.count) {
                        // player loses
                        player.emit('alert', {'type':'DANGER','message': 'You Lose!'});
                        player.session.user.money -= player.session.user.bet;
                        if (player.session.user.money <= 0 ) {
                            // player is out of money
                            player.emit('alert', {'type':'DANGER','message': 'You are out of money!'});
                            player.disconnect();
                        }
                    } else {
                        // player pushes
                        player.emit('alert', {'type':'INFO','message': 'You push!'});
                    }
                }
            }
        }

        w.io.emit('buttons', [
            {'button':'ready', 'condition':true}]);
        for (let j = 0; j < this.players.length; j++) {
            let player = this.players[j];
            if (player){
                player.session.user.ready = false;
                player.session.user.active = true;
                player.session.user.gone = false;
            }
        }
        w.io.emit('dataUpdate', {'players': this.preparedPlayers(), 'dealer': this.dealer });
        console.log('this.waitList.length', this.waitList.length);
        if (this.waitList.length) {
            for (let i = 0; i < this.waitList.length; i++) {
                let openSeat = this.isOpenSeat();
                if (openSeat) {
                    this.fillSeat(this.waitList.shift(), openSeat);
                } else {
                    socket.emit('alert', {'type':'WARNING','message': `Sorry there are still no seats avalable.`});
                }
            }
        }
        this.activePlay = false;
    };

    this.playerHits = (seat) => {
        console.log('~~~~~~~~~~~this.playerHits');
        console.log(seat);
        let card = this.dealCard();
        let player = this.players[seat];
        // console.log('fdjksl;afjkdlsa;jfkld;saf', player);
        // console.log(player.session);
        // console.log(player.session.user);
        player.session.user.hand.push(card);
        player.session.user.count = this.calculateCount(player.session.user.hand);
        if (player.session.user.count > 21) {
            console.log('player busts');
            player.emit('alert', {'type':'DANGER','message': 'You Busted!'});
            player.emit('buttons', [
                {'button':'ready', 'condition':false},
                {'button':'hit','condition':false},
                {'button':'stay','condition':false}]);
            player.session.user.active = false;
            player.session.user.money -= player.session.user.bet;
            player.session.user.gone = true;
            this.nextPlayer();
        }
        return {'players': this.preparedPlayers(), 'dealer': this.dealer };
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

    this.preparedPlayers = () => {
        let safePlayers = [];
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i]) {
                safePlayers.push(this.players[i].session.user);
            } else {
                safePlayers.push(null);
            }
        }
        return safePlayers;
    };

    this.readyCheck = () => {
        let ready = true;
        for (let j = 0; j < this.players.length; j++) {
            let player = this.players[j];
            if (player && player.session.user.ready === false){
                console.log('player.session.user.ready', player.session.user.username, player.session.user.ready);
                w.io.emit('message', `Waiting on ${player.session.user.username}...`);
                ready = false;
            }
        }
        if (ready) {
            console.log('game active');
            let data = this.deal();
            w.io.emit('dataUpdate', data);
        }
    };

    this.fillSeat = (socket, index) => {
        // see if there is an open seat
        if (index != null) {
            // seat player
            this.players[index] = socket;
            socket.session.user.seat = index;
            socket.emit('alert', {'type':'SUCCESS','message': `You have been seated.`});
            socket.emit('buttons', [
                {'button':'ready', 'condition':true},
                {'button':'hit','condition':false},
                {'button':'stay','condition':false}]);
            let numberofactive = 0;
            for (let j = 0; j < this.players.length; j++) {
                let player = this.players[j];
                if (player){
                    numberofactive++;
                }
            }
            console.log('number of active players', numberofactive);
            console.log('number on waitlist', this.waitList.length);
        }

        w.io.emit('dataUpdate', {'players': this.preparedPlayers(), 'dealer': this.dealer });
    };

    this.waitListPlayer = (socket) => {
        // waitlist player
        socket.emit('alert', {'type':'WARNING','message': `There are no available seats. You've been placed on a waitlist.`});
        this.waitList.push(socket.session.user);
        player.emit('buttons', [
            {'button':'ready', 'condition':false}]);
        w.io.emit('dataUpdate', {'players': this.preparedPlayers(), 'dealer': this.dealer });
    };
};