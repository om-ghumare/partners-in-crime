import React, {createContext, useMemo, useContext, useState, useEffect} from 'react';
import { GoogleAuthProvider, signInWithPopup , onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';

const provider = new GoogleAuthProvider()

const AuthContext = createContext({})

export const AuthProvider = ({children}) => {
    
    const [error, setError] = useState(null)
    const [user, setUser] = useState(null)

    const [loadingInitial, setLoadingInitial] = useState(true);
    const [loading, setLoading] = useState(false);

    useEffect(() => console.log(user), [user])

    useEffect(() => onAuthStateChanged(auth, (user) => {
        if(user)
            setUser(user)
        else setUser(null)

        setLoadingInitial(false)
    }), [])

    const signInPopup = () => signInWithPopup(auth, provider)
    .then(async results => {
        const domain = results.user.email.split('@')[1]
        if(domain === 'iiitkottayam.ac.in')
        {
            const credentials = GoogleAuthProvider.credentialFromResult(results);
            const token = credentials.idToken;
            console.log(token)
            const User = results.user;
            console.log(User)
            setUser({
                token,
                User
            })

            let data = await fetch('http://localhost:8000/auth/adduser', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    user: {
                        name: User.displayName,
                        email: User.email,
                        photo: User.photoURL,
                        id: User.uid,
                    }
                })
            })



        }
        else
            return Promise.reject(); 
    })
    .catch(error => {
        setError({
            code: error.code,
            message: error.message
        })
    });

    const logout = () => {
        setLoading(true)

        signOut(auth)
        .catch(error => setError(error))
        .finally(() => setLoading(false))
    }

    const memo = useMemo(() => ({
        user,
        loading,
        error,
        signInPopup,
        logout
    }),[user, loading, error])

    return <AuthContext.Provider value={memo}>
        {!loadingInitial&&children}
    </AuthContext.Provider>
}

export default function useAuth() {
    return useContext(AuthContext);
}
