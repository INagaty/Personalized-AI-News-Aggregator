import React, { useEffect, useState } from "react";
import axios from "axios";

const News = () => {
  const [articles, setArticles] = useState([]);
  const [personalized, setPersonalized] = useState(false);
  const [error, setError] = useState("");

  const fetchNews = async () => {
    const token = localStorage.getItem("token");
    const endpoint = personalized
      ? "http://localhost:8000/api/v1/users/personalizedNews" // ✅ fixed
      : "http://localhost:8000/api/v1/users/allNews"; // ✅ fixed

    try {
      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Use `data.data` since the backend returns { status, count, data }
      setArticles(res.data.data || []);
      setError(""); // Clear previous error
    } catch (err) {
      console.error("Failed to fetch news:", err.response?.data || err.message);
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to fetch news.";
      setError(message);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [personalized]);

  return (
    <div className="news-container">
      <div className="news-header">
        <h2>{personalized ? "Personalized News" : "General News"}</h2>
        <button onClick={() => setPersonalized(!personalized)}>
          {personalized ? "Show General News" : "Show Personalized News"}
        </button>
      </div>

      {error && <p style={{ color: "red", marginBottom: "10px" }}>{error}</p>}

      <div className="news-list">
        {articles.length === 0 && !error && (
          <p>No news available at the moment.</p>
        )}
        {articles.map((article, idx) => (
          <div key={idx} className="news-card">
            <h3>{article.title}</h3>
            <p>{article.description}</p>
            <a href={article.url} target="_blank" rel="noopener noreferrer">
              Read more
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default News;
