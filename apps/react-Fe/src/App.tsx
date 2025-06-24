// import { useState } from 'react'
import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router";
import Page from "./components/Page";
import Landing from "./components/Landing";
import Login from "./components/Login";
import Register from "./components/Register";
import AuthLayout from "./components/AuthLayout";

function App() {
    // const [count, setCount] = useState(0)

    return (
        <div>
            <BrowserRouter>
                <Routes>
                    <Route index element={<Landing />} />
                    <Route path="page" element={<Page />} />
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
