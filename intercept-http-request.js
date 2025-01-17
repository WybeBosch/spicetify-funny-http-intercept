const http = require("http");
const https = require("https");
const net = require("net");

// Yes we should move this to a .env file but this is just a simple example github
const GITHUB_TOKEN = "ghp_YOURTOKENHERE"; // Masked token

// Create an HTTP server
const server = http.createServer((req, res) => {
  console.log("[HTTP] Incoming request:");
  console.log(`    Method: ${req.method}`);
  console.log(`    URL: ${req.url}`);
  console.log(`    Headers: ${JSON.stringify(req.headers)}`);

  // Check if the request is GitHub-related
  if (
    req.url.includes("github.com") ||
    req.url.includes("api.github.com") ||
    req.url.includes("objects.githubusercontent.com")
  ) {
    const targetUrl = req.url.replace(/^http:/, "https:");
    console.log(`[HTTP] Rewriting request to: ${targetUrl}`);

    const url = new URL(targetUrl);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: req.method,
      headers: {
        ...req.headers,
        authorization: `token ${GITHUB_TOKEN}`,
        "user-agent": "Custom-Proxy-Agent",
      },
    };

    const githubRequest = https.request(options, (githubResponse) => {
      console.log(
        `[HTTP] GitHub responded: ${githubResponse.statusCode} ${githubResponse.statusMessage}`
      );

      res.writeHead(githubResponse.statusCode, githubResponse.headers);
      githubResponse.pipe(res);
    });

    githubRequest.on("error", (err) => {
      console.error("[HTTP] Error making GitHub request:", err.message);
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error");
    });

    req.pipe(githubRequest);
  } else {
    console.log("[HTTP] Non-GitHub request, forwarding it unchanged.");

    // Forward the non-GitHub request unchanged
    const targetUrl = new URL(req.url);
    const options = {
      hostname: targetUrl.hostname,
      path: targetUrl.pathname + targetUrl.search,
      method: req.method,
      headers: req.headers,
    };

    const nonGithubRequest = http.request(options, (response) => {
      res.writeHead(response.statusCode, response.headers);
      response.pipe(res);
    });

    nonGithubRequest.on("error", (err) => {
      console.error("[HTTP] Error forwarding non-GitHub request:", err.message);
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error");
    });

    req.pipe(nonGithubRequest);
  }
});

// Handle CONNECT for HTTPS tunneling
server.on("connect", (req, clientSocket, head) => {
  console.log("[HTTP] Handling CONNECT request to", req.url);

  const [host, port] = req.url.split(":");
  const serverSocket = net.connect(port || 443, host, () => {
    clientSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
    serverSocket.write(head);
    serverSocket.pipe(clientSocket);
    clientSocket.pipe(serverSocket);
  });

  serverSocket.on("error", (err) => {
    console.error("[HTTP] Tunnel error:", err.message);
    clientSocket.end("HTTP/1.1 500 Internal Server Error\r\n");
  });
});

// Start the server
server.listen(3001, "127.0.0.1", () => {
  console.log("Proxy running on http://127.0.0.1:3001");
  console.log("Press Ctrl+C to stop.");
});
