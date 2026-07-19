import { app } from "./app";
import { Config } from "./config/env";
import { logger } from "./utils/logger";

app.listen(Config.PORT, () => {
  logger.info({ port: Config.PORT }, "Backend server started");
});
