export const isEmailValid = (email: string) => {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const isPhoneValid = (phone: string) => {
	return /^\+?\d[\d\s()-]{7,}$/.test(phone);
}

export const isPasswordValid = (password: string) => {
	return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/.test(password);
}