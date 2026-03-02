// ==========================================
// MASTER ENVIRONMENT SWITCH
// Change this to "production" when you build the APK!
// ==========================================
const ENV: "development" | "production" = "production";

const endpoints = {
  development: {
    // ⚠️ CRITICAL MOBILE TIP: 
    // "localhost" means the PHONE itself when running on Android.
    // To connect to your computer's server during mobile dev, 
    // you MUST use your computer's local Wi-Fi IP address (e.g., 192.168.1.x)
    NODE_SERVER: "https://sharp-sheep-help.loca.lt", 
    AI_ENGINE: "http://192.168.1.XXX:8000",
  },
  production: {
    // Your free hosted URLs go here
    NODE_SERVER: "https://tectonix-lo13.onrender.com", 
    AI_ENGINE: "https://rumman999-tectonix-ai.hf.space", // Hugging Face or Ngrok URL
  }
};

// Export the correct URLs based on the Master Switch above
export const API_BASE_URL = endpoints[ENV].NODE_SERVER;
export const AI_BASE_URL = endpoints[ENV].AI_ENGINE;

// Export your headers helper
export const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};