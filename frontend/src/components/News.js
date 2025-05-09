import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaBell } from "react-icons/fa";
import { io } from "socket.io-client";

const socket = io("http://localhost:8000"); // Update if needed

const News = () => {
  const [articles, setArticles] = useState([]);
  const [personalized, setPersonalized] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentiments, setSentiments] = useState({});
  const [sentimentLoading, setSentimentLoading] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [articlesLoaded, setArticlesLoaded] = useState(false);

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
      setArticlesLoaded(true);
    } catch (err) {
      console.error("Failed to fetch news:", err.response?.data || err.message);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to fetch news."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchSentiment = async (summary, articleId) => {
    setSentimentLoading((prev) => ({ ...prev, [articleId]: true }));
    try {
      const response = await axios.post(
        "http://localhost:8000/api/v1/users/getSentiment",
        { summary }
      );
      setSentiments((prev) => ({
        ...prev,
        [articleId]: {
          negative: response.data.negative || 0,
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

    socket.on("connect", () => {
      console.log("✅ Socket connected");
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });

    socket.on("breaking-news", (article) => {
      console.log("🚨 Received breaking news:", article);

      if (article && article.title) {
        const time = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        setNotifications((prev) => [
          {
            ...article,
            receivedAt: time,
          },
          ...prev,
        ]);
      } else {
        console.log("Received invalid article:", article);
      }
    });

    return () => {
      socket.off("breaking-news");
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  return (
    <div className="news-container">
      <div className="news-header">
        <h2>{personalized ? "Personalized News" : "General News"}</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          {articlesLoaded && (
            <div
              className="notification-bell"
              onClick={() => setDropdownVisible((prev) => !prev)}
            >
              <FaBell />
              {notifications.length > 0 && (
                <span className="notification-count">
                  {notifications.length}
                </span>
              )}

              {dropdownVisible && (
                <div className="notification-dropdown">
                  <strong>🔔 Breaking News</strong>
                  {notifications.length === 0 ? (
                    <div className="no-notifications">No new notifications</div>
                  ) : (
                    notifications.map((notification, idx) => (
                      <p
                        key={idx}
                        onClick={() => {
                          window.open(
                            notification.url,
                            "_blank",
                            "noopener,noreferrer"
                          );
                          setNotifications((prev) =>
                            prev.filter((_, i) => i !== idx)
                          );
                        }}
                        style={{ cursor: "pointer" }}
                        title="Click to open article"
                      >
                        <strong>
                          {notification.title.length > 40
                            ? `${notification.title.slice(0, 40)}...`
                            : notification.title}
                        </strong>
                        <span
                          style={{
                            display: "block",
                            fontSize: "12px",
                            color: "#666",
                          }}
                        >
                          {notification.receivedAt}
                        </span>
                      </p>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          <button onClick={() => setPersonalized(!personalized)}>
            {personalized ? "Show General News" : "Show Personalized News"}
          </button>
        </div>
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
          <div key={idx} className="news-card">
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
