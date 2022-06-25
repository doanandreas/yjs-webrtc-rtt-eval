import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";

// logging purposes
let readyPeer = 0;

// stop when number of trials reaches trialNumber
let currTrials = 0;

// batch final result array
let rttArray = [];

// re-start trial when all peers has responded
let respondedPeers = new Set();

const connectToRoom = (id, trialNumber, peerNumber, exportResult) => {
  const doc = new Y.Doc();
  const statusMap = doc.getMap("status");
  const requestMap = doc.getMap("request");
  const responseMap = doc.getMap("response");

  const roomId = "tldraw-p2p-eval";
  const provider = new WebrtcProvider(roomId, doc);

  statusMap.observe((ymapEvent) => {
    ymapEvent.changes.keys.forEach((change, key) => {
      // console.log("Status Map", JSON.stringify({ action: change.action, key }));

      if (change.action === "add" && statusMap.get(key) === "READY") {
        readyPeer++;
        console.log(
          `Peer ${key} is READY for testing. Number of peers: ${readyPeer}`
        );

        if (readyPeer === peerNumber) {
          console.log(`All peers are READY.`);

          doc.transact(() => {
            requestMap.set(id, new Date().getTime());
          }, id);
        }
      }
    });
  });

  requestMap.observe((ymapEvent) => {
    ymapEvent.changes.keys.forEach((change, key) => {
      // console.log("Request Map", JSON.stringify({ action: change.action, key, value: requestMap.get(key) }));

      // If request is coming from external peer(s)
      if (key !== id) {
        if (change.action === "add" || change.action === "update") {
          responseMap.set(`${id}->${key}`, new Date().getTime());
        }
      }
    });
  });

  responseMap.observe((ymapEvent) => {
    ymapEvent.changes.keys.forEach((change, key) => {
      // console.log("Response Map", JSON.stringify({ action: change.action, key, value: responseMap.get(key) }));

      const responder = key.split("->")[0];
      const requester = key.split("->")[1];

      // If we are the requester
      if (requester === id) {
        const rtt = new Date().getTime() - requestMap.get(requester);
        rttArray.push([rtt]);
        respondedPeers.add(responder);

        if (respondedPeers.size === peerNumber - 1) {
          currTrials++;
          respondedPeers.clear();

          if (currTrials < trialNumber) {
            requestMap.set(id, new Date().getTime());
          } else {
            console.log(`RTT results are complete.`);
            exportResult(rttArray);
          }
        }
      }
    });
  });

  doc.transact(() => {
    statusMap.set(id, "READY");
  }, id);
};

window.connectToRoom = connectToRoom;
