// random shit

const params = new URLSearchParams(location.search);

export const pi = Math.PI;
export const getParameter = key => key ? params.get(key) : 0;
export const hash = _ => window.location.hash;
export const setHash = string => window.location.hash = string;


