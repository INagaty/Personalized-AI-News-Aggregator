import axios from "axios";

const API_URL = "http://localhost:8000/api/v1";

const getNews = async (token, preferences = "") => {
  try {
    const response = await axios.get(`${API_URL}/users/allNews`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: { query: preferences }, // Optional query parameter
    });
    return response.data.data;
  } catch (error) {
    console.error("Error fetching news:", error);
    throw error;
  }
};

const signUp = async (name, email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/signup`, {
      name,
      email,
      password,
    });
    return response.data;
  } catch (error) {
    console.error("Error signing up:", error);
    throw error;
  }
};

const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

export { getNews, signUp, login };
