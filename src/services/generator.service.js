'use strict';

const Q = require('q');

module.exports = function(w) {
    this.createLocation = () => {
        let defer = Q.defer();
        let name = this.createName(Math.ceil((Math.random()*8)+1));
        let type = this.getRandomType();
        let pop = this.getRandomPopulation(type);

        w.entities.location.create({
            name: name,
            type: type,
            population: pop
        });

        return defer.promise;
    };

    this.createName = (numberOfLetters) => {
        let consonants = [ 'b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'q', 'qu', 'r', 's', 't', 'v', 'w', 'x', 'y' ];
        let vowels = [ 'a', 'e', 'i', 'o', 'u' ];
        let name = '';
        let lastIsVowel;
        let next;
        if (Math.random() < .5) { lastIsVowel = true; }
        for ( let i = 0; i < numberOfLetters; i++) {
            if (lastIsVowel) { next = consonants; lastIsVowel = false; } else { next = vowels; lastIsVowel = true; }
            name += this.getRandomFromArray(next);
        }
        return name;
    };

    this.getRandomType = () => {
        let types = ['planet', 'station', 'outpost'];
        return this.getRandomFromArray(types);
    };

    this.getRandomPopulation = (type) => {
        let locationTypes = {
            planet: {
                min: 100,
                max: 2000
            },
            station: {
                min: 100,
                max: 2000,
            },
            outpost: {
                min: 1,
                max: 100
            }
        };

        return this.getRandomNumber(locationTypes[type].min,locationTypes[type].max);
    };

    this.getRandomFromArray = (array) => {
        return array[Math.floor(Math.random()*array.length)];
    };
    this.getRandomNumber = (min, max) => {
        return Math.floor(Math.random() * max) + min;
    };

    this.createLocation();

};