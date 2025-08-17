// src/Routes/Movie.tsx
import { useHistory, useParams } from "react-router-dom";
import { useQuery } from "react-query";
import styled from "styled-components";
import { motion } from "framer-motion";
import Header from "../Components/Header";
import {
  movieAPI,
  IMovieDetail,
  IVideoResult,
  ICredits,
  IPagedResult,
  IMovie,
} from "../api/tmdb";
import { makeImagePath } from "../utils";

/* ========= styled ========= */
const Page = styled.div`
  min-height: 100vh;
  background: black;
  color: ${(p) => p.theme.white.lighter};
`;

const PageInner = styled.div`
  /* 고정 헤더가 있다면 메인 영역이 가리지 않도록 여백 확보 */
  padding-top: 80px;
`;

const Hero = styled.div<{ bg: string }>`
  position: relative;
  height: 60vh;
  background-image: linear-gradient(rgba(0,0,0,0) 0%, rgba(0,0,0,.9) 70%),
    url(${(p) => p.bg});
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: flex-end;
  padding: 60px;
`;

const HeroText = styled.div`
  max-width: 900px;
`;

const Title = styled.h1`
  font-size: 56px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: 8px;
`;
const Tagline = styled.p`
  color: #bbb;
  font-style: italic;
`;

const Content = styled.div`
  margin-top: -80px;
  padding: 0 60px 80px;
`;

const Card = styled(motion.div)`
  background: ${(p) => p.theme.black.lighter};
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  overflow: hidden;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 24px;
  padding: 24px;
  @media (max-width: 920px) {
    grid-template-columns: 1fr;
  }
`;

const Poster = styled.div<{ src: string }>`
  width: 100%;
  aspect-ratio: 2 / 3;
  background-image: url(${(p) => p.src});
  background-size: cover;
  background-position: center;
  border-radius: 12px;
`;

const Meta = styled.div`
  display: grid;
  gap: 10px;
`;

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  align-items: center;
`;

const Badge = styled.span`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.15);
  color: #ddd;
  font-size: 12px;
`;

const Label = styled.span`
  color: #9aa0a6;
  font-size: 13px;
`;

const Value = styled.span`
  color: #e5e5e5;
  font-size: 14px;
`;

const Overview = styled.p`
  margin-top: 8px;
  line-height: 1.6;
  color: #e5e5e5;
`;

const Section = styled.section`
  margin-top: 24px;
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 12px;
`;

const FlexRow = styled.div`
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 6px;
  &::-webkit-scrollbar { height: 8px; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,.12); border-radius: 999px; }
`;

const CastCard = styled(motion.div)`
  width: 140px;
  flex: 0 0 auto;
  background: ${(p) => p.theme.black.darker};
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  overflow: hidden;
`;
const CastImg = styled.div<{ src: string }>`
  width: 100%;
  aspect-ratio: 2 / 3;
  background-image: url(${(p) => p.src});
  background-size: cover;
  background-position: center;
`;
const CastName = styled.div`
  font-size: 14px;
  font-weight: 600;
  padding: 8px 10px 0;
`;
const CastRole = styled.div`
  font-size: 12px;
  color: #aaa;
  padding: 0 10px 10px;
`;

const VideoFrame = styled.iframe`
  width: 100%;
  height: 420px;
  border: 0;
  border-radius: 12px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  @media (max-width: 1200px) { grid-template-columns: repeat(5, 1fr); }
  @media (max-width: 920px) { grid-template-columns: repeat(3, 1fr); }
  @media (max-width: 560px) { grid-template-columns: repeat(2, 1fr); }
`;

const Box = styled(motion.div)<{ bg: string }>`
  background-image: url(${(p) => p.bg});
  background-size: cover;
  background-position: center;
  border-radius: 8px;
  aspect-ratio: 16 / 9;
  cursor: pointer;
  position: relative;
  overflow: hidden;
`;
const BoxShade = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,.85), transparent);
`;
const BoxTitle = styled.div`
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #eee;
  text-shadow: 0 2px 6px rgba(0,0,0,.6);
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 14px 0 6px;
`;
const BackBtn = styled.button`
  background: transparent;
  color: #ddd;
  border: 1px solid rgba(255,255,255,0.2);
  padding: 6px 12px;
  border-radius: 999px;
  cursor: pointer;
`;

/* ========= page ========= */
export default function Movie() {
  const history = useHistory();
  const { movieId } = useParams<{ movieId: string }>();
  const id = Number(movieId);

  const { data: detail, isLoading } = useQuery<IMovieDetail>(
    ["movie", "detail", id],
    () => movieAPI.detail(id)
  );

  const { data: videos } = useQuery<IVideoResult>(
    ["movie", "videos", id],
    () => movieAPI.videos(id),
    { enabled: !!id }
  );

  const { data: credits } = useQuery<ICredits>(
    ["movie", "credits", id],
    () => movieAPI.credits(id),
    { enabled: !!id }
  );

  const { data: recs } = useQuery<IPagedResult<IMovie>>(
    ["movie", "recs", id],
    () => movieAPI.recommendations(id),
    { enabled: !!id }
  );

  if (isLoading || !detail) return (
    <Page>
      <Header /> {/* App에 이미 Header가 있다면 이 줄은 지워도 됨 */}
      <PageInner />
    </Page>
  );

  const bg = makeImagePath(
    detail.backdrop_path || detail.poster_path || "",
    "original"
  );
  const poster = makeImagePath(
    detail.poster_path || detail.backdrop_path || "",
    "w500"
  );
  const trailer = videos?.results?.find(
    (v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")
  );

  return (
    <Page>
      <Header /> {/* App에 이미 Header가 있다면 이 줄은 지우세요(중복 방지) */}
      <PageInner>
        <Hero bg={bg}>
          <HeroText>
            <Title>{detail.title}</Title>
            {detail.tagline ? <Tagline>{detail.tagline}</Tagline> : null}
          </HeroText>
        </Hero>

        <Content>
          <TopBar>
            <BackBtn onClick={() => history.goBack()}>← Back</BackBtn>
            <div />
          </TopBar>

          {/* 기본 정보 */}
          <Card layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <InfoGrid>
              <Poster src={poster} />
              <Meta>
                <Row>
                  {detail.genres?.map((g) => (
                    <Badge key={g.id}>{g.name}</Badge>
                  ))}
                </Row>
                <Row>
                  <Label>평점</Label>
                  <Value>{detail.vote_average?.toFixed?.(1) ?? "-"}</Value>
                  <Label>개봉</Label>
                  <Value>{detail.release_date ?? "-"}</Value>
                  <Label>상태</Label>
                  <Value>{detail.status ?? "-"}</Value>
                  <Label>러닝타임</Label>
                  <Value>{detail.runtime ? `${detail.runtime}분` : "-"}</Value>
                </Row>
                <Row>
                  <Label>언어</Label>
                  <Value>
                    {detail.spoken_languages?.map((l) => l.english_name).join(", ") || "-"}
                  </Value>
                </Row>
                {detail.overview ? <Overview>{detail.overview}</Overview> : null}
              </Meta>
            </InfoGrid>
          </Card>

          {/* 트레일러 */}
          {trailer ? (
            <Section>
              <SectionTitle>Trailer</SectionTitle>
              <Card layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <VideoFrame
                  src={`https://www.youtube.com/embed/${trailer.key}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Trailer"
                />
              </Card>
            </Section>
          ) : null}

          {/* 출연진 */}
          {credits?.cast?.length ? (
            <Section>
              <SectionTitle>Cast</SectionTitle>
              <FlexRow>
                {credits.cast.slice(0, 20).map((c) => (
                  <CastCard
                    key={c.id}
                    whileHover={{ y: -6, scale: 1.02 }}
                    transition={{ type: "tween", duration: 0.2 }}
                  >
                    <CastImg src={makeImagePath(c.profile_path || "", "w300")} />
                    <CastName>{c.name}</CastName>
                    <CastRole>{c.character || ""}</CastRole>
                  </CastCard>
                ))}
              </FlexRow>
            </Section>
          ) : null}

          {/* 추천작 */}
          {recs?.results?.length ? (
            <Section>
              <SectionTitle>Recommendations</SectionTitle>
              <Grid>
                {recs.results.slice(0, 18).map((m) => (
                  <Box
                    key={m.id}
                    bg={makeImagePath(m.backdrop_path || m.poster_path || "", "w500")}
                    whileHover={{ scale: 1.03, y: -6 }}
                    transition={{ type: "tween", duration: 0.2 }}
                    onClick={() => history.push(`/movie/${m.id}`)}
                  >
                    <BoxShade />
                    <BoxTitle>{m.title}</BoxTitle>
                  </Box>
                ))}
              </Grid>
            </Section>
          ) : null}
        </Content>
      </PageInner>
    </Page>
  );
}