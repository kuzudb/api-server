# Kùzu API Server

REST-style API server for the Kùzu graph database powered by Express.js.

## Get started

Kùzu API Server is launched as a Docker container. Please refer to the [Docker documentation](https://docs.docker.com/get-docker/) for details on how to install and use Docker.

To access an existing Kùzu database, you can mount its path to the `/database` directory as follows:

```bash
docker run -p 8000:8000 \
           -v path/to/database:/database \
           --rm kuzudb/api-server:latest
```

By mounting local database files to Docker via `-v path/to/database:/database`,
the changes done through the API server will persist to the local database files after the UI is shutdown.

The `--rm` flag tells docker that the container should automatically be removed after we close docker.

If the launching is successful, you should see the logs similar to the following in your shell:

```
[00:46:50.833] INFO (1): Access mode: READ_WRITE
[00:46:50.834] INFO (1): CORS enabled for all origins
[00:46:50.853] INFO (1): Version of Kùzu: 0.3.1
[00:46:50.854] INFO (1): Deployed server started on port: 8000
```

### Additional launch configurations

#### Access mode

By default, the API server is launched in read-write mode, which means that you can modify the database. If you want to launch it in read-only mode, you can do so by setting the `MODE` environment variable to `READ_ONLY` as follows.

```bash
docker run -p 8000:8000 \
           -v path/to/database:/database \
           -e MODE=READ_ONLY \
           --rm kuzudb/api-server:latest
```

The API server will then be launched in read-only mode, and you will see the following log message:

```
[00:46:50.833] INFO (1): Access mode: READ_ONLY
```

In read-only mode, you can still issue read queries, but you cannot run write queries or modify the schema.

#### Buffer pool size

By default, the API server is launched with a maximum buffer pool size of 80% of the available memory. If you want to launch API server with a different buffer pool size, you can do so by setting the `KUZU_BUFFER_POOL_SIZE` environment variable to the desired value in bytes as follows.

For example, to launch the API server with a buffer pool size of 1GB, you can run the following command.

```bash
docker run -p 8000:8000 \
           -v path/to/database:/database \
           -e KUZU_BUFFER_POOL_SIZE=1073741824 \
           --rm kuzudb/api-server:latest
```

#### Cross-Origin Resource Sharing (CORS)

By default, the API server is launched with CORS enabled for all origins. If you want to disable CORS, you can do so by setting the `CROSS_ORIGIN` environment variable to `false` as follows.

```bash
docker run -p 8000:8000 \
           -v path/to/database:/database \
           -e CROSS_ORIGIN=false \
           --rm kuzudb/api-server:latest
```

### Launch with Podman

If you are using [Podman](https://podman.io/) instead of Docker, you can launch the API server by replacing `docker` with `podman` in the commands above. However, note that by default Podman maps the default user account to the `root` user in the container. This may cause permission issues when mounting local database files to the container. To avoid this, you can use the `--userns=keep-id` flag to keep the user ID of the current user inside the container, or enable `:U` option for each volume to change the owner and group of the source volume to the current user.

For example:

```bash
podman run -p 8000:8000 \
           -v /absolute/path/to/database:/database:U \
           --rm kuzudb/api-server:latest
```

or,

```bash
podman run -p 8000:8000 \
           -v /absolute/path/to/database:/database \
           --userns=keep-id \
           --rm kuzudb/api-server:latest
```

Please refer to the official Podman docs for [mounting external volumes](https://docs.podman.io/en/latest/markdown/podman-run.1.html#mounting-external-volumes) and [user namespace mode](https://https://docs.podman.io/en/latest/markdown/podman-run.1.html#userns-mode) for more information.

## API endpoints

The Kùzu API server provides the following endpoints:

### `GET /`:

Get the status of the server.

#### Example usage:

With `fetch` in JavaScript:

```javascript
fetch("http://localhost:8000")
  .then((response) => response.json())
  .then((data) => console.log(data));
```

With `curl` in the terminal:

```bash
curl http://localhost:8000
```

#### Example response:

```json
{
  "status": "ok",
  "version": "0.3.1",
  "mode": "READ_WRITE"
}
```

### `GET /schema`:

Get the schema of the database.

#### Example usage:

With `fetch` in JavaScript:

```javascript
fetch("http://localhost:8000/schema")
  .then((response) => response.json())
  .then((data) => console.log(data));
```

With `curl` in the terminal:

```bash
curl http://localhost:8000/schema
```

#### Example response:

```json
{
  "nodeTables": [
    {
      "name": "City",
      "comment": "",
      "properties": [
        {
          "name": "name",
          "type": "STRING",
          "isPrimaryKey": true
        },
        {
          "name": "population",
          "type": "INT64",
          "isPrimaryKey": false
        }
      ]
    },
    {
      "name": "User",
      "comment": "",
      "properties": [
        {
          "name": "name",
          "type": "STRING",
          "isPrimaryKey": true
        },
        {
          "name": "age",
          "type": "INT64",
          "isPrimaryKey": false
        }
      ]
    }
  ],
  "relTables": [
    {
      "name": "Follows",
      "comment": "",
      "properties": [
        {
          "name": "since",
          "type": "INT64"
        }
      ],
      "src": "User",
      "dst": "User"
    },
    {
      "name": "LivesIn",
      "comment": "",
      "properties": [],
      "src": "User",
      "dst": "City"
    }
  ],
  "relGroups": [],
  "rdf": []
}
```

### `POST /cypher`:

Execute a Cypher query and get the result. The request body should be a JSON object with a `query` field containing the Cypher query and an optional `params` field containing the parameters for the query (if the query is a parameterized query / prepared statement).

#### Example usage:

With `fetch` in JavaScript:

```javascript
fetch("http://localhost:8000/cypher", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    query: "MATCH (u:User) WHERE u.age > $a RETURN u",
    params: {
      a: 20,
    },
  }),
})
  .then((response) => response.text())
  .then((data) => console.log(data));
```

With `curl` in the terminal:

```bash
curl -X POST\
     -H "Content-Type: application/json" \
     -d '{"query":"MATCH (u:User) WHERE u.age > $a RETURN u","params":{"a":25}}' \
     http://localhost:8000/cypher
```

#### Example response:

```json
{
  "rows": [
    {
      "u": {
        "name": "Adam",
        "age": 30,
        "_label": "User",
        "_id": { "offset": 0, "table": 0 }
      }
    },
    {
      "u": {
        "name": "Karissa",
        "age": 40,
        "_label": "User",
        "_id": { "offset": 1, "table": 0 }
      }
    },
    {
      "u": {
        "name": "Zhang",
        "age": 50,
        "_label": "User",
        "_id": { "offset": 2, "table": 0 }
      }
    }
  ],
  "dataTypes": { "u": "NODE" },
  "isSchemaChanged": false
}
```

## Deployment

A [GitHub actions pipeline](.github/workflows/build-and-deploy.yml) has been configured to automatically build and deploy
the Docker image to [Docker Hub](https://hub.docker.com/) upon pushing to the master branch. The pipeline will build images
for both `amd64` and `arm64` platforms.

## Contributing

We welcome contributions to Kùzu API Server. By contributing to Kùzu API Server, you agree that your contributions will be licensed under the [MIT License](LICENSE).
