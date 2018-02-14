'use strict';

const Q = require('q');

module.exports = function (w) {

    this.currentDeck = [];
    this.players = [];
    this.dealer = {'hand': [], 'count': 0};
    this.dealerHidden = {'card': null, 'count':0};
    this.dealer21 = false;
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
                let card = {
                    name: faces[i],
                    suite: suites[j],
                    value: 10
                };
                if (faces[i]==='ace'){
                    card.value = 11;
                }
                deck.push(card);
            }
        }
        return deck;
    };


    this.deal = () => {
        this.currentPlayerPosition = 0;
        this.activePlay = true;
        this.dealer = {'hand': [], 'count': 0};
        this.currentDeck = this.getNewDeck();
        // deal 2 cards to each player
        this.players.forEach((player) => {
            player.user.hand = [];
            player.user.money -= player.user.bet;
            w.services.user.updateUser(player.user.id, {'credits': player.user.money}).then(result => {
                this.sendUpdate();
                }
            );
            for (let j = 0; j < 2; j++) {
                player.user.hand.push(this.dealCard());
                player.user.count = this.calculateCount(player.user.hand);
                if (j === 1 && player.user.count === 21){
                    // BLACKJACK
                    player.user.money += Math.ceil(player.user.bet * 2);
                    w.services.user.updateUser(player.user.id, {'credits': player.user.money}).then(result => {
                            this.sendUpdate();
                        }
                    );
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
        this.dealerHidden.card = this.dealCard();
        this.dealer.count = this.calculateCount(this.dealer.hand);
        this.dealerHidden.count = this.dealer.count + this.dealerHidden.card.value;
        if (this.dealerHidden.count === 21) {
            this.dealer21 = true;
        }
        this.nextPlayer();
    };

    this.nextPlayer = () => {
        let playerFound;
        for (let i = 0; i < this.players.length; i++) {
            let player = this.players[i];
            if (!player.user.gone) {
                if (this.dealer21) {
                    player.emit('alert', {'type':'DANGER','message': 'Dealer got 21. You lose!'});
                    player.user.turn = false;
                    player.user.active = false;
                    player.user.gone = true;
                } else {
                    playerFound = player;
                    break;
                }
            }
        }
        if (playerFound) {
            playerFound.user.turn = true;
            playerFound.emit('alert', {'type':'INFO','message': 'Your turn!'});
            this.sendUpdate();
        } else {
            this.finishRound();
        }
    };

    this.finishRound = () => {
        // flip dealer card over
        this.dealer.hand.push(this.dealerHidden.card);
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
                    let mult;
                    if (player.user.double) {
                        mult = 3;
                    } else {
                        mult = 2;
                    }
                    player.user.money += player.user.bet*mult;
                    w.services.user.updateUser(player.user.id, {'credits': player.user.money}).then(result => {
                            this.sendUpdate();
                        }
                    );
                } else if (this.dealer.count > player.user.count) {
                    // player loses
                    player.emit('alert', {'type':'DANGER','message': 'You Lose!'});
                    if (player.user.money <= 0 ) {
                        // player is out of money
                        player.emit('alert', {'type':'DANGER','message': 'You are out of money!'});
                        player.emit('buttons', [
                            {'button':'ready', 'condition':false},
                            {'button':'hit','condition':false},
                            {'button':'stay','condition':false},
                            {'button':'buyIn','condition':true}]);
                    }
                } else {
                    // player pushes
                    player.user.money += player.user.bet;
                    w.services.user.updateUser(player.user.id, {'credits': player.user.money}).then(result => {
                            this.sendUpdate();
                        }
                    );
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
                player.user.double = false;
            }
        }
        this.activePlay = false;
        this.dealer21 = false;
        if (this.waitlist.length) {
            this.waitlist.forEach((player) => {
                if (this.players.length < 5) {
                    this.sit(this.waitlist.shift());
                } else {
                    socket.emit('alert', {'type':'WARNING','message': `Sorry there are still no seats avalable.`});
                }
            });
        }
        this.sendUpdate();
    };

    this.playerHits = (player) => {
        let card = this.dealCard();
        player.user.hand.push(card);
        player.user.count = this.calculateCount(player.user.hand);
        if (player.user.count > 21) {
            player.emit('alert', {'type':'DANGER','message': 'You Busted!'});
            player.user.turn = false;
            player.user.active = false;
            let mult;
            if (player.user.double) {
                mult = 2;
            } else {
                mult = 1;
            }
            player.user.money -= player.user.bet * mult;
            w.services.user.updateUser(player.user.id, {'credits': player.user.money}).then(result => {
                    this.sendUpdate();
                }
            );
            player.user.gone = true;
            this.nextPlayer();
        }
        this.sendUpdate();
    };

    this.double = (player) => {
        player.user.double = true;
        player.user.money -= player.user.bet;
        this.playerHits(player);
        player.user.turn = false;
        player.user.gone = true;
        this.nextPlayer();
    };

    this.buyIn = (player, amount = 100) => {
        player.user.money = amount;
        w.services.user.updateUser(player.user.id, {'credits': player.user.money}).then(result => {
                this.sendUpdate();
            }
        );
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

    this.preparedPlayers = async () => {
        let users = [];

        for (let i = 0; i < this.players.length; i++) {
            let player = this.players[i].user;

            let user = await w.services.user.getUser(player.id);
            if (user) {
                user = user.toJSON();
                player.money = user.credits;
                users.push(player);
            }
        }

        return users;
    };

    this.readyCheck = () => {
        let ready = true;
        this.players.forEach((player) => {
            if (player.user.ready === false){
                ready = false;
            }
        });
        if (ready) {
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
        socket.emit('alert', {'type':'WARNING','message': `There are no available seats. You've been placed on a waitlist.`});
        socket.emit('buttons', [
            {'button':'ready', 'condition':false}]);
        this.sendUpdate();
    };

    this.resetGame = () => {
        this.currentDeck = [];
        this.players = [];
        this.dealer = {'hand': [], 'count': 0};
        this.dealerHidden.card = null;
        this.dealerHidden.count = 0;
        this.dealer21 = false;
        this.activePlay = false;
    };

    this.randomNumber = (max, min = 0) => {
        return min + Math.floor(Math.random()*max);
    };

    this.sendUpdate = () => {
        this.preparedPlayers().then((users) => {
            w.io.emit('dataUpdate', {'players': users, 'dealer': this.dealer, 'activePlay': this.activePlay});
        });
    };
};