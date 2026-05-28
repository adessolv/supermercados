import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import catalogsRouter from "./routes/catalogs.js";
import geoRouter from "./routes/geo.js";
import storesRouter from "./routes/stores.js";

dotenv.config();
console.log("DEBUG_TIENDEO =", process.env.DEBUG_TIENDEO);

const app = express();
const port = Number(process.env.PORT || 8000);

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "supermercados-backend" });
});

app.use("/geo", geoRouter);
app.use("/stores", storesRouter);
app.use("/catalogs", catalogsRouter);

app.listen(port, "0.0.0.0", () => {
  console.log(`Backend running on http://0.0.0.0:${port}`);
});
