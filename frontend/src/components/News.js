import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaBell } from "react-icons/fa";
import { io } from "socket.io-client";
import Modal from "react-modal";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPrefs, setSelectedPrefs] = useState([]);
  const [availablePrefs, setAvailablePrefs] = useState([]);

  const fetchPreferences = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(
        "http://localhost:8000/api/v1/users/getPreferences",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const { selectedPreferences, availablePreferences } = res.data.data;
      setSelectedPrefs(selectedPreferences);
      setAvailablePrefs(availablePreferences);
    } catch (error) {
      console.error("Error fetching preferences:", error);
    }
  };

  const updatePreferences = async (
    preferencesToAdd = [],
    preferencesToRemove = []
  ) => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.post(
        "http://localhost:8000/api/v1/users/updatePreferences",
        {
          preferencesToAdd,
          preferencesToRemove,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const updated = res.data.data;
      setSelectedPrefs(updated);
      setAvailablePrefs(
        ["sports", "technology", "business", "health", "entertainment"].filter(
          (p) => !updated.includes(p)
        )
      );
    } catch (error) {
      console.error("Error updating preferences:", error);
    }
  };

  const handleRemovePref = (pref) => updatePreferences([], [pref]);
  const handleAddPref = (pref) => updatePreferences([pref], []);

  useEffect(() => {
    if (isModalOpen) fetchPreferences();
  }, [isModalOpen]);

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
  }, [personalized]);

  return (
    <div className="news-container">
      {/* Black Notification Bar */}
      <div className="notification-bar">
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
                      <div className="no-notifications">
                        No new notifications
                      </div>
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
            <button
              onClick={() => {
                setArticles([]);
                setArticlesLoaded(false);
                setPersonalized((prev) => !prev);
              }}
              className="toggle-button"
            >
              {personalized ? "Show General News" : "Show Personalized News"}
              {console.log(
                personalized
                  ? "Showing Personalized News"
                  : "Showing General News"
              )}
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="toggle-button"
            >
              Change Preferences
            </button>
          </div>
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
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        style={{
          content: {
            top: "50%",
            left: "50%",
            right: "auto",
            bottom: "auto",
            marginRight: "-50%",
            transform: "translate(-50%, -50%)",
            width: "400px",
            maxHeight: "80vh",
            overflowY: "auto",
          },
        }}
        contentLabel="Change Preferences"
        ariaHideApp={false}
      >
        <h2 style={{ marginBottom: "10px" }}>Update Preferences</h2>

        <div>
          <strong>Selected Preferences:</strong>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              marginTop: "8px",
            }}
          >
            {selectedPrefs.map((pref, idx) => (
              <span
                key={idx}
                style={{
                  backgroundColor: "#f0f0f0",
                  padding: "5px 10px",
                  borderRadius: "20px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {pref}
                <button
                  onClick={() => handleRemovePref(pref)}
                  style={{
                    background: "none",
                    border: "none",
                    fontWeight: "bold",
                    marginLeft: "8px",
                    cursor: "pointer",
                    color: "#c00",
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div style={{ marginTop: "15px" }}>
          <strong>Add Preference:</strong>
          <select
            style={{ marginTop: "8px", padding: "5px", width: "100%" }}
            onChange={(e) => {
              const value = e.target.value;
              if (value !== "") handleAddPref(value);
              e.target.value = "";
            }}
          >
            <option value="">-- Select to Add --</option>
            {availablePrefs.map((pref, idx) => (
              <option key={idx} value={pref}>
                {pref}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setIsModalOpen(false)}
          className="toggle-button"
          style={{ marginTop: "20px" }}
        >
          Close
        </button>
      </Modal>
    </div>
  );
};
export default News;
