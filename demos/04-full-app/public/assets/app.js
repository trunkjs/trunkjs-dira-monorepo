// Fetch health check endpoint
fetch('/health')
  .then(response => response.json())
  .then(data => {
    document.getElementById('health-response').textContent = JSON.stringify(data, null, 2);
  })
  .catch(err => {
    document.getElementById('health-response').textContent = 'Error: ' + err.message;
  });
