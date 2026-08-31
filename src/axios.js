// Single shared axios instance for the whole app.
// Kept as a thin re-export so existing `import api from "../axios"`
// and `import api from "../services/api"` share ONE instance.
import api from "./services/api";

export default api;
