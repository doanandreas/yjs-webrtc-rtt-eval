const path = require("path");
const puppeteer = require("puppeteer");

const shortUUID = require("short-uuid");
const generator = shortUUID();

const fs = require("fs");

require("dotenv").config();
const { TRIAL_NUMBER, PEER_NUMBER } = process.env;

const exportResultToTxt = (res) => {
  fs.writeFileSync(path.join(__dirname, "result", "result.txt"), res);
};

(async () => {
  // const browser = await puppeteer.launch({
  //   executablePath: "/usr/bin/google-chrome",
  //   args: ["--no-sandbox"],
  // });
  const browser = await puppeteer.launch({});
  const page = await browser.newPage();

  page.on("console", (msg) => console.log("LOG:", msg.text()));
  await page.exposeFunction("exportResultToTxt", exportResultToTxt);

  // await page.goto(
  //   `file://${path.join(__dirname, "test", "dist", "index.html")}`,
  //   {
  //     waitUntil: "networkidle0",
  //   }
  // );
  await page.goto(
    "file:///C:/dev-ssd/%23p2p-collab/yjs-webrtc-rtt-eval/test/dist/index.html",
    {
      waitUntil: "networkidle0",
    }
  );
  await page.evaluate(
    (id, trials, peers, resultExport) =>
      connectToRoom(id, trials, peers, exportResultToTxt),
    generator.generate(),
    Number(TRIAL_NUMBER),
    Number(PEER_NUMBER)
  );
})();
