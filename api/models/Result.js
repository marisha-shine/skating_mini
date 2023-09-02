/**
 * Result.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    startDate: {
      type: 'number',
      required: true
    },
    endDate: {
      type: 'number',
      required: true
    },
    competitionName: {
      type: 'string',
      required: true,
    },
    programName: {
      type: 'string',
      required: true,
    },
    sportsmanClass: {
      type: 'string',
      required: true,
    },
    competitionPlace: {
      type: 'number',
      required: true,
    },
    competitionCount: {
      type: 'number',
      required: true,
    },
    classPlace: {
      type: 'number',
      required: true,
    },
    classCount: {
      type: 'number',
      required: true,
    },
    points: {
      type: 'number',
      required: true,
    },
    sportsman: {
      model: 'sportsman'
    }
  },

};

