async function startImport() {
  let numbersInput = document.querySelector('#input_numbers');
  let yearsInput = document.querySelector('#input_years');
  const numbers = numbersInput.value;
  const years = yearsInput.value;
  if (!numbers || !years) {
      alert('Неверно заполнена форма!');
      return;
  } 
  let response = await fetch('/sportsman/import', {
      method: 'POST',
      body: JSON.stringify({
        numbers,
        years
      })
  });
  if (!response.ok) {
      alert('Ошибка HTTP: ' + response.status);
      return;
  }
  location.reload();
}

async function startMSImport() {
  let numbersInput = document.querySelector('#input_ms_numbers');
  const numbers = numbersInput.value;
  if (!numbers) {
      alert('Неверно заполнена форма!');
      return;
  } 
  let response = await fetch('/sportsman/importMS', {
      method: 'POST',
      body: JSON.stringify({
        numbers
      })
  });
  if (!response.ok) {
      alert('Ошибка HTTP: ' + response.status);
      return;
  }
  location.reload();
}