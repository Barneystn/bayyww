export async function onRequest(context) {
  const { request } = context;

  if (request.method !== 'POST') {
    return new Response('Only POST requests are allowed', { status: 405 });
  }

  let data;
  try {
    data = await request.json(); // دریافت داده‌ها به صورت JSON
  } catch (e) {
    return new Response('Invalid JSON', { status: 400 });
  }

  let originalUrl = data.url;
  if (!originalUrl) {
    return new Response('URL parameter is missing', { status: 400 });
  }

  if (!/^https?:\/\//i.test(originalUrl)) {
    originalUrl = 'http://' + originalUrl;
  }

  // بارگذاری لیست سیاه
  let blockedDomains = [];
  try {
    const response = await fetch('https://raw.githubusercontent.com/MinitorMHS/CF_Web_Proxy/main/Functions/blacklist.txt');
    if (response.ok) {
      const blacklistContent = await response.text();
      blockedDomains = blacklistContent.split('\n').filter(domain => domain.trim() !== '');
    } else {
      console.error('Error fetching blacklist:', response.statusText);
    }
  } catch (error) {
    console.error('Error fetching blacklist:', error);
  }
  
  const requestedDomain = new URL(originalUrl).hostname;
  if (blockedDomains.includes(requestedDomain)) {
    return new Response('This domain is not allowed', { status: 403 });
  }

  const filename = originalUrl.split('/').pop();
  const encodedData = btoa(JSON.stringify({ url: originalUrl, filename: filename }));

  let proxiedUrl;
  let watchUrl;
  if (url.hostname === 'your-custom-domain.com') {
    proxiedUrl = `https://your-domain.ir.cdn.ir/download?data=${encodedData}`;
    watchUrl = `https://your-domain.ir.cdn.ir/watch?data=${encodedData}`;
  } else {
    proxiedUrl = `${url.origin}/download?data=${encodedData}`;
    watchUrl = `${url.origin}/watch?data=${encodedData}`;
  }

  return new Response(`
    <html>
      <body>
        <div class="container">
          <h1>Watch</h1>
          <p id="watchLink">${watchUrl}</p>
          <a href="${watchUrl}" class="button watch-button">Watch</a>
        </div>
        <div class="container">
          <h1>Download</h1>
          <p id="downloadLink">${proxiedUrl}</p>
          <a href="${proxiedUrl}" class="button download-button">Download</a>
        </div>
        <p class="filename">Filename: ${filename}</p>
      </body>
    </html>
  `, { headers: { 'Content-Type': 'text/html' } });
}
