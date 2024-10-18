export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // دریافت URL اصلی از مسیر (بدون استفاده از پارامتر data)
  const pathname = url.pathname;
  const originalUrl = pathname.replace(/^\/+/, ''); // حذف "/" از ابتدای مسیر

  if (!originalUrl) {
    return new Response('Original URL is missing', { status: 400 });
  }

  try {
    // تلاش برای دانلود فایل از URL اصلی
    const response = await fetch(`https://${originalUrl}`, {
      headers: request.headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentLength = response.headers.get('Content-Length');
    const newHeaders = new Headers(response.headers);
    newHeaders.set('Content-Disposition', `attachment; filename="${originalUrl.split('/').pop()}"`);
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
    // نمایش خطا و اطلاعات لینک
    return new Response(`Error fetching URL: ${originalUrl}, Error message: ${error.message}`, { status: 400 });
  }
}
