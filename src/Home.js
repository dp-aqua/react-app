import React from "react";
import { useHistory } from "react-router-dom";

function Home() {
  let history = useHistory();

  const navigateLogin = async () => {
    console.log("This button was clicked.");
    history.push("/login");
  };

  const navigateSignUp = async () => {
    console.log("Navigate to the sign up page.");
    history.push("/signup");
  };

  return (
    <React.Fragment>
      <div style={{ cursor: "pointer" }} onClick={() => navigateLogin()}>
        Go to login page
      </div>
      <div style={{ cursor: "pointer" }} onClick={() => navigateSignUp()}>
        Go to sign up page
      </div>
    </React.Fragment>
  );
}
export default Home;
