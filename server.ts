import express from "express";
import http from "http";
import https from "https";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // POSITIONAL WARNING: Register proxy FIRST before any body parsers to prevent consumption of req body stream
  app.post("/api/proxy", (req, res) => {
    const options = {
      hostname: 'plugins.jarld.com',
      port: 443,
      path: '/wp-json/plugin-silo/v1/ajax',
      method: 'POST',
      headers: {
        ...req.headers,
        host: 'plugins.jarld.com',
      }
    };

    const proxyReq = https.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('Proxy request failed:', err);
      res.status(500).json({ success: false, message: 'Proxy request failed' });
    });

    req.pipe(proxyReq);
  });

  // Now we can parse json/url-encoded bodies for other future APIs
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API other endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
