'use strict';

const Q = require('q');
const passhash = require('password-hash-and-salt');
const crypto = require('crypto');

module.exports = function(w) {
    this.login = (user) => {
        let username = user.username;
        let password = user.password;
        let defer = Q.defer();

        w.entities.user.findOne({
            where: {
                username: username
            }
        }).then((user) => {
            if (user) {
                passhash(password).verifyAgainst(user.get('password'), (err, verified) => {
                    if (err) {
                        defer.reject(err);
                    } else {
                        if (verified) {
                            this.createSession(user).then((session) => {
                                defer.resolve(session.get('session'));
                            }, function(err) {
                                defer.reject(err);
                            });
                        } else {
                            defer.reject({type: 'invalid_login', message: 'Invalid username or password.'});
                        }
                    }
                });
            } else {
                defer.reject({type: 'invalid_login', message: 'Invalid username or password.'});
            }
        }, (err) => {
            defer.reject(err);
        });

        return defer.promise;
    };

    this.createSession = (user) => {
        let defer = Q.defer();

        crypto.randomBytes(64, (err, buffer) => {
            if (err) {
                defer.reject(err);
            } else {
                let data = {
                    userId: user.get('id'),
                    session: buffer.toString('hex')
                };

                let session = new w.documents.session(data);
                session.save().then((session) => {
                    defer.resolve(session);
                }, (err) => {
                    defer.reject(err);
                });
            }
        });

        return defer.promise;
    };

    let sessionCache = {};
    this.verifySession = (token) => {
        let defer = Q.defer();

        if (sessionCache[token]) {
            defer.resolve(sessionCache[token]);
        } else {
            w.documents.session.findOne({session: token}).then((session) => {
                if (session) {
                    this.getUser({
                        where: {
                            id: session.get('userId')
                        }
                    }).then((user) => {
                        if (user) {
                            if (user.roles && user.roles.split(',').includes('ROLE_SUPER_ADMIN')) {
                                defer.resolve(this.updateSession(session, user));
                            } else {
                                defer.resolve(this.updateSession(session, user));
                            }
                        } else {
                            defer.reject('invalid_session');
                        }
                    }, (err) => {
                        defer.reject(err);
                    });
                } else {
                    defer.reject('invalid_session');
                }
            }, (err) => {
                defer.reject(err);
            });
        }

        return defer.promise;
    };

    this.getSession = (session) => {
        return sessionCache[session];
    };

    this.deleteSessionCache = (session) => {
        delete sessionCache[session];
    };

    this.updateSession = (session, user) => {
        let data = {
            session: {
                userId: session.userId,
                session: session.session
            },
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                email: user.email
            }
        };

        return sessionCache[session.session] = data;
    };

    this.getUsers = (offset, limit, query) => {
        return w.services.pagination.paginateQuery(w.entities.user, offset, limit, query, ['password']);
    };

    this.getUser = (queryOrId) => {
        if ((!!queryOrId) && (queryOrId.constructor === Object)) {
            return w.entities.user.findOne(queryOrId);
        } else {
            return w.entities.user.findById(queryOrId);
        }
    };

    this.updateUser = (id, data) => {
        let defer = Q.defer();

        delete data.customer;
        this.verifyUser(id, data).then(() => {
            this.getUser(id).then((user) => {
                if (user) {
                    if (user.customer) {
                        delete data.locationId;
                    }

                    if (data.password) {
                        passhash(data.password).hash((err, hash) => {
                            if (err) {
                                defer.reject(err);
                            } else {
                                data.password = hash;
                                user.updateAttributes(data).then((user) => {
                                    defer.resolve(user);
                                }, (err) => {
                                    defer.reject(err);
                                });
                            }
                        });
                    } else {
                        user.updateAttributes(data).then((user) => {
                            defer.resolve(user);
                        }, (err) =>{
                            defer.reject(err);
                        });
                    }
                } else {
                    defer.reject('User not found.');
                }
            }, (err) => {
                defer.reject(err);
            });
        }, (err) => {
            defer.reject(err);
        });

        return defer.promise;
    };

    this.deleteUser = (id) => {
        let defer = Q.defer();

        this.getUser(id).then((user) => {
            if (user) {
                user.destroy().then(() => {
                    defer.resolve();
                }, (err) =>{
                    defer.reject(err);
                });
            } else {
                defer.reject('User not found.');
            }
        }, (err) => {
            defer.reject(err);
        });

        return defer.promise;
    };

    this.createUser = (data) => {
        let defer = Q.defer();

        this.verifyUser(null, data).then(() => {
            if (data.password) {
                passhash(data.password).hash((err, hash) => {
                    if (err) {
                        defer.reject(err);
                    } else {
                        data.password = hash;
                        w.entities.user.create(data).then((user) => {
                            defer.resolve(user);
                        }, (err) => {
                            defer.reject(err);
                        });
                    }
                });
            } else {
                w.entities.user.create(data).then((user) => {
                    defer.resolve(user);
                }, (err) => {
                    defer.reject(err);
                });
            }
        }, (err) => {
            defer.reject(err);
        });

        return defer.promise;
    };

    this.verifyUser = (id, user) => {
        let defer = Q.defer();

        w.entities.user.findOne({
            where: {
                id: {
                    $ne: id
                },
                username: user.username
            }
        }).then((user) => {
            if (user) {
                defer.reject('user_exists');
            } else {
                defer.resolve();
            }
        }, (err) => {
            defer.reject(err);
        });

        return defer.promise;
    };

    this.registerUser = (data) => {

        let defer = Q.defer();

        w.entities.user.findOne({
            where: {
                username: data.user.username
            }
        }).then((user) => {
            if (!user) {
                passhash(data.user.password).hash((err, hash) => {
                    if (err) {
                        defer.reject(err);
                    } else {
                        delete data.user.credits;
                        data.user.roles = 'ROLE_USER';
                        data.user.password = hash;

                        w.entities.user.create(data.user).then((user) => {
                            defer.resolve({
                                user: user
                            });
                        }, (err) => {
                            defer.reject(err);
                        });
                    }
                });
            } else {
                defer.reject('Username taken.');
            }
        }, (err) => {
            defer.reject(err);
        });

        return defer.promise;
    };
};