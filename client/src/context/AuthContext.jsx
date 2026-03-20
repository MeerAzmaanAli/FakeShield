import { useContext, useState, useEffect, createContext } from "react";
import { getProfile } from "../services/authService";

const AuthContext = createContext(null)

export const AuthProvider = ({children}) => {
    const [user, setUser]  = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(()=>{
        const initAuth = async () => {
            const token = localStorage.getItem("token")
            if (!token) {
                setLoading(false)
                return
            }

            try {
                const profile = await getProfile()
                setUser(profile)
            } catch(error) {
                console.error("Invalid token: ", error)
                localStorage.removeItem("token")
                setUser(null)
            } finally {
                setLoading(false)
            }
        }

        initAuth()
    },[])

    const login = (token, userData) =>{
        localStorage.setItem("token", token)
        setUser(userData)
    }

    const logout= ()=>{
        localStorage.removeItem("token");
        setUser(null)
    }

    const isAuthenticated = !!user
    const isAgency = user?.role ==="agency"

    const value = {
        user,
        loading,
        login,
        logout,
        isAgency,
        isAuthenticated
    }

    return(
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )

}
 
export const useAuth = ()=> {
    const context = useContext(AuthContext);
    if(!context){
        throw new Error("useAuth must be used inside AuthProvider")
    }
    return context
}

export default AuthContext;