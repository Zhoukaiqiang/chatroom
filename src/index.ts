import express from "express";
import http from 'http'
import io from './chatserver'


const PORT = 3001;

const app: express.Application = express();
const server = http.createServer(app)
io.attach(server)

app.use(express.static("public"));

type RES = express.Response;
type REQ = express.Request;

app.get("/", (request, response) => {
  let filePath = "index.html";
  if (request.url !== "/") {
    filePath = request.url;
  }
  const absPath = "./" + filePath;
  response.sendFile(absPath);
  // serveStatic(response, cache, absPath);
});

const send404 = (request: REQ, response: RES) => {
  response.status(404).send("Error 404: resource not found.");
};
app.use(send404);

// const sendFile = (response: RES, filePath: string, fileContents: any) => {
//   response.sendFile(filePath);
// };

// const serveStatic = (response: RES, cache: any, absPath: string) => {
//   if (cache[absPath]) {
//     sendFile(response, absPath, cache[absPath]);
//   } else {
//     const exists = fs.existsSync(absPath);
//     if (exists) {
//       const data = fs.readFileSync(absPath);
//       if (!data) {
//         send404(response);
//       } else {
//         cache[absPath] = data;
//         sendFile(response, absPath, data);
//       }
//     } else {
//       send404(response);
//     }
//   }
// };

server.listen(PORT, () => {
  console.log(`[server] start at http://localhost:${PORT}/`);
});
