let groups = [];

async function init() {
    if (!localStorage.judge) {
        let judgeName = prompt('Введите Ваше имя');
        if (judgeName) {
            localStorage.judge = judgeName;
        } else {   
            location.reload();
        }
    }
    let judgeTitle = document.querySelector("#judge_name");
    judgeTitle.innerHTML = `Судья: ${localStorage.judge}`;
    await showGroupsPage();
}

function placeSelected(placeSelect){
    let memberList = document.querySelector('#member_list');
    let groupId = Number(memberList.getAttribute('data-group'));
    let group = groups.find(x => x.id == groupId);
    if (group.type == 'mass_sport') {
        return;
    }
    let otherPlaceSelects = document.querySelectorAll(`.place-select:not(#${placeSelect.id})`);
    if (placeSelect.value != '') {
        for (let i = 0; i < otherPlaceSelects.length; i++) {
            const select = otherPlaceSelects[i];
            const option = select.querySelector(`.place-option[value="${placeSelect.value}"]`);
            select.removeChild(option);
        } 
    }
    if (placeSelect.oldvalue != '') {
        for (let i = 0; i < otherPlaceSelects.length; i++) {
            const select = otherPlaceSelects[i];
            const selectOptions = select.childNodes;
            let inserted = false;
            for (let j = 0; j < selectOptions.length; j++) {
                const selectOption = selectOptions[j];
                if (!selectOption.value) continue;
                if (placeSelect.oldvalue < selectOption.value) {
                    insertOption(placeSelect.oldvalue, select, selectOption, true);
                    inserted = true;
                    break;
                }    
            }
            if (!inserted){
                insertOption(placeSelect.oldvalue, select, null, false);
            }
        }
    }
}

function insertOption(oldvalue, select, selectOption, isBefore){
    let newOption = document.createElement('option');
    newOption.value = oldvalue;
    newOption.text = oldvalue;
    newOption.className = 'place-option';
    if (isBefore){
        select.insertBefore(newOption, selectOption);
    } else {
        select.appendChild(newOption);
    }
}

function danceSelected(groupId, danceId){
    showMembersPage();
    let group = groups.find(x => x.id == groupId);
    let groupName = group.name;
    if (group.type == 'cup'){
        groupName += ' <i class="fa fa-trophy"></i>';
    }
    let danceName = group.dances.find(x => x.id == danceId).name;
    groupName += ` - ${danceName}`;
    document.querySelector("#members_title").innerHTML = groupName;
    let members = group.members.sort((a, b) => {
        if (a.number < b.number) return -1;
        if (a.number > b.number) return 1;
        return 0;
    });
    let memberList = document.querySelector('#member_list');
    memberList.setAttribute("data-group", groupId);
    memberList.setAttribute("data-dance", danceId);
    memberList.innerHTML = '';
    let options = '';
    if (group.type == 'cup') {
        for (let i = 0; i < members.length; i++) {
            options += `<option class="place-option" value="${i+1}">${i+1}</option>`;
        }
    } else {
        for (let i = 1; i <= 3; i++) {
            options += `<option class="place-option" value="${i}">${i}</option>`;
        }
    }
    for (let i = 0; i < members.length; i++) {
        let member = members[i];    
        memberList.innerHTML += 
        `<div class="col-3 border p-0 mb-3 bg-info">
            <p class="text-center">№${member.number}</p>
            <select id="place_${member.id}" class="form-select place-select" aria-label="" onfocus="this.oldvalue=this.value;" onchange="placeSelected(this);this.oldvalue=this.value;">
                <option></option>
                ${options}
            </select>
        </div>`;
    }
    let rates = group.rates.filter(x => x.judge == localStorage.judge && x.dance == danceId);
    for (let i = 0; i < rates.length; i++) {
        const rate = rates[i];
        let placeSelect = document.querySelector(`#place_${rate.member}`);
        placeSelect.value = rate.place;
        placeSelect.oldvalue = '';
        placeSelect.setAttribute('data-rate', rate.id);
        placeSelected(placeSelect);
    }
}

async function saveRates() {
    let placeSelects = Array.from(document.querySelectorAll(`.place-select`));
    let ratesForUpdate = [];
    let ratesForCreate = [];
    let ratesForDelete = [];
    let memberList = document.querySelector('#member_list');
    let group = memberList.getAttribute('data-group');
    let dance = memberList.getAttribute('data-dance');
    let judge = localStorage.judge;
    let selectsForUpdate = placeSelects.filter(x => x.hasAttribute('data-rate'));
    let selectsForCreate = placeSelects.filter(x => !x.hasAttribute('data-rate'));
    for (let i = 0; i < selectsForCreate.length; i++) {
        const select = selectsForCreate[i];
        if (!select.value) continue;
        let member = select.id.replace('place_', '');
        ratesForCreate.push( {
            judge: judge,
            group: Number(group),
            dance: Number(dance),
            member: Number(member),
            place: Number(select.value)
        });       
    }
    for (let i = 0; i < selectsForUpdate.length; i++) {
        const select = selectsForUpdate[i];
        let member = select.id.replace('place_', '');
        if (!select.value) {
            ratesForDelete.push( {
                id:  Number(select.getAttribute('data-rate'))
            }); 
        } else {
            ratesForUpdate.push( {
                id:  Number(select.getAttribute('data-rate')),
                judge: judge,
                group: Number(group),
                member: Number(member),
                place: Number(select.value)
            }); 
        }
    }
    if (ratesForCreate.length != 0) { 
        let response = await fetch('/rate/save', {
            method: 'POST',
            body: JSON.stringify(ratesForCreate)
        });
        if (!response.ok) alert('Ошибка HTTP: ' + response.status);
    }

    if (ratesForUpdate.length != 0) { 
        let response = await fetch('/rate/rerate', {
            method: 'POST',
            body: JSON.stringify(ratesForUpdate)
        });
        if (!response.ok) alert('Ошибка HTTP: ' + response.status);
    }

    if (ratesForDelete.length != 0) { 
        let response = await fetch('/rate/remove', {
            method: 'POST',
            body: JSON.stringify(ratesForDelete)
        });
        if (!response.ok) alert('Ошибка HTTP: ' + response.status);
    }
    await showGroupsPage();
}

async function showGroupsPage(){
    let groupsPage = document.querySelector('#groups_page');
    let membersPage = document.querySelector('#members_page');
    membersPage.classList.add("d-none");
    groupsPage.classList.remove("d-none");

    let response = await fetch('/group?sort=sortOrder ASC&active=true');

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
        let membersCount = group.members.length;
        groupName += ` ${group.name} (участников - ${membersCount})`;
        let buttons = '';
        for (let i = 0; i < group.dances.length; i++) {
            const dance = group.dances[i];
            let ratesCount = group.rates.filter(x => x.judge == localStorage.judge && x.dance == dance.id).length;
            let danceFilledClass = 'btn-outline-info';
            if (membersCount == ratesCount && membersCount != 0) {
                danceFilledClass = 'btn-info';
            }
            buttons += `<button type="button" class="btn ${danceFilledClass}"  onclick="danceSelected(${group.id}, ${dance.id})">${dance.name}</button>`
        }
        groupList.innerHTML += `<li class="list-group-item list-group-item-action">
            <h6>${groupName}</h6>
            <div class="btn-group">
                ${buttons}
            </div>
        </li>`;
    }
}

function showMembersPage(){

    let groupsPage = document.querySelector('#groups_page');
    let membersPage = document.querySelector('#members_page');
    groupsPage.classList.add("d-none");
    membersPage.classList.remove("d-none");
}

init();

