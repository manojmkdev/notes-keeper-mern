// Session management helper.
// Only the token (nk_token) is stored in localStorage.
// All user and business data is retrieved from MongoDB Atlas.

export const getToken = () => localStorage.getItem('nk_token');

export const setSession = (token) => {
  localStorage.setItem('nk_token', token);
};

export const clearSession = () => {
  localStorage.removeItem('nk_token');
};

export const isAuthenticated = () => !!localStorage.getItem('nk_token');
