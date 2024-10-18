export async function onRequest(context) {
  const { request } = context;

  if (request.method !== 'POST') {
    return new Response('Only POST method is allowed', { status: 405 });
  }

  let requestBody;
  try {
    requestBody = await request.json();
  } catch (error) {
    return new Response('Invalid JSON', { status: 400 });
  }

  const originalUrl = requestBody.url;
  if (!originalUrl) {
    return new Response('URL is missing in the request body', { status: 400 });
  }

  if (!/^https?:\/\//i.test(originalUrl)) {
    return new Response('Invalid URL format', { status: 400 });
  }

  try {
    // Fetch کردن فایل از URL اصلی
    const response = await fetch(originalUrl, { headers: request.headers });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const filename = originalUrl.split('/').pop();
    const contentLength = response.headers.get('Content-Length');
    const newHeaders = new Headers(response.headers);
    newHeaders.set('Content-Disposition', `attachment; filename="${filename}"`);
    newHeaders.set('Accept-Ranges', 'bytes');

    if (contentLength) {
      newHeaders.set('Content-Length', contentLength);
    }

    const range = request.headers.get('Range');
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : contentLength - 1;
      const chunksize = (end - start) + 1;

      newHeaders.set('Content-Range', `bytes ${start}-${end}/${contentLength}`);
      newHeaders.set('Content-Length', chunksize.toString());

      return new Response(response.body, {
        status: 206,
        headers: newHeaders,
      });
    } else {
      return new Response(response.body, {
        status: 200,
        headers: newHeaders,
      });
    }
  } catch (error) {
    return new Response(`Error: ${error.message}`, { status: 400 });
  }
}
