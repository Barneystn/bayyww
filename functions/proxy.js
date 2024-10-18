export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  const originalUrl = url.searchParams.get('url'); // این خط را حذف می‌کنیم
  if (!originalUrl) {
    return new Response('URL parameter is missing', { status: 400 });
  }

  const normalizedUrl = normalizeUrl(originalUrl);
  const blockedDomains = await fetchBlockedDomains();

  if (isDomainBlocked(normalizedUrl, blockedDomains)) {
    return new Response('This domain is not allowed', { status: 403 });
  }

  const encodedData = encodeUrlData(normalizedUrl);
  const { proxiedUrl, watchUrl } = generateUrls(url, encodedData);

  return new Response(renderHtml(proxiedUrl, watchUrl, extractFilename(normalizedUrl)), { 
    headers: { 'Content-Type': 'text/html' } 
  });
}

// استخراج URL اصلی از URL به جای پارامترهای جستجو
function getOriginalUrl(url) {
  const params = new URL(url).search; // قسمت جستجو
  const urlParams = new URLSearchParams(params);
  return urlParams.get('url');
}

// عادی‌سازی URL با اضافه کردن پروتکل در صورت لزوم
function normalizeUrl(url) {
  if (!/^https?:\/\//i.test(url)) {
    return 'http://' + url;
  }
  return url;
}

// Fetch blocked domains from a remote source
async function fetchBlockedDomains() {
  try {
    const response = await fetch('https://raw.githubusercontent.com/MinitorMHS/CF_Web_Proxy/main/Functions/blacklist.txt');
    if (response.ok) {
      const blacklistContent = await response.text();
      return blacklistContent.split('\n').filter(domain => domain.trim() !== '');
    } else {
      console.error('Error fetching blacklist:', response.statusText);
    }
  } catch (error) {
    console.error('Error fetching blacklist:', error);
  }
  return [];
}

// Check if the domain is in the blocked list
function isDomainBlocked(url, blockedDomains) {
  const requestedDomain = new URL(url).hostname;
  return blockedDomains.includes(requestedDomain);
}

// Encode the original URL and filename for the final URLs
function encodeUrlData(url) {
  const filename = extractFilename(url);
  return btoa(JSON.stringify({ url, filename }));
}

// Extract filename from URL
function extractFilename(url) {
  return url.split('/').pop();
}

// Generate download and watch URLs based on the request's hostname
function generateUrls(requestUrl, encodedData) {
  const isCustomDomain = requestUrl.hostname === 'your-custom-domain.com';
  const baseDomain = isCustomDomain ? 'https://your-domain.ir.cdn.ir' : requestUrl.origin;
  
  return {
    proxiedUrl: `${baseDomain}/download?data=${encodedData}`,
    watchUrl: `${baseDomain}/watch?data=${encodedData}`
  };
}

// Generate HTML content
function renderHtml(proxiedUrl, watchUrl, filename) {
  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #a9a9a9; }
          .container { background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); text-align: center; margin-bottom: 20px; }
          h1 { color: #333; }
          #downloadLink, #watchLink { word-break: break-all; color: #007bff; margin-bottom: 30px; }
          .button-container { display: flex; flex-direction: column; gap: 10px; margin-top: 20px; }
          .button { padding: 20px 40px; color: white; border: none; border-radius: 20px; cursor: pointer; text-decoration: none; font-size: 18px; width: 200px; }
          .download-button { background-color: #228b22; }
          .download-button:hover { background-color: #1e7b1e; }
          .watch-button { background-color: #4682b4; }
          .watch-button:hover { background-color: #3b6a8a; }
          .filename { font-weight: bold; }
        </style>
      </head>
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
  `;
}
