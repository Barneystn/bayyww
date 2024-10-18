export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  let originalUrl = searchParams.get('url');
  if (!originalUrl) {
    return new Response('URL parameter is missing', { status: 400 });
  }

  if (!/^https?:\/\//i.test(originalUrl)) {
    originalUrl = 'http://' + originalUrl;
  }

  // Fetch the blacklist from a remote text file
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

  // بدون نیاز به پارامترهای اضافی، لینک مستقیم را در آدرس قرار می‌دهیم
  let proxiedUrl = `https://edge31.562061.ir.cdn.ir/${originalUrl.replace(/^https?:\/\//, '')}`;

  return new Response(`
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #a9a9a9; }
          .container { background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); text-align: center; margin-bottom: 20px; }
          h1 { color: #333; }
          #downloadLink { word-break: break-all; color: #007bff; margin-bottom: 30px; }
          .button-container { display: flex; flex-direction: column; gap: 10px; margin-top: 20px; }
          .button { padding: 20px 40px; color: white; border: none; border-radius: 20px; cursor: pointer; text-decoration: none; font-size: 18px; width: 200px; }
          .download-button { background-color: #228b22; }
          .download-button:hover { background-color: #1e7b1e; }
          .filename { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Download</h1>
          <p id="downloadLink">${proxiedUrl}</p>
          <a href="${proxiedUrl}" class="button download-button">Download</a>
        </div>
      </body>
    </html>
  `, { headers: { 'Content-Type': 'text/html' } });
}
