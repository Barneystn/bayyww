export async function onRequest(context) {
  const { request } = context;

  const encodedData = await getEncodedData(request);
  if (!encodedData) {
    return new Response('Data parameter is missing', { status: 400 });
  }

  try {
    const { url: decodedUrl, filename } = parseEncodedData(encodedData);
    const response = await fetchResource(decodedUrl, request.headers);

    return createResponse(response, filename, request.headers);
  } catch (error) {
    return new Response(`Error: ${error.message}`, { status: 400 });
  }
}

// دریافت داده‌های رمزگذاری شده از URL
async function getEncodedData(request) {
  const url = new URL(request.url);
  return url.searchParams.get('data'); // با توجه به اینکه از URL داده می‌گیریم، اینجا نیاز به ورودی داریم
}

// تجزیه داده‌های رمزگذاری شده
function parseEncodedData(encodedData) {
  const decodedString = atob(encodedData);
  return JSON.parse(decodedString);
}

// Fetch کردن منبع از URL
async function fetchResource(url, headers) {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response;
}

// ایجاد پاسخ با هدرهای مناسب
async function createResponse(response, filename, requestHeaders) {
  const contentLength = response.headers.get('Content-Length');
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Content-Disposition', `attachment; filename="${filename}"`);
  newHeaders.set('Accept-Ranges', 'bytes');

  if (contentLength) {
    newHeaders.set('Content-Length', contentLength);
  }

  const range = requestHeaders.get('Range');
  if (range) {
    return handleRangeRequest(response, range, contentLength, newHeaders);
  } else {
    return new Response(response.body, {
      status: 200,
      headers: newHeaders,
    });
  }
}

// مدیریت درخواست‌های Range
function handleRangeRequest(response, range, contentLength, newHeaders) {
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
}
