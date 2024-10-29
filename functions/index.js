export async function onRequest(context) {
  return new Response(`
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Web Proxy</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
          }
          .container {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          input[type="text"] {
            padding: 10px;
            width: 300px;
            margin-bottom: 10px;
          }
          button {
            padding: 10px 20px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
          }
          button:hover {
            background-color: #0056b3;
          }
          .result {
            margin-top: 20px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Enter URL</h2>
          <input type="text" id="urlInput" placeholder="Enter URL" required>
          <button onclick="submitUrl()">Go</button>
          <div class="result" id="result"></div>
        </div>

        <script>
          async function submitUrl() {
            const urlInput = document.getElementById('urlInput').value;

            try {
              const response = await fetch('/proxy', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url: urlInput })
              });

              if (response.ok) {
                const resultHtml = await response.text();
                document.getElementById('result').innerHTML = resultHtml;
              } else {
                document.getElementById('result').textContent = 'Error: ' + response.statusText;
              }
            } catch (error) {
              document.getElementById('result').textContent = 'Error: ' + error.message;
            }
          }
        </script>
      </body>
    </html>
  `, { headers: { 'Content-Type': 'text/html' } });
}
