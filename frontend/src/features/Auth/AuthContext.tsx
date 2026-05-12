import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";
import { apiRequest } from "@/shared";
import { getMe } from "./getMe";
import type { User } from "./getMe.types";

type AuthContextType = {
	user: User | null;
	isAuthenticated: boolean;
	loading: boolean;
	refreshAuth: () => Promise<void>;
	signInLocal: (email: string, password: string) => Promise<void>;
	signUpLocal: (payload: SignUpPayload) => Promise<void>;
	updateProfileLocal: (patch: ProfilePatch) => Promise<void>;
	logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type SignUpPayload = {
	fullName: string;
	email: string;
	password: string;
	role: "freelancer" | "client";
	contacts: {
		telegram?: string;
		phone?: string;
	};
	companyName?: string;
};

type ProfilePatch = {
	fullName: string;
	contacts: {
		telegram?: string;
		phone?: string;
	};
	avatarUrl?: string;
	companyName?: string;
	skills?: string[];
};

type AuthResponse = User | { user: User };

function unwrapUser(response: AuthResponse | null) {
	if (!response) return null;
	if ("user" in response) return response.user;
	return response;
}

function ensureContact(contacts: { telegram?: string; phone?: string }) {
	if (!contacts.telegram?.trim() && !contacts.phone?.trim()) {
		throw new Error("Укажите Telegram или телефон");
	}
}

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	const refreshAuth = useCallback(async () => {
		try {
			setLoading(true);
			setUser(await getMe());
		} catch (error) {
			console.error("Auth check failed: ", error);
			setUser(null);
		} finally {
			setLoading(false);
		}
	}, []);

	const signInLocal = useCallback(async (email: string, password: string) => {
		const response = await apiRequest<AuthResponse>("/api/auth/sign-in", {
			method: "POST",
			body: { email, login: email, password },
		});
		const nextUser = unwrapUser(response) ?? await getMe();
		setUser(nextUser);
	}, []);

	const signUpLocal = useCallback(async (payload: SignUpPayload) => {
		ensureContact(payload.contacts);
		const response = await apiRequest<AuthResponse>("/api/auth/sign-up", {
			method: "POST",
			body: {
				...payload,
				username: payload.fullName,
			},
		});
		const nextUser = unwrapUser(response) ?? await getMe();
		setUser(nextUser);
	}, []);

	const updateProfileLocal = useCallback(async (patch: ProfilePatch) => {
		ensureContact(patch.contacts);
		const response = await apiRequest<AuthResponse>("/api/profile", {
			method: "PUT",
			body: patch,
		});
		const nextUser = unwrapUser(response) ?? await getMe();
		setUser(nextUser);
	}, []);

	const logout = useCallback(async () => {
		try {
			await apiRequest<null>("/api/auth/logout", { method: "POST" });
		} catch (error) {
			console.error("Logout error: ", error);
		} finally {
			setUser(null);
		}
	}, []);

	useEffect(() => {
		void refreshAuth();
	}, [refreshAuth]);

	const value = useMemo(
		() => ({
			user,
			isAuthenticated: !!user,
			loading,
			refreshAuth,
			signInLocal,
			signUpLocal,
			updateProfileLocal,
			logout,
		}),
		[user, loading, refreshAuth, signInLocal, signUpLocal, updateProfileLocal, logout],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);

	if (!context) {
		throw new Error("useAuth must be used inside AuthProvider");
	}

	return context;
}
