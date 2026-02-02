// Fetch from the API endpoint
fetch('/api/health')
  .then(response => response.json())
  .then(data => {
    document.getElementById('api-response').textContent = JSON.stringify(data, null, 2);
  })
  .catch(err => {
    document.getElementById('api-response').textContent = 'Error: ' + err.message;
  });
