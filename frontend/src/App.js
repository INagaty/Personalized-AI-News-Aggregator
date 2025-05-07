import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect,
} from "react-router-dom";
import Landing from "./components/Landing";
import Login from "./components/Login";
import News from "./components/News";

const App = () => {
  const [token, setToken] = useState(localStorage.getItem("token"));

  return (
    <Router>
      <Switch>
        <Route path="/" exact>
          <Redirect to="/signup" />
        </Route>
        <Route path="/signup" component={Landing} />
        <Route path="/login">
          <Login setToken={setToken} />
        </Route>
        <Route path="/news">
          {token ? <News /> : <Redirect to="/login" />}
        </Route>
      </Switch>
    </Router>
  );
};

export default App;
