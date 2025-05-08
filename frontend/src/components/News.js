import React, { useEffect, useState } from "react";
import axios from "axios";

const News = () => {
  const [articles, setArticles] = useState([]);
  const [personalized, setPersonalized] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentiments, setSentiments] = useState({});
  const [sentimentLoading, setSentimentLoading] = useState({});

  const fetchNews = async () => {
    const token = localStorage.getItem("token");
    const endpoint = personalized
      ? "http://localhost:8000/api/v1/users/personalizedNews"
      : "http://localhost:8000/api/v1/users/allNews";

    try {
      setLoading(true);
      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setArticles(res.data.data || []);
      setError("");
    } catch (err) {
      console.error("Failed to fetch news:", err.response?.data || err.message);
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to fetch news.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSentiment = async (summary, articleId) => {
    setSentimentLoading((prev) => ({ ...prev, [articleId]: true }));
    try {
      const response = await axios.post(
        "http://localhost:8000/api/v1/users/getSentiment", // assuming your new endpoint
        { summary }
      );

      // Set sentiment state with proper sentiment values
      setSentiments((prev) => ({
        ...prev,
        [articleId]: {
          negative: response.data.negative || 0, // Ensure it's default to 0 if undefined
          neutral: response.data.neutral || 0,
          positive: response.data.positive || 0,
        },
      }));
    } catch (error) {
      console.error("Error fetching sentiment:", error);
    } finally {
      setSentimentLoading((prev) => ({ ...prev, [articleId]: false }));
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
      {loading && (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      )}

      <div className="news-list">
        {!loading && articles.length === 0 && !error && (
          <p>No news available at the moment.</p>
        )}
        {articles.map((article, idx) => (
          <div key={idx} className="news-card" style={{ marginBottom: "20px" }}>
            <h3>{article.title}</h3>
            {article.urlToImage && (
              <img
                src={article.urlToImage}
                alt="news"
                style={{
                  width: "100%",
                  maxHeight: 200,
                  objectFit: "cover",
                  borderRadius: "8px",
                  marginBottom: "10px",
                }}
              />
            )}
            <p>{article.description}</p>

            {!sentiments[idx] && !sentimentLoading[idx] && (
              <button onClick={() => fetchSentiment(article.description, idx)}>
                Show Sentiment
              </button>
            )}

            {sentimentLoading[idx] && (
              <div className="spinner-container">
                <div className="spinner"></div>
              </div>
            )}
            {sentiments[idx] && (
              <div>
                <strong>Sentiment Analysis:</strong>
                <p>Negative: {(sentiments[idx].negative * 100).toFixed(1)}%</p>
                <p>Neutral: {(sentiments[idx].neutral * 100).toFixed(1)}%</p>
                <p>Positive: {(sentiments[idx].positive * 100).toFixed(1)}%</p>
              </div>
            )}
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
