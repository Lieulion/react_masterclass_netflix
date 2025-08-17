// src/api/tmdb.ts
const API_KEY = "10923b261ba94d897ac6b81148314a3f";
const BASE_PATH = "https://api.themoviedb.org/3";

/** 공통 타입 */
export interface IPagedResult<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

/** 리스트 아이템 */
export interface IMovie {
  id: number;
  backdrop_path: string | null;
  poster_path: string | null;
  title: string;
  overview: string;
  vote_average?: number;
  release_date?: string;
}
export interface ITv {
  id: number;
  backdrop_path: string | null;
  poster_path: string | null;
  name: string;
  overview: string;
  vote_average?: number;
  first_air_date?: string;
}

/** 상세 */
export interface IMovieDetail extends IMovie {
  genres?: { id: number; name: string }[];
  runtime?: number | null;
  spoken_languages?: { english_name: string; iso_639_1: string; name: string }[];
  homepage?: string | null;
  status?: string;
  tagline?: string | null;
}
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

/** 비디오/크레딧 공용 타입 */
export interface IVideo {
  key: string;
  site: string;   // "YouTube"
  type: string;   // "Trailer" 등
  official?: boolean;
  name: string;
}
export interface IVideoResult {
  results: IVideo[];
}
export interface ICredits {
  cast: Array<{
    id: number;
    name: string;
    character?: string;
    profile_path: string | null;
  }>;
}

/** 공통 fetch 헬퍼 (파라미터 문자열화 안전 처리) */
async function get<T = any>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>
) {
  const stringified =
    params
      ? Object.fromEntries(
          Object.entries(params).map(([k, v]) => [k, v === undefined ? "" : String(v)])
        )
      : {};
  const qs = new URLSearchParams({ api_key: API_KEY, ...stringified }).toString();

  const res = await fetch(`${BASE_PATH}${path}?${qs}`);
  if (!res.ok) throw new Error(`TMDB ${path} ${res.status}`);
  return (await res.json()) as T;
}

/** Movies */
export const movieAPI = {
  nowPlaying: () => get<IPagedResult<IMovie>>("/movie/now_playing"),
  latest:     () => get<IMovieDetail>("/movie/latest"), // 단일 객체
  topRated:   () => get<IPagedResult<IMovie>>("/movie/top_rated"),
  upcoming:   () => get<IPagedResult<IMovie>>("/movie/upcoming"),
  detail:     (id: number | string) => get<IMovieDetail>(`/movie/${id}`),
  videos:     (id: number | string) => get<IVideoResult>(`/movie/${id}/videos`),
  credits:    (id: number | string) => get<ICredits>(`/movie/${id}/credits`),
  recommendations: (id: number | string) =>
    get<IPagedResult<IMovie>>(`/movie/${id}/recommendations`),
  search:     (keyword: string) =>
    get<IPagedResult<IMovie>>("/search/movie", { query: keyword }),
};

/** TV */
export const tvAPI = {
  latest:      () => get<ITvDetail>("/tv/latest"), // 단일 객체
  airingToday: () => get<IPagedResult<ITv>>("/tv/airing_today"),
  popular:     () => get<IPagedResult<ITv>>("/tv/popular"),
  topRated:    () => get<IPagedResult<ITv>>("/tv/top_rated"),
  detail:      (id: number | string) => get<ITvDetail>(`/tv/${id}`),
  videos:      (id: number | string) => get<IVideoResult>(`/tv/${id}/videos`),
  credits:     (id: number | string) => get<ICredits>(`/tv/${id}/credits`),
  recommendations: (id: number | string) =>
    get<IPagedResult<ITv>>(`/tv/${id}/recommendations`),
  search:      (keyword: string) =>
    get<IPagedResult<ITv>>("/search/tv", { query: keyword }),
};

export { API_KEY, BASE_PATH };