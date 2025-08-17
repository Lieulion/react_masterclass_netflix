// src/Routes/Tv.tsx
import { useMemo, useState } from "react";
import styled from "styled-components";
import { motion, AnimatePresence, useViewportScroll } from "framer-motion";
import { makeImagePath } from "../utils";
import { useMultipleTvQuery } from "../hooks/useMultipleQuery";
import { ITv, IPagedResult } from "../api/tmdb";
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
  background-image:
    linear-gradient(rgba(0,0,0,0), rgba(0,0,0,1)),
    url(${(p) => p.bgphoto});
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
  /* 카드가 떠올라도 안 잘리고, 이 안에서만 z-index가 작동하도록 */
  overflow: visible;
  isolation: isolate;
`;

const Row = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  z-index: 0; /* 화살표(3)보다 항상 아래 */

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
  z-index: 3; /* 슬라이더 내부에서 카드 위로 */
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
  overflow: visible;
  position: relative;

  /* hover 겹침/성능 보정 */
  will-change: transform;
  z-index: 0;
  &:hover { z-index: 1; } /* 화살표(3)보다 낮게 유지 */

  &:first-child { transform-origin: center left; }
  &:last-child  { transform-origin: center right; }
`;

const BoxOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0));
  opacity: 0;
  transition: opacity .2s ease;
  ${Box}:hover & { opacity: 1; }
`;

const BoxTitle = styled.span`
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 10px;
  color: #eee;
  font-size: 14px;
  font-weight: 600;
  text-shadow: 0 2px 6px rgba(0,0,0,.6);
`;

/* ====== 모달 ====== */
const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background-color: rgba(0,0,0,0.6);
  opacity: 0;
`;

const BigShow = styled(motion.div)`
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
 * motion variants
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
    transition: { delay: 0.5, duaration: 0.1, type: "tween" }, // 원본 호버 타이밍 유지
  },
};

/* ========================
 * utils
 * ======================== */
const OFFSET = 6;

function usePaginated(items: ITv[] | undefined) {
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

  const next = () => { setDir(1); setIndex((prev) => (prev === maxIndex ? 0 : prev + 1)); };
  const prev = () => { setDir(-1); setIndex((prev) => (prev === 0 ? maxIndex : prev - 1)); };
  return { page, index, next, prev, dir };
}

function normalizePaged(res?: IPagedResult<ITv>): ITv[] {
  return res?.results?.filter((m) => m.backdrop_path || m.poster_path) ?? [];
}
function normalizeSingle(item?: ITv | null): ITv[] {
  return item && (item.backdrop_path || item.poster_path) ? [item] : [];
}

/* ========================
 * Page
 * ======================== */
export default function Tv() {
  const history = useHistory();
  const bigMatch = useRouteMatch<{ tvId: string }>("/tv/:tvId");
  const { scrollY } = useViewportScroll();

  const [latestQ, airingTodayQ, popularQ, topRatedQ] = useMultipleTvQuery();
  const loading =
    latestQ.isLoading || airingTodayQ.isLoading || popularQ.isLoading || topRatedQ.isLoading;

  const latest   = useMemo(() => normalizeSingle(latestQ.data as ITv | null | undefined), [latestQ.data]);
  const airing   = useMemo(() => normalizePaged(airingTodayQ.data as IPagedResult<ITv> | undefined), [airingTodayQ.data]);
  const popular  = useMemo(() => normalizePaged(popularQ.data as IPagedResult<ITv> | undefined), [popularQ.data]);
  const topRated = useMemo(() => normalizePaged(topRatedQ.data as IPagedResult<ITv> | undefined), [topRatedQ.data]);

  const banner = (popular?.[0] ?? airing?.[0] ?? latest?.[0]);

  const latestPager   = usePaginated(latest);
  const airingPager   = usePaginated(airing);
  const popularPager  = usePaginated(popular);
  const topRatedPager = usePaginated(topRated);

  const onBoxClick = (id: number) => history.push(`/tv/${id}`);
  const onOverlay  = () => history.push("/tv");

  const clicked =
    bigMatch?.params.tvId &&
    [...latest, ...airing, ...popular, ...topRated].find((s) => s.id === +bigMatch.params.tvId);

  if (loading) return <Loader>Loading…</Loader>;

  return (
    <Wrapper>
      {banner && (
        <Banner bgphoto={makeImagePath(banner.backdrop_path || banner.poster_path || "", "original")}>
          <Title>{banner.name}</Title>
          {banner.overview && <Overview>{banner.overview}</Overview>}
        </Banner>
      )}

      {/* Latest Shows */}
      <Section>
        <SectionTitle>Latest Shows</SectionTitle>
        <Slider>
          <ArrowButton left onClick={latestPager.prev}>‹</ArrowButton>
          <ArrowButton onClick={latestPager.next}>›</ArrowButton>
          <Row
            key={latestPager.index}
            custom={latestPager.dir}
            variants={rowVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={rowVariants.transition}
          >
            {latestPager.page.map((s) => (
              <Box
                key={s.id}
                bgphoto={makeImagePath(s.backdrop_path || s.poster_path || "", "w500")}
                variants={boxVariants}
                initial="normal"
                whileHover="hover"
                whileTap={{ scale: 0.98 }}
                onClick={() => onBoxClick(s.id)}
              >
                <BoxOverlay />
                <BoxTitle>{s.name}</BoxTitle>
              </Box>
            ))}
          </Row>
        </Slider>
      </Section>

      {/* Airing Today */}
      <Section>
        <SectionTitle>Airing Today</SectionTitle>
        <Slider>
          <ArrowButton left onClick={airingPager.prev}>‹</ArrowButton>
          <ArrowButton onClick={airingPager.next}>›</ArrowButton>
          <Row
            key={airingPager.index}
            custom={airingPager.dir}
            variants={rowVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={rowVariants.transition}
          >
            {airingPager.page.map((s) => (
              <Box
                key={s.id}
                bgphoto={makeImagePath(s.backdrop_path || s.poster_path || "", "w500")}
                variants={boxVariants}
                initial="normal"
                whileHover="hover"
                whileTap={{ scale: 0.98 }}
                onClick={() => onBoxClick(s.id)}
              >
                <BoxOverlay />
                <BoxTitle>{s.name}</BoxTitle>
              </Box>
            ))}
          </Row>
        </Slider>
      </Section>

      {/* Popular */}
      <Section>
        <SectionTitle>Popular</SectionTitle>
        <Slider>
          <ArrowButton left onClick={popularPager.prev}>‹</ArrowButton>
          <ArrowButton onClick={popularPager.next}>›</ArrowButton>
          <Row
            key={popularPager.index}
            custom={popularPager.dir}
            variants={rowVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={rowVariants.transition}
          >
            {popularPager.page.map((s) => (
              <Box
                key={s.id}
                bgphoto={makeImagePath(s.backdrop_path || s.poster_path || "", "w500")}
                variants={boxVariants}
                initial="normal"
                whileHover="hover"
                whileTap={{ scale: 0.98 }}
                onClick={() => onBoxClick(s.id)}
              >
                <BoxOverlay />
                <BoxTitle>{s.name}</BoxTitle>
              </Box>
            ))}
          </Row>
        </Slider>
      </Section>

      {/* Top Rated */}
      <Section>
        <SectionTitle>Top Rated</SectionTitle>
        <Slider>
          <ArrowButton left onClick={topRatedPager.prev}>‹</ArrowButton>
          <ArrowButton onClick={topRatedPager.next}>›</ArrowButton>
          <Row
            key={topRatedPager.index}
            custom={topRatedPager.dir}
            variants={rowVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={rowVariants.transition}
          >
            {topRatedPager.page.map((s) => (
              <Box
                key={s.id}
                bgphoto={makeImagePath(s.backdrop_path || s.poster_path || "", "w500")}
                variants={boxVariants}
                initial="normal"
                whileHover="hover"
                whileTap={{ scale: 0.98 }}
                onClick={() => onBoxClick(s.id)}
              >
                <BoxOverlay />
                <BoxTitle>{s.name}</BoxTitle>
              </Box>
            ))}
          </Row>
        </Slider>
      </Section>

      {/* 클릭 모달 */}
      <AnimatePresence>
        {bigMatch ? (
          <>
            <Overlay onClick={onOverlay} exit={{ opacity: 0 }} animate={{ opacity: 1 }} />
            <BigShow style={{ top: (scrollY?.get?.() ?? 0) + 100 }} layoutId={bigMatch.params.tvId}>
              {clicked && (
                <>
                  <BigCover
                    style={{
                      backgroundImage: `linear-gradient(to top, black, transparent), url(${makeImagePath(
                        clicked.backdrop_path || clicked.poster_path || "",
                        "w500"
                      )})`,
                    }}
                  />
                  <BigTitle>{clicked.name}</BigTitle>
                  <BigOverview>{clicked.overview}</BigOverview>
                </>
              )}
            </BigShow>
          </>
        ) : null}
      </AnimatePresence>
    </Wrapper>
  );
}