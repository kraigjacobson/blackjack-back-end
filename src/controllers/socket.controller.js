'use strict';

module.exports = function (w, app, io) {
    io.on('connect', (socket) => {
        if (!socket.session) {
            socket.disconnect();
            return;
        }
        let game = w.services.game;
        socket.user = {'id': socket.session.session.userId, 'username': socket.session.user.username, 'hand': [], 'ready': false, 'money': 100, 'count': 0, 'bet': 5, 'active': true, 'gone': false, 'turn': false};
        socket.join('user:' + socket.session.user.id);


        console.log(`${socket.user.username} ${socket.id} connected.`);
        io.emit('message', `${socket.user.username} connected.`);
        if (!game.players.length) {
            game.resetGame();
        }
        // if round already started
        if (!game.activePlay) {
            if (game.players.length < 5) {
                game.sit(socket);
            } else {
                game.sendToWaitlist();
            }
        } else {
            socket.emit('alert', {'type':'WARNING','message': `Round in play. Please wait until a new round begins.`});
            game.waitlist.push(socket);
            socket.emit('buttons', [
                {'button':'ready', 'condition':false}]);
        }

        socket.on('message', function (message) {
            io.emit('message', `${socket.user.username}: ${message}`);
        });

        socket.on('readyCheck', function (data) {
            if (socket.user.money < data) {
                socket.emit('alert', {'type':'DANGER','message': `You don't have enough money.`});
            } else {
                socket.user.bet = data;
                socket.emit('buttons', [{'button':'ready', 'condition':false}]);
                socket.user.ready = true;
                game.readyCheck();
            }
        });

        socket.on('hit', function () {
            console.log('1');
            if (socket.user.turn) {
                console.log('2');
                // add card to user's hand
                console.log(`${socket.user.username} hit.`);
                game.playerHits(socket);
            }
        });

        socket.on('stay', function () {
            console.log('stay received');
            if (socket.user.turn) {
                // pass turn to next player
                console.log(`${socket.user.username} stay===========.`);
                socket.user.gone = true;
                socket.user.turn = false;
                game.nextPlayer();
            }
        });

        socket.on('double', function () {
            if (socket.user.turn) {
                // double bet, deal 1 card, pass turn to next player
                console.log(`${socket.user.username} double.`);
            }
        });

        socket.on('split', function () {
            if (socket.user.turn) {
                // figure out later
                console.log(`${socket.user.username} split.`);
            }
        });

        socket.on('buyIn', function () {
            if (socket.user.turn) {
                // figure out later
                console.log(`${socket.user.username} split.`);
            }
        });

        socket.on('disconnect', function () {
            console.log('game.players.length',game.players.length);
            for ( let i = 0; i < game.players.length; i++ ) {
                let player = game.players[i];
                console.log('player.user.username', player.user.username);
                console.log('socketusername', socket.user.username);
                console.log('game.players', game.players.length);
                if (player.user.username === socket.user.username) {
                    game.players.splice(i, 1);
                    if (game.activePlay) {
                        game.nextPlayer();
                    } else {
                        game.readyCheck();
                    }
                }
            }
            game.sendUpdate();
            console.log(`${socket.user.username} disconnected.`);
            io.emit('message', `${socket.user.username} disconnected.`);
        });
    });
};
