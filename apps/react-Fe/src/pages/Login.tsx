
function Login() {
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px', backgroundColor: '#f0f0f0' }}>
      <h2>Login Page</h2>
      <form>
        <label>Email: <input type="email" /></label><br />
        <label>New Password: <input type="password" /></label><br />
        <button type="submit">Login</button>
      </form>
      <p>This is the actual Loign component content.</p>
    </div>
  );
}

export default Login;

