// import { useState } from 'react'
import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router";
import Landing from "./pages/Landing";
import AuthLayout from "./components/AuthLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
    // const [count, setCount] = useState(0)

    return (
        <div>
            <BrowserRouter>
                <Routes>
                    <Route index element={<Landing />} />
                    {/* <Route path="page" element={<Page />} /> */}
                    <Route element={<AuthLayout />}>
                        <Route path="login" element={<Login />} />
                        <Route path="register" element={<Register />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </div>
    );
}

export default App;
