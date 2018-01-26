'use strict';

const Sequelize = require('sequelize');

module.exports = function(w) {
    let entity = w.mysql.define('location', {
        name: Sequelize.STRING(50),
        type: Sequelize.STRING,
        population: Sequelize.STRING,
    }, {
        indexes: [
            {
                fields: ['name']
            }
        ]
    });
    return entity;
};