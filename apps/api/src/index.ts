import { Hono } from "hono";
import routes from "./routes";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.route("/", routes);

export default app;
