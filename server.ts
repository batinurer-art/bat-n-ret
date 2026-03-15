import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // Spotify Auth URL
  app.get("/api/auth/spotify/url", (req, res) => {
    const scope = "user-read-private user-read-email user-modify-playback-state user-read-playback-state playlist-read-private";
    const redirectUri = process.env.SPOTIFY_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/spotify/callback`;
    
    const params = new URLSearchParams({
      client_id: process.env.SPOTIFY_CLIENT_ID!,
      response_type: "code",
      redirect_uri: redirectUri,
      scope: scope,
      show_dialog: "true"
    });

    res.json({ url: `https://accounts.spotify.com/authorize?${params.toString()}` });
  });

  // Spotify Auth Callback
  app.get("/api/auth/spotify/callback", async (req, res) => {
    const { code } = req.query;
    const redirectUri = process.env.SPOTIFY_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/spotify/callback`;

    try {
      const response = await axios.post("https://accounts.spotify.com/api/token", 
        new URLSearchParams({
          grant_type: "authorization_code",
          code: code as string,
          redirect_uri: redirectUri,
          client_id: process.env.SPOTIFY_CLIENT_ID!,
          client_secret: process.env.SPOTIFY_CLIENT_SECRET!,
        }).toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const { access_token, refresh_token, expires_in } = response.data;

      // Store in cookies (using SameSite=None and Secure for iframe context)
      res.cookie("spotify_access_token", access_token, { 
        maxAge: expires_in * 1000, 
        httpOnly: true, 
        secure: true, 
        sameSite: 'none' 
      });
      res.cookie("spotify_refresh_token", refresh_token, { 
        httpOnly: true, 
        secure: true, 
        sameSite: 'none' 
      });

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'SPOTIFY_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Spotify connected! This window will close automatically.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Spotify Auth Error:", error);
      res.status(500).send("Authentication failed");
    }
  });

  // Spotify API Proxy
  app.get("/api/spotify/me", async (req, res) => {
    const token = req.cookies.spotify_access_token;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    try {
      const response = await axios.get("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      res.json(response.data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch Spotify profile" });
    }
  });

  // Check Auth Status
  app.get("/api/auth/spotify/status", (req, res) => {
    res.json({ connected: !!req.cookies.spotify_access_token });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
