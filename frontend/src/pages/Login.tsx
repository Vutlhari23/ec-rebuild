import React from "react";
import "./Login.css";

function Login() {
  return (
    <div className="container">
      <h1 className="h1">Login Page</h1>
      <form>
        <label className="mylabel">Login name/Student No:</label>
        <input type="text" placeholder="Username" className="textField" />

        <label className="mylabel">Password :</label>
        <input type="password" placeholder="Password" className="textField" />

        <button className="login-btn" type="submit">Login</button>
      </form>
      <p className="info-text">
        PS, if you want to make sure the account isn’t locked out, you can go to <a href="https://tut4life.tut.ac.za" target="_blank" rel="noopener noreferrer">https://tut4life.tut.ac.za</a> and “reset” the password. The system will at the same time unlock the account.
        <br /><br />
        You can also install the password reset app from the play or apple store (which will actually show you if the account is locked out or not and allow you to unlock without resetting the password.
        <br /><br />
        Password Manager Cellphone App: <a href="https://play.google.com/store/apps/details?id=za.ac.tut.os.PasswordManager" target="_blank" rel="noopener noreferrer">Google Play</a>
        <br />
        You can also try: <a href="https://apps.apple.com/us/app/id1521867711" target="_blank" rel="noopener noreferrer">Apple Store</a>
      </p>
    </div>
  );
}

export default Login;

