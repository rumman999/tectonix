// REPLACE with your new Cloudflare URL
export const API_BASE_URL = "https://perhaps-creative-fold-ripe.trycloudflare.com"; 

export const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    "Authorization": token ? `Bearer ${token}` : "",
  };
};