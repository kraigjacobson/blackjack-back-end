'use strict';

const Sequelize = require('sequelize');

module.exports = function(w) {
    let entity = w.mysql.define('user', {
        username: Sequelize.STRING(50),
        password: Sequelize.STRING(512),
        roles: Sequelize.STRING,
        name: Sequelize.STRING,
        email: Sequelize.STRING,
        location: Sequelize.STRING,
        credits: Sequelize.INTEGER
    }, {
        indexes: [
            {
                fields: ['username']
            }
        ]
    });
    return entity;
};