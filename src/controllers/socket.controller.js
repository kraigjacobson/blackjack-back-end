'use strict';

module.exports = function (w, app, io) {
    io.on('connect', (socket) => {
        if (!socket.session) {
            socket.disconnect();
            return;
        }
        let game = w.services.game;
        let user = socket.session.user;
        socket.session.user = {'username': user.username, 'hand': [], 'ready': false, 'money': 100, 'count': 0, 'bet': 5, 'active': true, 'gone': false};
        socket.join('user:' + user.id);
        console.log(`${user.username} ${socket.id} connected.`);
        io.emit('message', `${user.username} connected.`);
        socket.emit('init', socket.session.user);
        io.emit('dataUpdate', {'players': game.preparedPlayers(), 'dealer': game.dealer });
        // if round already started
        if (!game.activePlay) {
            game.fillSeat(socket, game.isOpenSeat());
        } else {
            socket.emit('alert', {'type':'WARNING','message': `Round in play. Please wait until a new round begins.`});
            game.waitList.push(socket);
            socket.emit('buttons', [
                {'button':'ready', 'condition':false}]);
            io.emit('dataUpdate', {'players': game.preparedPlayers(), 'dealer': game.dealer });
        }

        socket.on('message', function (message) {
            io.emit('message', `${socket.session.user.username}: ${message}`);
        });

        socket.on('readyCheck', function (data) {
            if (socket.session.user.money < data) {
                socket.emit('alert', {'type':'DANGER','message': `You don't have enough money.`});
            } else {
                console.log('userReadyCheck', user);
                socket.session.user.bet = data;
                socket.emit('buttons', [{'button':'ready', 'condition':false}]);
                socket.session.user.ready = true;
                game.readyCheck();
            }
        });

        socket.on('hit', function () {
            console.log('socket.id', socket.id);
            console.log(game.players[game.currentPlayerPosition].id);
            if (socket.id === game.players[game.currentPlayerPosition].id) {
                // add card to user's hand
                console.log(`${user.username} hit.`);
                console.log('socket.session.user.seat', socket.session.user.seat);
                io.emit('dataUpdate', game.playerHits(socket.session.user.seat));
            }
        });

        socket.on('stay', function () {
            console.log('stay received');
            if (socket.id === game.players[game.currentPlayerPosition].id) {
                // pass turn to next player
                console.log(`${user.username} stay===========.`);
                socket.emit('buttons', [
                    {'button':'hit','condition':false},
                    {'button':'stay','condition':false}]);
                socket.session.user.gone = true;
                game.nextPlayer();
            }
        });

        socket.on('double', function () {
            if (socket.id === game.players[game.currentPlayerPosition].id) {
                // double bet, deal 1 card, pass turn to next player
                console.log(`${user.username} double.`);
            }
        });

        socket.on('split', function () {
            if (socket.id === game.players[game.currentPlayerPosition].id) {
                // figure out later
                console.log(`${user.username} split.`);
            }
        });

        socket.on('disconnect', function () {
            for ( let i = 0; i < game.players.length; i++ ) {
                if (game.players[i]) {
                    if (game.players[i].session.user.username === socket.session.user.username) {
                        if (game.activePlay) {
                            game.players[i] = null;
                            game.nextPlayer();
                        } else {
                            game.players[i] = null;
                            game.readyCheck();
                        }
                    }
                }
            }
            io.emit('dataUpdate', {'players': game.preparedPlayers(), 'dealer': game.dealer });
            console.log(`${user.username} disconnected.`);
            io.emit('message', `${user.username} disconnected.`);
        });
    });
};
