import { loginUser } from "../api/auth/login";
import { useState } from "react";


function Login() {
    const [usernameOrEmail, setUsernameOrEmail] = useState("");
    const [password, setPassword] = useState("");
    const handleLoginSubmit = async (event: React.FormEvent) =>  {
        event.preventDefault();
        try {
            const data = await loginUser(usernameOrEmail, password);
            console.log("Login successful:", data);
            // Handle successful login (e.g., store tokens, redirect)
        } catch (error: any) {
            console.error("Login failed:", error);
        }
    };
    return (
        <div
            style={{
                padding: "20px",
                border: "1px solid #ccc",
                margin: "10px",
                backgroundColor: "#f0f0f0",
            }}
        >

            <h2>Login Page</h2>
            <form onSubmit={handleLoginSubmit}>
                <label>
                    Username/Email:{" "}
                    <input
                        type="text"
                        value={usernameOrEmail}
                        onChange={(e) => setUsernameOrEmail(e.target.value)}
                    />
                </label>
                <br />
                <label>
                    Password:{" "}
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </label>
                <br />
                <button type="submit">Login</button>
            </form>
            <p>This is the actual Loign component content.</p>
        </div>
    );
}

export default Login;
