import api from "./api"

export const loginUser = async (email, password) => {
    const res = await api.post("/auth/login", {email, password})
    return res.data
}

export const registerUser = async(name, email, password, role) => {
    const res = await api.post("/auth/register", {name, email, password, role})
    return res.data
}

export const getProfile = async () => {
    const res = await api.get("/auth/profile")
    return res.data;
}