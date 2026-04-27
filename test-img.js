const url = 'https://pps.whatsapp.net/v/t61.24694-24/491866770_696900593050535_4756843627912305928_n.jpg?ccb=11-4&oh=01_Q5Aa4QFDC25OSrFMCcddApH8kP3TvzAA0oCoFvNQB-aOtch0Yw&oe=69FD077C&_nc_sid=5e03e0&_nc_cat=103';

fetch(url)
  .then(async (res) => {
    console.log('Status:', res.status, res.statusText);
    const arrayBuffer = await res.arrayBuffer();
    console.log('Size:', arrayBuffer.byteLength);
  })
  .catch(err => {
    console.error('Error:', err);
  });
