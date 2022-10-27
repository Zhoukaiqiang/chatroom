const http = require("http");
const path = require("path");
const mime = require("mime");
const fs = require("fs");

const cache = {};

const send404 = (response) => {
  response.writeHead(404, { "Content-Type": "text/plain" });
  response.write("Error 404: resource not found.");
  response.end();
};

const sendFile = (response, filePath, fileContents) => {
  response.writeHead(200, {
    "Content-Type": mime.getType(path.basename(filePath)),
  });
  response.end(fileContents);
};

const serveStatic = (response, cache, absPath) => {
  if (cache[absPath]) {
    sendFile(response, absPath, cache[absPath]);
  } else {
    const exists = fs.existsSync(absPath);
    if (exists) {
      const data = fs.readFileSync(absPath);
      if (!data) {
        send404(response);
      } else {
        cache[absPath] = data;
        sendFile(response, absPath, data);
      }
    } else {
      send404(response);
    }
  }
};

const server = http.createServer((request, response) => {
  let filePath = "public/index.html";
  if (request.url !== "/") {
    filePath = "public" + request.url;
  }
  const absPath = "./" + filePath;
  serveStatic(response, cache, absPath);
});

const port = 3001;

server.listen(port, () => {
  console.log(`Server is running in http://localhost:${port}`);
});
