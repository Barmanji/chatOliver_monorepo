
function Login() {
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px', backgroundColor: '#f9f9f9' }}>
      <h2>Login Page</h2>
      <form>
        <label>Username: <input type="text" /></label><br />
        <label>Password: <input type="password" /></label><br />
        <button type="submit">Log In</button>
      </form>
      <p>This is the actual Login component content.</p>
    </div>
  );
}

export default Login;
