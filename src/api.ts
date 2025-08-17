const API_KEY = "10923b261ba94d897ac6b81148314a3f";
const BASE_PATH = "https://api.themoviedb.org/3";

/** =====================
 * Shared Types
 * ===================== */
export interface IPagedResult<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

// --- Movie basic type (list items) ---
export interface IMovie {
  id: number;
  backdrop_path: string | null;
  poster_path: string | null;
  title: string;
  overview: string;
  vote_average?: number;
  release_date?: string;
}

// --- TV basic type (list items) ---
export interface ITv {
  id: number;
  backdrop_path: string | null;
  poster_path: string | null;
  name: string;
  overview: string;
  vote_average?: number;
  first_air_date?: string;
}

// --- Movie detail ---
export interface IMovieDetail extends IMovie {
  genres?: { id: number; name: string }[];
  runtime?: number;
  spoken_languages?: { english_name: string; iso_639_1: string; name: string }[];
  homepage?: string | null;
  status?: string;
  tagline?: string | null;
}

// --- TV detail ---
export interface ITvDetail extends ITv {
  genres?: { id: number; name: string }[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  episode_run_time?: number[];
  spoken_languages?: { english_name: string; iso_639_1: string; name: string }[];
  homepage?: string | null;
  status?: string;
  tagline?: string | null;
}

/** =====================
 * Movies
 * ===================== */
export interface IGetMoviesResult extends IPagedResult<IMovie> {}

export function getMovies() {
  // legacy: now playing (배너에서 사용)
  return fetch(`${BASE_PATH}/movie/now_playing?api_key=${API_KEY}`).then((r) => r.json());
}

export function getMovieLatest() {
  return fetch(`${BASE_PATH}/movie/latest?api_key=${API_KEY}`).then((r) => r.json());
}
export function getMovieTopRated() {
  return fetch(`${BASE_PATH}/movie/top_rated?api_key=${API_KEY}`).then((r) => r.json());
}
export function getMovieUpcoming() {
  return fetch(`${BASE_PATH}/movie/upcoming?api_key=${API_KEY}`).then((r) => r.json());
}
export function getMovieDetail(id: number | string): Promise<IMovieDetail> {
  return fetch(`${BASE_PATH}/movie/${id}?api_key=${API_KEY}`).then((r) => r.json());
}

/** =====================
 * TV
 * ===================== */
export interface IGetTvsResult extends IPagedResult<ITv> {}

export function getTvLatest() {
  return fetch(`${BASE_PATH}/tv/latest?api_key=${API_KEY}`).then((r) => r.json());
}
export function getTvAiringToday() {
  return fetch(`${BASE_PATH}/tv/airing_today?api_key=${API_KEY}`).then((r) => r.json());
}
export function getTvPopular() {
  return fetch(`${BASE_PATH}/tv/popular?api_key=${API_KEY}`).then((r) => r.json());
}
export function getTvTopRated() {
  return fetch(`${BASE_PATH}/tv/top_rated?api_key=${API_KEY}`).then((r) => r.json());
}
export function getTvDetail(id: number | string): Promise<ITvDetail> {
  return fetch(`${BASE_PATH}/tv/${id}?api_key=${API_KEY}`).then((r) => r.json());
}

/** =====================
 * Search
 * ===================== */
export function searchMovies(keyword: string): Promise<IPagedResult<IMovie>> {
  const q = encodeURIComponent(keyword);
  return fetch(`${BASE_PATH}/search/movie?api_key=${API_KEY}&query=${q}`).then((r) => r.json());
}
export function searchTvs(keyword: string): Promise<IPagedResult<ITv>> {
  const q = encodeURIComponent(keyword);
  return fetch(`${BASE_PATH}/search/tv?api_key=${API_KEY}&query=${q}`).then((r) => r.json());
}

// Re-export constants for debugging or external use (optional)
export { API_KEY, BASE_PATH };