'use strict';

const Sequelize = require('sequelize');

module.exports = function(w) {
    let entity = w.mysql.define('user', {
        username: Sequelize.STRING(50),
        password: Sequelize.STRING(512),
        roles: Sequelize.STRING,
        credits: {
            type: Sequelize.INTEGER,
            defaultValue: 400
        }
    }, {
        timestamps: false,
        indexes: [
            {
                fields: ['username']
            }
        ]
    });
    return entity;
};