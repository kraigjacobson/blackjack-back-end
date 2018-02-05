'use strict';

module.exports = function (w, app, io) {

    io.on('connect', (socket) => {
        if (!socket.session) {
            socket.disconnect();
            return;
        }
        let user = socket.session.user;
        let username = user.username;
        socket.join('user:' + user.id);
        console.log(`${username} connected.`);
        socket.emit('message', 'Welcome to the game.');
        let game = w.services.game;
        let players = game.players;
        let userObj = {'username': username, 'hand': [], 'ready': false, 'money': 100, 'count': 0};
        // if round already started
        if (!game.activePlay) {


            // see if there is an open seat
            let seat = game.isOpenSeat();
            // setup player
            if (seat != null) {
                // seat player
                players[seat] = userObj;
                user.seat = seat;
                socket.emit('buttons', [
                    {'button':'ready', 'condition':true},
                    {'button':'hit','condition':false},
                    {'button':'stay','condition':false}]);
            } else {
                // waitlist player
                socket.emit('message', `There are no available seats. You've been placed on a waitlist.`);
                game.waitList.push(userObj);
            }
        } else {
            socket.emit('message', 'Round in play. Please wait until a new round begins.');
            game.waitList.push(userObj);
        }



        socket.on('message', function (message) {
            console.log(`${username}: ${message}`);
            io.emit('message', `${username}: ${message}`);
        });

        socket.on('readyCheck', function () {
            socket.emit('buttons', [{'button':'ready', 'condition':false}]);
            players[user.seat].ready = true;
            io.emit('message', `${username}: is ready`);
            console.log('game.readyCheck()', game.readyCheck());
            if (game.readyCheck()) {
                console.log('game active');
                let data = game.startRound();
                io.emit('dataUpdate', data);
                game.nextPlayer();
                if (user.seat === game.currentPlayer) {
                    socket.emit('buttons', [
                        {'button':'hit','condition':'true'},
                        {'button':'stay','condition':'true'}]);
                }
            }
        });

        socket.on('hit', function () {
            if (user.seat === game.currentPlayer) {
                // add card to user's hand
                console.log(`${username} hit.`);
                io.emit('dataUpdate', game.playerHits(user.seat));
            }
        });

        socket.on('stay', function () {
            if (user.seat === game.currentPlayer) {
                // pass turn to next player
                console.log(`${username} stay.`);
                game.nextPlayer();
            }
        });

        socket.on('double', function () {
            if (user.seat === game.currentPlayer) {
                // double bet, deal 1 card, pass turn to next player
                console.log(`${username} double.`);
            }
        });

        socket.on('split', function () {
            if (user.seat === game.currentPlayer) {
                // figure out later
                console.log(`${username} split.`);
            }
        });

        socket.on('disconnect', function () {
            for ( let i = 0; i < players.length; i++ ) {
                if (players[i] && players[i].username === username) {
                    players[i] = null;
                }
            }
            console.log(`${username} disconnected.`);
            io.emit('message', `${username} disconnected.`);
        });
    });
};
