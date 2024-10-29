export async function onRequest(context) {
  const { request } = context;

  // چک می‌کنیم که درخواست `POST` است یا خیر
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    // دریافت و تجزیه JSON ورودی
    const { url: originalUrl } = await request.json();

    if (!originalUrl) {
      return new Response('URL parameter is missing', { status: 400 });
    }

    // افزودن http در صورتی که لینک بدون پروتکل باشد
    let validUrl = originalUrl;
    if (!/^https?:\/\//i.test(validUrl)) {
      validUrl = 'http://' + validUrl;
    }

    const filename = validUrl.split('/').pop();
    const encodedData = btoa(JSON.stringify({ url: validUrl, filename: filename }));

    // ساخت لینک‌های پروکسی
    const proxiedUrl = `${new URL(request.url).origin}/download?data=${encodedData}`;
    const watchUrl = `${new URL(request.url).origin}/watch?data=${encodedData}`;

    return new Response(`
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background-color: #f0f0f0;
            }
            .container {
              background-color: white;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
              text-align: center;
            }
            .link {
              color: #007bff;
              word-break: break-all;
              margin-top: 10px;
              display: block;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Your Links</h2>
            <a href="${watchUrl}" class="link">Watch</a>
            <a href="${proxiedUrl}" class="link">Download</a>
            <p><strong>Filename:</strong> ${filename}</p>
          </div>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });

  } catch (error) {
    return new Response(`Error processing request: ${error.message}`, { status: 400 });
  }
}
