const rp = require('request-promise');
const tough = require('tough-cookie');
const https = require('https');
const cheerio = require('cheerio');
const iconvlite = require('iconv-lite');
const moment = require('moment');

const DOMAIN = 'https://dance.vftsarr.ru/';
const MS_DOMAIN = 'https://smm.vftsarr.ru/';

module.exports = {
  import: async function (req, res) {
    if (!req.body.numbers) res.badRequest('numbers not found');
    if (!req.body.years) res.badRequest('years not found');
    try {
      const agent = new https.Agent({ rejectUnauthorized: false });
      const jar = new tough.CookieJar();
      const numbers = req.body.numbers.trim().split(',');
      const years = req.body.years.trim().split(',');
      const results = [];
      for (let i = 0; i < numbers.length; i++) {
        const number = numbers[i];
        const numberResults = [];
        let name = '';
        let birthYear = 0;
        for (let j = 0; j < years.length; j++) {
          const year = years[j];
          const response = await rp({
            method: 'POST',
            uri: `${DOMAIN}/index.php`,
            qs:{
              Do: 'Search',
              id: '0'
            },
            form: {
              Book_No: number,
              Year: year,
              Dancer_Class: 'All',
              Dancer_Program: '0'
            },
            encoding: null,
            agent,
            jar
          });
          const body = Buffer.from(response, 'binary');
          const page = iconvlite.decode(body, 'windows-1251');
          const $ = cheerio.load(page);
          const infoTable = $('table.bugitable')[0];
          name = $(infoTable).find('tbody tr:nth-child(5) > td:nth-child(2)').text().trim();
          birthYear = Number($(infoTable).find('tbody tr:nth-child(8) > td:nth-child(2)').text().trim().substr(6));
          const resultsTable = $('table.bugitable')[1];
          const rawResultTrs = $(resultsTable).find('tbody tr');
          for (let k = 0; k < rawResultTrs.length; k+=2 ) {
            const resultName = rawResultTrs[k];
            const resultValue = rawResultTrs[k+1];
            const dates = $(resultName).find('td > b').text().trim();
            const startDateRaw = dates.split(' - ')[0];
            const endDateRaw = dates.includes(' - ') ? dates.split(' - ')[1] : dates;
            const competitionPlaces = $(resultValue).find('td:nth-child(4)').text().trim();
            const classPlaces = $(resultValue).find('td:nth-child(5)').text().trim();
            const points = Number($(resultValue).find('td:nth-child(6)').text().trim().replace(',', '.'));
            const result = {
              startDate: moment(startDateRaw, 'DD.MM.YYYY').valueOf(),
              endDate: moment(endDateRaw, 'DD.MM.YYYY').valueOf(),
              competitionName: $(resultName).find('td > a:nth-child(2)').text().trim(),
              programName: $(resultName).find('td > a:nth-child(3)').text().trim(),
              sportsmanClass: $(resultValue).find('td:nth-child(3)').text().trim(),
              competitionPlace: Number(competitionPlaces.split('/')[0]),
              competitionCount: Number(competitionPlaces.split('/')[1]),
              classPlace: Number(classPlaces.split('/')[0]),
              classCount: Number(classPlaces.split('/')[1]),
              points: points,
            };
            numberResults.push(result);
          }
        }
        
        results.push({
          number: number,
          name: name,
          birthYear: birthYear,
          type: 'sport',
          results: numberResults
        });
      }
      const sportsmenNumbers = results.map(x => x.number);
      const existingSportsmen = await Sportsman.find({number: sportsmenNumbers}).populate('results');
      const existingSportsmenNumbers = existingSportsmen.map(x => x.number);
      const sportsmen = results.map(x => { 
        return { 
          number: x.number, 
          name: x.name, 
          birthYear: x.birthYear, 
          type: x.type 
        }
      });
      const sportsmenForCreation = sportsmen.filter(x => !existingSportsmenNumbers.includes(x.number))
      let createdSportsmen = [];
      if (sportsmenForCreation.length){
        createdSportsmen = await Sportsman.createEach(sportsmenForCreation).fetch();
        const resultsForCreation = results
          .filter(x => !existingSportsmenNumbers.includes(x.number))
          .map(x => { 
            return x.results.map(y => {
              return {
                ...y,
                sportsman: createdSportsmen.find(z => z.number == x.number).id
              };
            }); 
          })
          .reduce((a, b) => a.concat(b), []);
          if (resultsForCreation.length){
            await Result.createEach(resultsForCreation);
          }
      }
      const existingSportsmenResults = existingSportsmen
        .map(x => x.results)
        .reduce((a, b) => a.concat(b), [])
        .map(x => `${x.sportsman}${x.startDate}${x.endDate}${x.competitionName}${x.programName}`);
      const existingSportsmenResultsForCreation = results
        .filter(x => existingSportsmenNumbers.includes(x.number))
        .map(x => { 
          return x.results.map(y => {
            return {
              ...y,
              sportsman: createdSportsmen.find(z => z.number == x.number) ? createdSportsmen.find(z => z.number == x.number).id : existingSportsmen.find(z => z.number == x.number).id
            };
          }); 
        })
        .reduce((a, b) => a.concat(b), [])
        .filter(x => !existingSportsmenResults.includes(`${x.sportsman}${x.startDate}${x.endDate}${x.competitionName}${x.programName}`));
      if (existingSportsmenResultsForCreation.length){
        await Result.createEach(existingSportsmenResultsForCreation);
      }
      res.ok();
    } catch (error) {
      res.badRequest(error.message);
    }
  },
  importMS: async function (req, res) {
    if (!req.body.numbers) res.badRequest('numbers not found');
    try {
      const agent = new https.Agent({ rejectUnauthorized: false });
      const jar = new tough.CookieJar();
      const numbers = req.body.numbers.trim().split(',');
      const results = [];
      for (let i = 0; i < numbers.length; i++) {
        const number = numbers[i];
        const numberResults = [];
        const url = `${MS_DOMAIN}/?DancerName=${number}&id=6`;
        const response = await rp({
          method: 'GET',
          uri: url,
          headers: {
            'Upgrade-Insecure-Requests': '1',
            'Referer': url
          },
          agent,
          jar
        });
        const $ = cheerio.load(response);
        const name = $('div.card:nth-child(2) table tbody tr:nth-child(3) > td:nth-child(2)').text();
        const birthYear = Number($('div.card:nth-child(2) table tbody tr:nth-child(4) > td:nth-child(2)').text());
        const rawResultTrs = $('div.card:nth-child(3) table tbody tr');
        for (let j = 0; j < rawResultTrs.length; j+=2 ) {
          const resultName = rawResultTrs[j];
          const resultValue = rawResultTrs[j+1];
          const resultNameRaw = $(resultName).text().trim();
          const date = resultNameRaw.substr(0, resultNameRaw.indexOf(" "));
          const points = Number($(resultValue).find('td:nth-child(4)').text().trim().replace('Балл: ', ''));
          const result = {
            startDate: moment(date, 'DD.MM.YYYY').valueOf(),
            endDate: moment(date, 'DD.MM.YYYY').valueOf(),
            competitionName: $(resultName).find('td > a:nth-child(1)').text().trim(),
            programName: $(resultName).find('td > a:nth-child(2)').text().trim(),
            points: points,
            sportsmanClass: "H"
          };
          const competitionUrl = MS_DOMAIN + '/' + $(resultName).find('td > a:nth-child(2)').attr('href');
          const competitionResponse = await rp({
            method: 'GET',
            uri: competitionUrl,
            headers: {
              'Upgrade-Insecure-Requests': '1',
              'Referer': competitionUrl
            },
            agent,
            jar
          });
          const $$ = cheerio.load(competitionResponse);
          const membersCount = 
            Number($$('div.panel-body div:nth-child(2) table tbody tr:nth-child(4) td:nth-child(2)').text().trim());
          let place = 0;
          const protocolRows = $$('div.panel-body div:nth-child(5) table tbody tr');
          for (let k = 0; k < protocolRows.length; k++) {
            const row = protocolRows[k];
            if ($$(row).find('td:nth-child(3)').text() != name) continue;
            place = Number($$(row).find('td:nth-child(1)').text());
          }
          result.competitionPlace = place;
          result.competitionCount = membersCount;
          result.classPlace = place;
          result.classCount = membersCount;
          numberResults.push(result);
        }
        
        results.push({
          number: number,
          name: name,
          birthYear: birthYear,
          type: 'ms',
          results: numberResults
        });
      }
      if (!results.length) return res.ok();
      const sportsmenNumbers = results.map(x => x.number);
      await Sportsman.destroy({number: sportsmenNumbers});
      const sportsmen = results.map(x => { 
        return { 
          number: x.number, 
          name: x.name, 
          birthYear: x.birthYear, 
          type: x.type 
        }
      });
      const createdSportsmen = await Sportsman.createEach(sportsmen).fetch();
      const resultsForCreation = results
        .map(x => { 
          return x.results.map(y => {
            return {
              ...y,
              sportsman: createdSportsmen.find(z => z.number == x.number).id
            };
          }); 
        })
        .reduce((a, b) => a.concat(b), []);
      if (resultsForCreation.length){
        await Result.createEach(resultsForCreation);
      }
      res.ok();
    } catch (error) {
      res.badRequest(error.message);
    }
  }
};