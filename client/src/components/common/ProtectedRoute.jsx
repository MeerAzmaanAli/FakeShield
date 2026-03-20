import { Navigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

const ProtectedRoute = ({children, role})=>{
    const {isAuthenticated, isAgency, loading} = useAuth()

    if(loading){
        return <div>Loading...</div>
    }

    if(!isAuthenticated){
        return <Navigate to="/login" replace/>
    }

    if(role ==="agency" && !isAgency){
        return <Navigate to="/dashboard" replace />
    }

    return children

}
export default ProtectedRoute