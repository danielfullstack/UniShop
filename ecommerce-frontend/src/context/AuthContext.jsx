import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { auth } from "../firebase/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";

// eslint-disable-next-line react-refresh/only-export-components -- The context and its provider belong together.
export const AuthContext = createContext();

const profileKey = (uid) => `unishop-profile-${uid}`;

const readSavedProfile = (uid) => {
  try {
    return JSON.parse(localStorage.getItem(profileKey(uid)) || "{}");
  } catch {
    return {};
  }
};

const authErrorMessage = (error) => {
  const messages = {
    "auth/invalid-email": "El correo electrónico no es válido.",
    "auth/user-not-found": "No existe una cuenta con ese correo electrónico.",
    "auth/wrong-password": "La contraseña no es correcta.",
    "auth/invalid-credential": "El correo o la contraseña no son correctos.",
    "auth/email-already-in-use": "Ya existe una cuenta con ese correo electrónico.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/too-many-requests": "Hubo demasiados intentos. Espera un momento e inténtalo de nuevo.",
    "auth/network-request-failed": "No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.",
  };
  return messages[error?.code] || "No se pudo completar la solicitud. Inténtalo de nuevo.";
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!active) return;
      setLoading(true);
      if (!firebaseUser) {
        setUser(null);
        setIsAdmin(false);
        try { localStorage.removeItem("usuario"); } catch { /* La sesión de Firebase sigue siendo la fuente de verdad. */ }
        if (active) setLoading(false);
        return;
      }

      const saved = readSavedProfile(firebaseUser.uid);
      const payload = {
        ...saved,
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || saved.displayName || firebaseUser.email?.split("@")[0] || "",
        photoURL: firebaseUser.photoURL || null,
        provider: firebaseUser.providerData?.[0]?.providerId || "password",
      };
      setUser(payload);
      try {
        localStorage.setItem("usuario", JSON.stringify(payload));
        localStorage.setItem(profileKey(firebaseUser.uid), JSON.stringify(payload));
      } catch {
        // La autenticación sigue activa aunque el navegador no permita guardar el perfil extendido.
      }

      const configuredAdminEmail = (import.meta.env.VITE_ADMIN_EMAIL || "").trim().toLowerCase();
      try {
        const token = await firebaseUser.getIdTokenResult();
        if (active) {
          setIsAdmin(token.claims.admin === true || (!!configuredAdminEmail && firebaseUser.email?.toLowerCase() === configuredAdminEmail));
        }
      } catch {
        if (active) setIsAdmin(!!configuredAdminEmail && firebaseUser.email?.toLowerCase() === configuredAdminEmail);
      }
      if (active) setLoading(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const register = useCallback(async (email, password, displayName) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      try { await updateProfile(credential.user, { displayName }); } catch { /* El registro de la cuenta sigue siendo válido. */ }
    }
    return credential.user;
  }, []);

  const login = useCallback(async (email, password) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const result = await signInWithPopup(auth, new GoogleAuthProvider());
    return result.user;
  }, []);

  const logout = useCallback(() => signOut(auth), []);

  const updateUserProfile = useCallback(async (updates) => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error("Debes iniciar sesión para actualizar tu perfil.");
    if (updates.displayName && updates.displayName !== firebaseUser.displayName) {
      await updateProfile(firebaseUser, { displayName: updates.displayName });
    }
    const nextUser = { ...user, ...updates, uid: firebaseUser.uid, email: firebaseUser.email };
    setUser(nextUser);
    try {
      localStorage.setItem("usuario", JSON.stringify(nextUser));
      localStorage.setItem(profileKey(firebaseUser.uid), JSON.stringify(nextUser));
    } catch {
      // Los datos extendidos quedan en memoria si no se puede usar localStorage.
    }
    return nextUser;
  }, [user]);

  const resetPassword = useCallback(async (email) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (error) {
      throw new Error(authErrorMessage(error));
    }
  }, []);

  const value = useMemo(() => ({
    user,
    isAuthenticated: Boolean(user),
    isAdmin,
    loading,
    register,
    login,
    loginWithGoogle,
    logout,
    updateUserProfile,
    resetPassword,
  }), [user, isAdmin, loading, register, login, loginWithGoogle, logout, updateUserProfile, resetPassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
