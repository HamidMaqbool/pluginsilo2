import express from 'express';
import path from 'path';
import https from 'https';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Transparent API Proxy for WordPress AJAX endpoint to bypass CORS
  app.all('/api/ajax', (req, res) => {
    const targetUrl = 'https://plugins.jarld.com/wp-json/plugin-silo/v1/ajax';
    const urlObj = new URL(targetUrl);

    // Copy relevant headers
    const headers = { ...req.headers } as any;
    delete headers.host;
    delete headers.origin;
    delete headers.referer;

    const options = {
      method: req.method,
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      headers: headers,
    };

    const proxyReq = https.request(options, (proxyRes) => {
      // Write status code and headers from backend response
      res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
      // Pipe the response body back to original client
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('Error proxying to backend:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to communicate with remote WordPress backend: ' + err.message
      });
    });

    // Pipe the request body to the proxy request
    req.pipe(proxyReq);
  });

  // Serve static assets or use Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
