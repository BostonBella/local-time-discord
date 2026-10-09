export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/config" && request.method === "GET") {
      return Response.json({ clientId: env.DISCORD_CLIENT_ID || "" });
    }

    if (url.pathname === "/api/token" && request.method === "POST") {
      try {
        const body = await request.json();
        const code = body?.code;

        if (!code) {
          return Response.json({ error: "Missing authorization code." }, { status: 400 });
        }

        const response = await fetch("https://discord.com/api/oauth2/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: new URLSearchParams({
            client_id: env.DISCORD_CLIENT_ID,
            client_secret: env.DISCORD_CLIENT_SECRET,
            grant_type: "authorization_code",
            code
          })
        });

        const data = await response.json();

        if (!response.ok || !data.access_token) {
          console.error("Discord token exchange failed:", data);
          return Response.json({ error: "Discord token exchange failed." }, { status: 500 });
        }

        return Response.json({ access_token: data.access_token });
      } catch (error) {
        console.error(error);
        return Response.json({ error: "Unexpected server error." }, { status: 500 });
      }
    }

    return env.ASSETS.fetch(request);
  }
};
