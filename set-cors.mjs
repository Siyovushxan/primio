import { Storage } from "@google-cloud/storage";

const storage = new Storage({ projectId: "primio-e6f11" });

const cors = [
  {
    origin: ["http://localhost:3000", "https://primio.vercel.app", "https://*.vercel.app"],
    method: ["GET", "POST", "PUT", "DELETE", "HEAD"],
    maxAgeSeconds: 3600,
    responseHeader: ["Content-Type", "Authorization", "Content-Length", "X-Requested-With"],
  },
];

const bucket = storage.bucket("primio-e6f11.appspot.com");
await bucket.setCorsConfiguration(cors);
console.log("✅ CORS muvaffaqiyatli o'rnatildi!");
