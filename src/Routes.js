import React, { useState, useMemo, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Switch,
  useLocation,
} from "react-router-dom";
import { useHistory } from "react-router-dom";
import Home from "./Home.js";

export default function Routes() {
  return (
    <Router>
      <Switch>
        <Route exact path="/">
          <Home />
        </Route>
        <Route exact path="/login">
          <div>This is the new login page.</div>
        </Route>
        <Route exact path="/signup">
          <div>This is the sign up page.</div>
        </Route>
      </Switch>
    </Router>
  );
}
