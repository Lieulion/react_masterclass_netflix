// src/Routes/Home.tsx
import { useMemo, useState } from "react";
import styled from "styled-components";
import { motion, AnimatePresence, useViewportScroll } from "framer-motion";
import { useQuery } from "react-query";
import { makeImagePath } from "../utils";
import { useMultipleMovieQuery } from "../hooks/useMultipleQuery";
import { IMovie, IPagedResult, IMovieDetail, movieAPI } from "../api/tmdb";
import { useHistory, useRouteMatch } from "react-router-dom";

/* ========================
 * styled
 * ======================== */
const Wrapper = styled.div`
  background: black;
  min-height: 100vh;
  padding-bottom: 160px;
`;

const Loader = styled.div`
  height: 20vh;
  display: grid;
  place-items: center;
  color: white;
`;

const Banner = styled.div<{ bgphoto: string }>`
  height: 60vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 60px;
  background-image: linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 1)),
    url(${(props) => props.bgphoto});
  background-size: cover;
  background-position: center center;
`;

const Title = styled.h2`
  color: ${(p) => p.theme.white.lighter};
  font-size: 64px;
  font-weight: 700;
  margin-bottom: 16px;
`;

const Overview = styled.p`
  color: ${(p) => p.theme.white.darker};
  font-size: 18px;
  line-height: 1.4;
  max-width: 720px;
`;

const Section = styled.section`
  margin-top: 48px;
`;

const SectionTitle = styled.h3`
  color: ${(p) => p.theme.white.lighter};
  font-size: 24px;
  font-weight: 700;
  margin: 0 60px 16px;
`;

const Slider = styled.div`
  position: relative;
  margin: 0 60px;
  overflow: visible; /* hover 시 카드 잘림 방지 */
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
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.5);
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
  overflow: visible;
  position: relative;
  will-change: transform;
  z-index: 0;

  &:first-child {
    transform-origin: center left;
  }
  &:last-child {
    transform-origin: center right;
  }
`;

const Info = styled(motion.div)`
  padding: 10px;
  background-color: ${(props) => props.theme.black.lighter};
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
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0));
  opacity: 0;
  transition: opacity 0.2s ease;
  ${Box}:hover & {
    opacity: 1;
  }
`;

/* ====== 클릭 후 내용(모달) ====== */
const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  opacity: 0;
`;

const BigMovie = styled(motion.div)`
  position: absolute;
  width: 56vw;
  max-width: 980px;
  height: auto;
  left: 0;
  right: 0;
  margin: 0 auto;
  border-radius: 16px;
  overflow: hidden;
  background-color: ${(props) => props.theme.black.lighter};
`;

const BigCover = styled.div`
  width: 100%;
  height: 420px;
  background-size: cover;
  background-position: center center;
`;

const BigBody = styled.div`
  padding: 24px;
`;

const BigTitle = styled.h3`
  color: ${(props) => props.theme.white.lighter};
  font-size: 36px;
  font-weight: 800;
  margin-bottom: 8px;
`;

const BigMeta = styled.div`
  color: ${(props) => props.theme.white.darker};
  font-size: 14px;
  margin-bottom: 16px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const BigOverview = styled.p`
  color: ${(props) => props.theme.white.lighter};
  line-height: 1.5;
`;

/* ========================
 * motion variants (예전 효과 그대로)
 * ======================== */
const rowVariants = {
  initial: (dir: number) => ({
    x: dir > 0 ? window.innerWidth : -window.innerWidth,
  }),
  animate: { x: 0 },
  exit: (dir: number) => ({
    x: dir > 0 ? -window.innerWidth : window.innerWidth,
  }),
  transition: { type: "tween", duration: 0.5 },
};

const boxVariants = {
  normal: { scale: 1 },
  hover: {
    scale: 1.3,
    y: -80,
    transition: { delay: 0.5, duaration: 0.1, type: "tween" }, // 원본 스타일
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

function usePaginated(items: IMovie[] | undefined) {
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

  const next = () => {
    setDir(1);
    setIndex((prev) => (prev === maxIndex ? 0 : prev + 1));
  };
  const prev = () => {
    setDir(-1);
    setIndex((prev) => (prev === 0 ? maxIndex : prev - 1));
  };
  return { page, index, next, prev, dir };
}

function normalizePaged(res?: IPagedResult<IMovie>): IMovie[] {
  return res?.results?.filter((m) => m.backdrop_path || m.poster_path) ?? [];
}

/* ========================
 * Page
 * ======================== */
export default function Home() {
  const history = useHistory();
  const bigMovieMatch = useRouteMatch<{ movieId: string }>("/movie/:movieId");
  const { scrollY } = useViewportScroll();

  // nowPlaying, topRated, upcoming
  const [nowPlayingQ, topRatedQ, upcomingQ] = useMultipleMovieQuery();
  const loading =
    nowPlayingQ.isLoading || topRatedQ.isLoading || upcomingQ.isLoading;

  // 데이터 정규화
  const nowPlaying = useMemo(
    () => normalizePaged(nowPlayingQ.data),
    [nowPlayingQ.data]
  );
  const topRated = useMemo(
    () => normalizePaged(topRatedQ.data),
    [topRatedQ.data]
  );
  const upcoming = useMemo(
    () => normalizePaged(upcomingQ.data),
    [upcomingQ.data]
  );

  // 배너: now_playing 첫 작품
  const banner = nowPlaying?.[0];

  // 각 섹션 페이지네이션 훅 (슬라이더 구조 그대로)
  const latestPager = usePaginated(nowPlaying);
  const topRatedPager = usePaginated(topRated);
  const upcomingPager = usePaginated(upcoming);

  // 클릭 → 라우팅
  const onBoxClicked = (movieId: number) => {
    history.push(`/movie/${movieId}`);
  };
  const onOverlayClick = () => history.push("/");

  // 모달용 선택된 영화 (세 섹션 합침)
  const all = useMemo(
    () => [...(nowPlaying ?? []), ...(topRated ?? []), ...(upcoming ?? [])],
    [nowPlaying, topRated, upcoming]
  );

  const movieId = bigMovieMatch?.params.movieId;
  const clickedMovie: IMovie | undefined = useMemo(() => {
    if (!movieId) return undefined;
    return all.find((m) => m.id === +movieId);
  }, [all, movieId]);

  // 상세 데이터 (런타임/장르 등 표시용)
  const { data: detail } = useQuery<IMovieDetail>(
    ["movie", "detail", movieId],
    () => movieAPI.detail(movieId!),
    { enabled: !!movieId }
  );

  if (loading) return <Loader>Loading…</Loader>;

  return (
    <Wrapper>
      {banner && (
        <Banner
          bgphoto={makeImagePath(
            banner.backdrop_path || banner.poster_path || "",
            "original"
          )}
        >
          <Title>{banner.title}</Title>
          {banner.overview && <Overview>{banner.overview}</Overview>}
        </Banner>
      )}

      {/* Latest (now_playing) */}
      <Section>
        <SectionTitle>Latest Movies</SectionTitle>
        <Slider>
          <ArrowButton left onClick={latestPager.prev} aria-label="previous">
            ‹
          </ArrowButton>
          <ArrowButton onClick={latestPager.next} aria-label="next">
            ›
          </ArrowButton>
          <Row
            key={latestPager.index}
            custom={latestPager.dir}
            variants={rowVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={rowVariants.transition}
          >
            {latestPager.page.map((m) => (
              <Box
                key={m.id}
                layoutId={m.id + ""}
                bgphoto={makeImagePath(
                  m.backdrop_path || m.poster_path || "",
                  "w500"
                )}
                variants={boxVariants}
                initial="normal"
                whileHover="hover"
                whileTap={{ scale: 0.98 }}
                onClick={() => onBoxClicked(m.id)}
              >
                <BoxOverlay />
                <Info variants={infoVariants}>
                  <h4>{m.title}</h4>
                </Info>
              </Box>
            ))}
          </Row>
        </Slider>
      </Section>

      {/* Top Rated */}
      <Section>
        <SectionTitle>Top Rated Movies</SectionTitle>
        <Slider>
          <ArrowButton left onClick={topRatedPager.prev} aria-label="previous">
            ‹
          </ArrowButton>
          <ArrowButton onClick={topRatedPager.next} aria-label="next">
            ›
          </ArrowButton>
          <Row
            key={topRatedPager.index}
            custom={topRatedPager.dir}
            variants={rowVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={rowVariants.transition}
          >
            {topRatedPager.page.map((m) => (
              <Box
                key={m.id}
                layoutId={m.id + ""}
                bgphoto={makeImagePath(
                  m.backdrop_path || m.poster_path || "",
                  "w500"
                )}
                variants={boxVariants}
                initial="normal"
                whileHover="hover"
                whileTap={{ scale: 0.98 }}
                onClick={() => onBoxClicked(m.id)}
              >
                <BoxOverlay />
                <Info variants={infoVariants}>
                  <h4>{m.title}</h4>
                </Info>
              </Box>
            ))}
          </Row>
        </Slider>
      </Section>

      {/* Upcoming */}
      <Section>
        <SectionTitle>Upcoming Movies</SectionTitle>
        <Slider>
          <ArrowButton left onClick={upcomingPager.prev} aria-label="previous">
            ‹
          </ArrowButton>
          <ArrowButton onClick={upcomingPager.next} aria-label="next">
            ›
          </ArrowButton>
          <Row
            key={upcomingPager.index}
            custom={upcomingPager.dir}
            variants={rowVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={rowVariants.transition}
          >
            {upcomingPager.page.map((m) => (
              <Box
                key={m.id}
                layoutId={m.id + ""}
                bgphoto={makeImagePath(
                  m.backdrop_path || m.poster_path || "",
                  "w500"
                )}
                variants={boxVariants}
                initial="normal"
                whileHover="hover"
                whileTap={{ scale: 0.98 }}
                onClick={() => onBoxClicked(m.id)}
              >
                <BoxOverlay />
                <Info variants={infoVariants}>
                  <h4>{m.title}</h4>
                </Info>
              </Box>
            ))}
          </Row>
        </Slider>
      </Section>

      {/* 클릭 시 모달 */}
      <AnimatePresence>
        {movieId ? (
          <>
            <Overlay
              onClick={onOverlayClick}
              exit={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            />
            <BigMovie
              style={{ top: (scrollY?.get?.() ?? 0) + 100 }}
              layoutId={movieId}
            >
              {/* 커버 */}
              <BigCover
                style={{
                  backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.9), transparent 55%), url(${makeImagePath(
                    (detail?.backdrop_path ||
                      clickedMovie?.backdrop_path ||
                      clickedMovie?.poster_path ||
                      "") as string,
                    "w780"
                  )})`,
                }}
              />
              <BigBody>
                <BigTitle>
                  {detail?.title || clickedMovie?.title || "Untitled"}
                </BigTitle>
                <BigMeta>
                  {detail?.release_date && <span>{detail.release_date}</span>}
                  {typeof detail?.runtime === "number" && detail.runtime > 0 && (
                    <span>{detail.runtime}m</span>
                  )}
                  {detail?.vote_average !== undefined && (
                    <span>⭐ {detail.vote_average.toFixed(1)}</span>
                  )}
                  {detail?.genres && detail.genres.length > 0 && (
                    <span>
                      {detail.genres.map((g) => g.name).join(" · ")}
                    </span>
                  )}
                </BigMeta>
                <BigOverview>
                  {detail?.overview || clickedMovie?.overview}
                </BigOverview>
              </BigBody>
            </BigMovie>
          </>
        ) : null}
      </AnimatePresence>
    </Wrapper>
  );
}