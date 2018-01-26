'use strict';

const symfode = require('symfode');

symfode.init(__dirname, [
    'src'
], {
    'create-user': (defer, worker, command) => {
        if (command.args.username && command.args.password) {
            let data = {
                username: command.args.username,
                password: command.args.password,
                name: 'Super Admin',
                roles: 'ROLE_SUPER_ADMIN'
            };

            worker.services.user.createUser(data).then(() => {
                defer.resolve();
            }, (err) => {
                defer.reject(err);
            });
        } else {
            defer.reject('Invalid command arguments.');
        }
    }
}, {
    enableSessions: true,
    enableWebsockets: true,
    enableRedis: false
});