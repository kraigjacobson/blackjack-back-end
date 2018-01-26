'use strict';

module.exports = function(w, app, io) {
    io.on('connect', (socket) => {
        if (!socket.session) {
            socket.disconnect();
            return;
        }
        socket.on('message', function (message) {
            console.log(`${socket.session.user.username}: ${message}`);
            io.emit('message', `${socket.session.user.username}: ${message}`);
        });

        socket.on('disconnect', function() {
            console.log(`${socket.session.user.username} disconnected.`);
        });

        socket.join('user:' + socket.session.user.id);
        console.log(`${socket.session.user.username} connected.`);

        socket.emit('message', 'Welcome to the the game.');
        // socket.emit('stats', {name:'degobah'});
    });
};
