import React from "react";
import { useHistory } from "react-router-dom";
import logo from "./logo.svg";
import "./App.css";
import Routes from "./Routes.js";
function App() {
  return (
    <React.Fragment>
      <Routes />
    </React.Fragment>
  );
}

export default App;
