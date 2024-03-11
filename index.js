const express = require("express");
const cors = require("cors");
const process = require("process");
const database = require("./explorer/src/server/utils/Database");
const logger = require("./explorer/src/server/utils/Logger");

const schema = require("./explorer/src/server/Schema");
const cypher = require("./explorer/src/server/Cypher");

const CROSS_ORIGIN = process.env.CROSS_ORIGIN
  ? process.env.CROSS_ORIGIN.toLowerCase() === "true"
  : false;

let version;

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

const PORT = 8000;

const api = express.Router();
api.use("/schema", schema);
api.use("/cypher", cypher);

app.use(express.json({ limit: "128mb" }));
app.use("/", api);
app.get("/", (_, res) => {
  res.send({
    status: "ok",
    version: version,
    mode: database.getAccessModeString(),
  });
});

const conn = database.getConnection();
conn
  .query("CALL db_version() RETURN *;")
  .then((res) => {
    return res.getAll();
  })
  .then((res) => {
    const row = res[0];
    version = Object.values(row)[0];
    logger.info("Version of Kùzu: " + version);
    app.listen(PORT, () => {
      logger.info("Deployed server started on port: " + PORT);
    });
  })
  .catch((err) => {
    logger.error("Error getting version of Kùzu: " + err);
  })
  .finally(() => {
    database.releaseConnection(conn);
  });
