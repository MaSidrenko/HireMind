import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";
import { AUTH_API, PROFILE_API, apiRequest, isEmailValid } from "@/shared";
import { signInRequest } from "@/features/SignIn";
import { signUpRequest } from "@/features/SignUp";
import type { SignUpPayload } from "@/features/SignUp";
import { getMe } from "./getMe";
import type { User, UserCurrency, UserRole } from "./getMe.types";

type AuthContextType = {
	user: User | null;
	isAuthenticated: boolean;
	loading: boolean;
	refreshAuth: () => Promise<void>;
	replaceUser: (nextUser: User | null) => void;
	signIn: (email: string, password: string) => Promise<void>;
	signUp: (payload: SignUpPayload) => Promise<void>;
	updateProfile: (patch: ProfilePatch) => Promise<void>;
	logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type ProfilePatch = {
	email: string;
	fullName: string;
	role: UserRole;
	contacts: {
		telegram?: string;
		phone?: string;
	};
	avatarUrl?: string;
	companyName?: string;
	skills?: string[];
	hourlyRate?: number;
	currency?: UserCurrency;
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

function ensureEmail(email: string) {
	if (!email.trim()) {
		throw new Error("Введите email");
	}

	if (!isEmailValid(email.trim())) {
		throw new Error("Введите корректный email");
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

	const signIn = useCallback(async (email: string, password: string) => {
		const response = await signInRequest(email, password);
		const nextUser = unwrapUser(response) ?? (await getMe());
		setUser(nextUser);
	}, []);

	const replaceUser = useCallback((nextUser: User | null) => {
		setUser(nextUser);
	}, []);

	const signUp = useCallback(async (payload: SignUpPayload) => {
		ensureContact(payload.contacts);

		await signUpRequest(payload);

		setUser(null);
	}, []);

	const updateProfile = useCallback(async (patch: ProfilePatch) => {
		ensureEmail(patch.email);
		ensureContact(patch.contacts);
		if (typeof patch.hourlyRate === "number" && patch.hourlyRate < 0) {
			throw new Error("Почасовая ставка не может быть отрицательной");
		}
		const response = await apiRequest<AuthResponse>(PROFILE_API, {
			method: "PUT",
			body: {
				...patch,
				email: patch.email.trim().toLowerCase(),
			},
		});
		const nextUser = unwrapUser(response) ?? (await getMe());
		setUser(nextUser);
	}, []);

	const logout = useCallback(async () => {
		try {
			await apiRequest<{ message: string }>(`${AUTH_API}/logout`, {
				method: "POST",
			});
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
			replaceUser,
			signIn,
			signUp,
			updateProfile,
			logout,
		}),
		[
			user,
			loading,
			refreshAuth,
			replaceUser,
			signIn,
			signUp,
			updateProfile,
			logout,
		],
	);

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);

	if (!context) {
		throw new Error("useAuth must be used inside AuthProvider");
	}

	return context;
}
