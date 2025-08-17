// src/Routes/Search.tsx
import { useMemo, useState } from "react";
import styled from "styled-components";
import { motion, AnimatePresence, useViewportScroll } from "framer-motion";
import { useLocation, useHistory, useRouteMatch } from "react-router-dom";
import { makeImagePath } from "../utils";
import { useMultipleSearchQuery } from "../hooks/useMultipleQuery";
import { IMovie, ITv, IPagedResult } from "../api/tmdb";

/* ========================
 * styled
 * ======================== */
const Wrapper = styled.div`
  background: black;
  min-height: 100vh;
  padding: 80px 0 160px;
  color: ${(p) => p.theme.white.lighter};
`;

const Loader = styled.div`
  height: 20vh;
  display: grid;
  place-items: center;
`;

const Header = styled.div`
  margin: 0 60px 12px;
  font-size: 26px;
  font-weight: 700;
`;

const Keyword = styled.span`
  color: #ffd369;
`;

const Section = styled.section`
  margin-top: 28px;
`;

const SectionTitle = styled.h3`
  font-size: 22px;
  font-weight: 700;
  margin: 0 60px 14px;
`;

const Slider = styled.div`
  position: relative;
  margin: 0 60px;
  /* Home.tsx와 동일: hover 시 카드가 위로 떠도 안 잘리게 */
  overflow: visible;
`;

const Row = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(5, 1fr);
  }
  @media (max-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const ArrowButton = styled.button<{ left?: boolean }>`
  position: absolute;
  top: 50%;
  ${(p) => (p.left ? "left: 6px" : "right: 6px")};
  transform: translateY(-50%);
  z-index: 2;
  width: 42px;
  height: 42px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.2);
  background: rgba(0,0,0,0.5);
  color: #fff;
  backdrop-filter: blur(4px);
  display: grid;
  place-items: center;
  cursor: pointer;
`;

const Box = styled(motion.div)<{ bgphoto: string }>`
  background-image: url(${(p) => p.bgphoto});
  background-size: cover;
  background-position: center center;
  height: 180px;
  border-radius: 6px;
  cursor: pointer;
  /* Home.tsx와 동일 */
  overflow: visible;
  position: relative;
  will-change: transform;
  z-index: 0;

  &:first-child { transform-origin: center left; }
  &:last-child  { transform-origin: center right; }
`;

const Info = styled(motion.div)`
  padding: 10px;
  background-color: ${(p) => p.theme.black.lighter};
  opacity: 0;
  position: absolute;
  width: 100%;
  bottom: 0;
  h4 {
    text-align: center;
    font-size: 14px;
    color: white;
  }
`;

const BoxOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0));
  opacity: 0;
  transition: opacity .2s ease;
  ${Box}:hover & { opacity: 1; }
`;

/* ====== 모달 ====== */
const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background-color: rgba(0,0,0,0.6);
  opacity: 0;
`;

const BigPanel = styled(motion.div)`
  position: absolute;
  width: 40vw;
  height: 80vh;
  left: 0;
  right: 0;
  margin: 0 auto;
  border-radius: 15px;
  overflow: hidden;
  background-color: ${(p) => p.theme.black.lighter};
`;

const BigCover = styled.div`
  width: 100%;
  height: 400px;
  background-size: cover;
  background-position: center center;
`;

const BigTitle = styled.h3`
  color: ${(p) => p.theme.white.lighter};
  padding: 20px;
  font-size: 46px;
  position: relative;
  top: -80px;
`;

const BigOverview = styled.p`
  color: ${(p) => p.theme.white.lighter};
  padding: 20px;
  position: relative;
  top: -80px;
`;

/* ========================
 * motion variants (Home과 동일)
 * ======================== */
const rowVariants = {
  initial: (dir: number) => ({ x: dir > 0 ? window.innerWidth : -window.innerWidth }),
  animate: { x: 0 },
  exit:    (dir: number) => ({ x: dir > 0 ? -window.innerWidth : window.innerWidth }),
  transition: { type: "tween", duration: 0.5 },
};

const boxVariants = {
  normal: { scale: 1 },
  hover:  {
    scale: 1.3,
    y: -80,
    transition: { delay: 0.5, duaration: 0.1, type: "tween" }, // 원본 타이밍(duaration 오타도 동일)
  },
};

const infoVariants = {
  hover: {
    opacity: 1,
    transition: { delay: 0.5, duaration: 0.1, type: "tween" },
  },
};

/* ========================
 * utils
 * ======================== */
const OFFSET = 6;

function usePaginated<T extends { id: number }>(items: T[] | undefined) {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const maxIndex = useMemo(() => {
    if (!items || items.length === 0) return 0;
    const pages = Math.ceil(items.length / OFFSET);
    return Math.max(0, pages - 1);
  }, [items]);

  const page = useMemo(() => {
    if (!items) return [];
    const start = index * OFFSET;
    return items.slice(start, start + OFFSET);
  }, [items, index]);

  const next = () => { setDir(1); setIndex((p) => (p === maxIndex ? 0 : p + 1)); };
  const prev = () => { setDir(-1); setIndex((p) => (p === 0 ? maxIndex : p - 1)); };
  return { page, index, next, prev, dir };
}

function normalizeMovies(res?: IPagedResult<IMovie>): IMovie[] {
  return res?.results?.filter((m) => m.backdrop_path || m.poster_path) ?? [];
}
function normalizeTvs(res?: IPagedResult<ITv>): ITv[] {
  return res?.results?.filter((m) => m.backdrop_path || m.poster_path) ?? [];
}

/* ========================
 * Page
 * ======================== */
export default function Search() {
  const history = useHistory();
  const { search } = useLocation();
  const { scrollY } = useViewportScroll();

  // /search 내부 모달 라우트
  const movieMatch = useRouteMatch<{ movieId: string }>("/search/movie/:movieId");
  const tvMatch    = useRouteMatch<{ tvId: string }>("/search/tv/:tvId");

  const keyword = useMemo(() => {
    const sp = new URLSearchParams(search);
    return sp.get("keyword")?.trim() ?? "";
  }, [search]);

  const [movieQ, tvQ] = useMultipleSearchQuery(keyword);
  const loading = movieQ.isLoading || tvQ.isLoading;

  const movies = useMemo(() => normalizeMovies(movieQ.data as IPagedResult<IMovie> | undefined), [movieQ.data]);
  const tvs    = useMemo(() => normalizeTvs(tvQ.data as IPagedResult<ITv> | undefined), [tvQ.data]);

  const moviesPager = usePaginated(movies);
  const tvsPager    = usePaginated(tvs);

  // 클릭 시 현재 쿼리 유지해서 /search 안쪽으로 푸시
  const openMovie = (id: number) => history.push(`/search/movie/${id}${search}`);
  const openTv    = (id: number) => history.push(`/search/tv/${id}${search}`);
  const closeModal = () => history.push(`/search${search}`);

  // 모달에 표시할 선택 항목
  const clickedMovie =
    movieMatch?.params.movieId && movies.find((m) => m.id === +movieMatch.params.movieId);
  const clickedTv =
    tvMatch?.params.tvId && tvs.find((t) => t.id === +tvMatch.params.tvId);

  if (!keyword) {
    return (
      <Wrapper>
        <Header>검색어를 입력하세요.</Header>
      </Wrapper>
    );
  }

  if (loading) {
    return (
      <Wrapper>
        <Header>
          <Keyword>"{keyword}"</Keyword> 검색 중…
        </Header>
        <Loader>Loading…</Loader>
      </Wrapper>
    );
  }

  const noMovie = movies.length === 0;
  const noTv = tvs.length === 0;

  return (
    <Wrapper>
      <Header>
        <Keyword>"{keyword}"</Keyword> 검색 결과
      </Header>

      {/* Movies 결과 */}
      {!noMovie && (
        <Section>
          <SectionTitle>Movies</SectionTitle>
          <Slider>
            <ArrowButton left onClick={moviesPager.prev}>‹</ArrowButton>
            <ArrowButton onClick={moviesPager.next}>›</ArrowButton>
            <Row
              key={moviesPager.index}
              custom={moviesPager.dir}
              variants={rowVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={rowVariants.transition}
            >
              {moviesPager.page.map((m) => (
                <Box
                  key={`movie-${m.id}`}
                  layoutId={`search-movie-${m.id}`}
                  bgphoto={makeImagePath(m.backdrop_path || m.poster_path || "", "w500")}
                  variants={boxVariants}
                  initial="normal"
                  whileHover="hover"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => openMovie(m.id)}
                >
                  <BoxOverlay />
                  <Info variants={infoVariants}><h4>{m.title}</h4></Info>
                </Box>
              ))}
            </Row>
          </Slider>
        </Section>
      )}

      {/* TV Shows 결과 */}
      {!noTv && (
        <Section>
          <SectionTitle>TV Shows</SectionTitle>
          <Slider>
            <ArrowButton left onClick={tvsPager.prev}>‹</ArrowButton>
            <ArrowButton onClick={tvsPager.next}>›</ArrowButton>
            <Row
              key={tvsPager.index}
              custom={tvsPager.dir}
              variants={rowVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={rowVariants.transition}
            >
              {tvsPager.page.map((t) => (
                <Box
                  key={`tv-${t.id}`}
                  layoutId={`search-tv-${t.id}`}
                  bgphoto={makeImagePath(t.backdrop_path || t.poster_path || "", "w500")}
                  variants={boxVariants}
                  initial="normal"
                  whileHover="hover"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => openTv(t.id)}
                >
                  <BoxOverlay />
                  <Info variants={infoVariants}><h4>{t.name}</h4></Info>
                </Box>
              ))}
            </Row>
          </Slider>
        </Section>
      )}

      {/* 아무 결과도 없을 때 */}
      {noMovie && noTv && (
        <Section>
          <SectionTitle>검색 결과가 없습니다.</SectionTitle>
        </Section>
      )}

      {/* 검색 내부 모달 (영화/TV 둘 중 하나라도 열리면 표시) */}
      <AnimatePresence>
        {(movieMatch || tvMatch) ? (
          <>
            <Overlay onClick={closeModal} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <BigPanel
              style={{ top: (typeof scrollY?.get === "function" ? scrollY.get() : 0) + 100 }}
              layoutId={
                movieMatch
                  ? `search-movie-${movieMatch.params.movieId}`
                  : `search-tv-${tvMatch!.params.tvId}`
              }
            >
              {clickedMovie && (
                <>
                  <BigCover
                    style={{
                      backgroundImage: `linear-gradient(to top, black, transparent), url(${makeImagePath(
                        clickedMovie.backdrop_path || clickedMovie.poster_path || "",
                        "w780"
                      )})`,
                    }}
                  />
                  <BigTitle>{clickedMovie.title}</BigTitle>
                  <BigOverview>{clickedMovie.overview}</BigOverview>
                </>
              )}
              {clickedTv && (
                <>
                  <BigCover
                    style={{
                      backgroundImage: `linear-gradient(to top, black, transparent), url(${makeImagePath(
                        clickedTv.backdrop_path || clickedTv.poster_path || "",
                        "w780"
                      )})`,
                    }}
                  />
                  <BigTitle>{clickedTv.name}</BigTitle>
                  <BigOverview>{clickedTv.overview}</BigOverview>
                </>
              )}
            </BigPanel>
          </>
        ) : null}
      </AnimatePresence>
    </Wrapper>
  );
}