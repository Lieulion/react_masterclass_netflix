// src/hooks/useMultipleQuery.tsx
import { useQuery, UseQueryResult } from "react-query";
import { movieAPI, tvAPI, IPagedResult, IMovie, ITv } from "../api/tmdb";

/** 공통 옵션 */
const common = {
  keepPreviousData: true as const,
  staleTime: 60_000,
};

/** Home: 영화 3종 */
export const useMultipleMovieQuery = (): readonly [
  UseQueryResult<IPagedResult<IMovie>>,
  UseQueryResult<IPagedResult<IMovie>>,
  UseQueryResult<IPagedResult<IMovie>>
] => {
  const latest   = useQuery<IPagedResult<IMovie>>(["movies", "nowPlaying"], movieAPI.nowPlaying, common);
  const topRated = useQuery<IPagedResult<IMovie>>(["movies", "topRated"],   movieAPI.topRated,   common);
  const upcoming = useQuery<IPagedResult<IMovie>>(["movies", "upcoming"],   movieAPI.upcoming,   common);
  return [latest, topRated, upcoming] as const;
};

/** TV: Latest(단일), Airing Today, Popular, Top Rated */
export const useMultipleTvQuery = (): readonly [
  UseQueryResult<ITv | null>,             // latest (단일)
  UseQueryResult<IPagedResult<ITv>>,      // airing_today
  UseQueryResult<IPagedResult<ITv>>,      // popular
  UseQueryResult<IPagedResult<ITv>>       // top_rated
] => {
  const latest      = useQuery<ITv | null>(["tv", "latest"],       tvAPI.latest,      common);
  const airingToday = useQuery<IPagedResult<ITv>>(["tv", "airingToday"],  tvAPI.airingToday, common);
  const popular     = useQuery<IPagedResult<ITv>>(["tv", "popular"],      tvAPI.popular,     common);
  const topRated    = useQuery<IPagedResult<ITv>>(["tv", "topRated"],     tvAPI.topRated,    common);
  return [latest, airingToday, popular, topRated] as const;
};

/** Search */
export const useMultipleSearchQuery = (
  keyword: string
): readonly [
  UseQueryResult<IPagedResult<IMovie>>,
  UseQueryResult<IPagedResult<ITv>>
] => {
  const enabled = !!keyword && keyword.trim().length > 0;
  const movie = useQuery<IPagedResult<IMovie>>(
    ["search", "movie", keyword],
    () => movieAPI.search(keyword),
    { ...common, enabled }
  );
  const tv = useQuery<IPagedResult<ITv>>(
    ["search", "tv", keyword],
    () => tvAPI.search(keyword),
    { ...common, enabled }
  );
  return [movie, tv] as const;
};