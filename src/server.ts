"use strict";

import app from "./app";
import { PORT } from "./config";

app.listen(PORT, function () {
  console.log(`Started on http://localhost:${PORT}`);
});
