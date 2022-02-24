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
    let groupSelect = document.querySelector('#input_group_for_member');
    for (let i = 0; i < groups.length; i++) {
        let group = groups[i];
        insertOption(group.id, group.name, groupSelect);
        let groupName = '';
        if (group.type == 'cup'){
            groupName += ' <i class="fa fa-trophy"></i>';
        }
        groupName += ` ${group.name} (участников - ${group.members.length})`;
        let active = group.active;
        let groupStatus = 'Активировать';
        let buttonColor = 'btn-outline-success';
        if (active) {
            groupStatus = 'Деактивировать';
            buttonColor = 'btn-outline-danger';
        }
        groupList.innerHTML += `<div class="d-flex justify-content-between">
            <h4>${groupName}</h4>
            <div class="btn-group">
                <a href="javascript:void(0)" class="btn btn-sm ${buttonColor}" onclick="setGroupStatus(${group.id}, ${group.active})">${groupStatus}</a>
                <a href="javascript:void(0)" class="btn btn-sm btn-outline-danger" onclick="deleteGroup(${group.id})">Удалить</a>
            </div>
        </div>`;
        let tableInfos = [];
        group.members = group.members.sort((a, b) => {
            if (a.number < b.number) return -1;
            if (a.number > b.number) return 1;
            return 0;
        })
        for (let j = 0; j < group.members.length; j++) {
            const member = group.members[j];
            tableInfos.push(`<tr><td>${member.number}</td><td>${member.name}</td><td><a href="javascript:void(0)" class="btn btn-sm btn-danger" onclick="deleteMember(${member.id})">Удалить</a></td></tr>`);
        }
        let tableInfo = tableInfos.join('');
        groupList.innerHTML += `<table class="table">
            <thead><tr><th>№</th><th>Имя</th><th></th></tr></thead>
            <tbody>${tableInfo}</tbody>
        </table>`;
    }
}

function insertOption(value, name, select){
    let newOption = document.createElement('option');
    newOption.value = value;
    newOption.text = name;
    select.appendChild(newOption);
}

async function addMember(){
    let nameInput = document.querySelector('#input_member_name');
    let numberInput = document.querySelector('#input_member_number');
    let groupSelected = document.querySelector('#input_group_for_member');
    let name = nameInput.value;
    let number = numberInput.value;
    let group = groupSelected.value;
    if (!name || !number || !group) {
        alert('Неверно заполнена форма!');
        return;
    }
    let memberForCreate = {
        "name": name,
        "number": number,
        "group": Number(group)
    };  
    let response = await fetch('/member', {
        method: 'POST',
        body: JSON.stringify(memberForCreate)
    });
    if (!response.ok) {
        alert('Ошибка HTTP: ' + response.status);
        return;
    }
    location.reload();
}

async function addGroup() {
    let nameInput = document.querySelector('#input_group_name');
    let sortOrderInput = document.querySelector('#input_group_number');
    let typeRadios = document.getElementsByName('groupType');
    let type = '';
    for (var i = 0, length = typeRadios.length; i < length; i++) {
        if (typeRadios[i].checked) {
            type = typeRadios[i].value;
            break;
        }
    }
    let dances = [];
    addDance('#sw', dances);
    addDance('#tango', dances);
    addDance('#vw', dances);
    addDance('#quick', dances);
    addDance('#samba', dances);
    addDance('#ch', dances);
    addDance('#rumba', dances);
    addDance('#jive', dances);
    addDance('#choreo', dances);
    let name = nameInput.value;
    let sortOrder = sortOrderInput.value;

    if (!name || !sortOrder || !dances.length) {
        alert('Неверно заполнена форма!');
        return;
    }
    let groupForCreate = {
        name: name,
        sortOrder: sortOrder,
        type: type,
        dances: dances,
        active: false
    };  
    let response = await fetch('/group/add', {
        method: 'POST',
        body: JSON.stringify(groupForCreate)
    });
    if (!response.ok) {
        alert('Ошибка HTTP: ' + response.status);
        return;
    }
    location.reload();
}

function addDance(id, dances){
    let input = document.querySelector(id);
    if (input.checked) {
        dances.push({name: input.value})
    }
}

async function deleteMember(id) {
    let response = await fetch(`/member/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        alert('Ошибка HTTP: ' + response.status);
        return;
    }
    location.reload();
}

async function deleteGroup(id) {
    let response = await fetch(`/group/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        alert('Ошибка HTTP: ' + response.status);
        return;
    }
    location.reload();
}

async function setGroupStatus(id, active) {
    let response = await fetch(`/group/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({active: !active,})
    });
    if (!response.ok) {
        alert('Ошибка HTTP: ' + response.status);
        return;
    }
    location.reload();
}

init();