let groups = [];

async function init() {
    let response = await fetch('/group?sort=sortOrder ASC');

    if (response.ok) {
        groups = await response.json();
    } else {
        alert('Ошибка HTTP: ' + response.status);
    }

    let groupList = document.querySelector('#group_list');
    groupList.innerHTML = '';
    for (let i = 0; i < groups.length; i++) {
        let group = groups[i];
        let groupName = '';
        if (group.type == 'cup'){
            groupName += ' <i class="fa fa-trophy"></i>';
        }
        groupName += ` ${group.name} (участников - ${group.members.length})`;
        groupList.innerHTML += `<h4>${groupName}</h4>`;
        let tableInfos = [];
        group.members = group.members.sort((a, b) => {
            if (a.number < b.number) return -1;
            if (a.number > b.number) return 1;
            return 0;
        });
        for (let j = 0; j < group.members.length; j++) {
            const member = group.members[j];
            let memberRates = group.rates.filter(x => x.member == member.id);
            let memberPlaces = memberRates.map(x => x.place);
            let result = 0;
            if (group.type == 'cup'){
                result = memberPlaces.reduce( ( p, c ) => p + c, 0 );
            } else {
                result = average(memberPlaces) || 0;
            }
            let memberRatesByDanceName = groupByKey(memberRates, 'dance');
            let judging = '';
            for (const dance in memberRatesByDanceName) {
                let danceName = group.dances.find(x => x.id == dance).name;
                const rates = memberRatesByDanceName[dance].sort((a, b) => {
                    if (a.judge < b.judge) return -1;
                    if (a.judge > b.judge) return 1;
                    return 0;
                  });
                let danceRates = rates.map(x => `${x.judge[0]}-${x.place}`);
                judging += `<b>${danceName}</b>: ${danceRates.join(', ')}<br/>`;
            }
            tableInfos.push({
                row: `<tr><td>${member.number}</td><td>${member.name}</td><td>${judging}</td><td>${result.toFixed(1)}</td><td>${memberPlaces.length}</td></tr>`,
                result: result
            });
        }
        let tableInfo = '';
        if (group.type == 'cup'){
            tableInfo = tableInfos.sort((a, b) => {
                if (a.result < b.result) return -1;
                if (a.result > b.result) return 1;
                return 0;
              }).map(x => x.row).join('');
        } else {
            tableInfo = tableInfos.map(x => x.row).join('');
        }
        groupList.innerHTML += `<table class="table table-bordered">
            <thead><tr><th>№</th><th>Имя</th><th>Судейство</th><th>Результат</th><th>Количество оценок</th></tr></thead>
            <tbody>${tableInfo}</tbody>
        </table>`;
    }
}

const average = arr => arr.reduce( ( p, c ) => p + c, 0 ) / arr.length;

function groupByKey(array, key) {
    return array
      .reduce((hash, obj) => {
        if(obj[key] === undefined) return hash; 
        return Object.assign(hash, { [obj[key]]:( hash[obj[key]] || [] ).concat(obj)})
      }, {})
}

init();

