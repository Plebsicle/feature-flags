// /pages/api/proxy/[...path].ts
import type { NextApiRequest, NextApiResponse } from 'next'

export const config = {
  api: {
    bodyParser: false, // IMPORTANT!
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path = [] } = req.query;
  const targetPath = Array.isArray(path) ? path.join('/') : path;
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
  const targetUrl = `${BACKEND_URL}/${targetPath}`;

  // Get request body
  let body = undefined;
  if (!['GET', 'HEAD'].includes(req.method || '')) {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    body = Buffer.concat(chunks);
  }

  // Stream the body
  const fetchResponse = await fetch(targetUrl, {
    method: req.method,
    headers: {
      ...req.headers,
      host: "big-boss-toucan.ngrok-free.app",
      'ngrok-skip-browser-warning': 'true'
    } as any,
    body,
    redirect: 'manual',
  });

  // Pipe headers
  fetchResponse.headers.forEach((value, name) => {
    if (name.toLowerCase() === 'set-cookie') {
      const cookies = fetchResponse.headers.getSetCookie?.() ?? [];
      cookies.forEach(cookie => res.appendHeader('Set-Cookie', cookie));
    } else {
      res.setHeader(name, value);
    }
  });

  const buffer = await fetchResponse.arrayBuffer();
  res.status(fetchResponse.status).send(Buffer.from(buffer));
}




