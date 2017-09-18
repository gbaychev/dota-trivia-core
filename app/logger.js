const winston = require('winston');
require("winston-azure-blob-transport");

let logger = undefined;

if (process.env.storage_key !== undefined &&
    process.env.storage_name !== undefined) {
    logger = new (winston.Logger)({
        transports: [
            new (winston.transports.AzureBlob)({
                account: {
                    name: process.env.storage_name,
                    key: process.env.storage_key
                },
                containerName: process.env.storage_container_name,
                blobName: "logs.txt",
                level: "info"
            })
        ]
    });
    logger.info("using azure storage");
} else {
    logger = new (winston.Logger)({
        transports: [
            new (winston.transports.Console)(),
        ]
    });
    logger.info("NOT using azure storage");
}

module.exports = logger;