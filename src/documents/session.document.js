'use strict';

module.exports = function(w) {
    let document = w.mongo.model('session', new w.mongo.Schema({
        userId: String,
        session: String,
        data: {}
    }));
    return document;
};