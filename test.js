const url = 'https://dify-hivehit.42jfnm.easypanel.host/api/v1/contacts/558381368780/profile-picture';
const apiKey = '84b69eff-3dcf-4cdd-a9ac-77531800832d';

fetch(url, {
  method: 'GET',
  headers: {
    'X-API-Key': apiKey,
    'Content-Type': 'application/json'
  }
})
  .then(async (res) => {
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Body:', text);
  })
  .catch((err) => {
    console.error('Error:', err.message);
  });
