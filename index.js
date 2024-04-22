const express = require("express");
const cors = require("cors");
const process = require("process");
const database = require("./explorer/src/server/utils/Database");
const logger = require("./explorer/src/server/utils/Logger");

const schema = require("./explorer/src/server/Schema");
const cypher = require("./explorer/src/server/Cypher");
const state = require("./explorer/src/server/State");

const CROSS_ORIGIN = process.env.CROSS_ORIGIN
  ? process.env.CROSS_ORIGIN.toLowerCase() === "true"
  : false;

process.on("SIGINT", () => {
  logger.info("SIGINT received, exiting");
  process.exit(0);
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM received, exiting");
  process.exit(0);
});

const app = express();

if (CROSS_ORIGIN) {
  app.use(cors());
  logger.info("CORS enabled for all origins");
}

let PORT = parseInt(process.env.PORT);
if (isNaN(PORT)) {
  PORT = 8000;
}
const MAX_PAYLOAD_SIZE = process.env.MAX_PAYLOAD_SIZE
  ? process.env.MAX_PAYLOAD_SIZE
  : "128mb";

const api = express.Router();
api.use("/schema", schema);
api.use("/cypher", cypher);
api.use("/", state);
app.use(express.json({ limit: MAX_PAYLOAD_SIZE }));
app.use("/", api);

database
  .getDbVersion()
  .then((res) => {
    const version = res.version;
    const storageVersion = res.storageVersion;
    logger.info("Version of Kùzu: " + version);
    logger.info("Storage version of Kùzu: " + storageVersion);
    app.listen(PORT, () => {
      logger.info("Deployed server started on port: " + PORT);
    });
  })
  .catch((err) => {
    logger.error("Error getting version of Kùzu: " + err);
  });
