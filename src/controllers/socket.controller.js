'use strict';

module.exports = function (w, app, io) {
    console.log('socket initializing');
    io.on('connect', (socket) => {
        let game = w.services.game;
        let user = socket.session.user;
        let players = game.players;
        let table = game.table;
        let username = user.username;
        console.log('players',players);
        console.log('table',table);
        if (!socket.session) {
            socket.disconnect();
            return;
        }

        socket.join('user:' + user.id);
        console.log(`${username} connected.`);
        socket.emit('message', 'Welcome to the game.');

        // see if there is an open seat
        let openSeat = game.isOpenSeat();
        console.log('openseat', openSeat);
        if (openSeat) {
            // setup player
            players.push({'username': username, 'hand': [], 'ready': false, 'money': 100, 'count': 0});
            console.log('players',players);
            table[openSeat] = username;
        } else {
            socket.emit('message', `There are no available seats. You've been placed on a waitlist.`);
        }


        socket.on('message', function (message) {
            console.log(`${username}: ${message}`);
            io.emit('message', `${username}: ${message}`);
        });

        socket.on('readyCheck', function () {
            console.log('players',players);
            // player indicates they are ready
            players[game.getIndexOfPlayer(username)].ready = true;
            io.emit('message', `${username}: is ready`);

            // if everyone is ready, start round
            let allReady = game.readyCheck();
            console.log(allReady);
            console.log('players100',players);
            if (allReady) {
                let data = game.startRound();
                io.emit('dataUpdate', data);
            }
        });

        socket.on('hit', function () {

        });

        socket.on('stay', function () {

        });

        socket.on('double', function () {

        });

        socket.on('split', function () {

        });

        socket.on('disconnect', function () {
            console.log(`${username} disconnected.`);
            io.emit('message', `${username} disconnected.`);
        });
    });
};
