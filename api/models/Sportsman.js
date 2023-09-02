/**
 * Sportsman.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    name: {
      type: 'string',
      required: true
    },
    number: {
      type: 'string',
      required: true
    },
    birthYear: {
      type: 'number',
      required: true
    },
    type: {
      type: 'string',
      isIn: ['sport', 'ms'],
      defaultsTo: 'sport'
    },
    results: {
      collection: 'result',
      via: 'sportsman'
    }
  },

};

