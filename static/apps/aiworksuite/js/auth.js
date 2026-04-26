// js/auth.js — AIWorkSuite (auth removed — 100% free, no login)
// Stub: mantiene la interfaz ClerkAuth para compatibilidad, sin hacer nada.
(function () {
  window.ClerkAuth = {
    init()       { return Promise.resolve({ user: null, plan: 'free', email: null }); },
    signIn()     {},
    signUp()     {},
    signOut()    { location.reload(); },
    getUser()    { return null; },
    isSignedIn() { return false; },
    getUserPlan(){ return Promise.resolve('free'); },
  };
})();
