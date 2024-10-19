export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  try {
    // جایگزین کردن داده‌هایی که قبلاً از URL گرفته می‌شد با مقدارهای ثابت یا پردازش دیگر
    const decodedUrl = 'https://example.com/file';  // مقدار URL مورد نظر
    const filename = 'file.txt';  // نام فایل

    const response = await fetch(decodedUrl, {
      headers: request.headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

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
