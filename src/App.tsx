// src/App.tsx
import { HashRouter as Router, Switch, Route, Redirect } from "react-router-dom";
import Header from "./Components/Header";
import Home from "./Routes/Home";
import Search from "./Routes/Search";
import Tv from "./Routes/Tv";
import Movie from "./Routes/Movie";

function App() {
  return (
    <Router>
      <Header />
      <Switch>
        <Route path="/tv/:tvId"><Tv /></Route>
        <Route path="/tv"><Tv /></Route>

        <Route path="/search/movie/:movieId"><Search /></Route>
        <Route path="/search/tv/:tvId"><Search /></Route>
        <Route path="/search"><Search /></Route>

        <Route path="/movie/:movieId"><Movie /></Route>

        <Route exact path="/"><Home /></Route>
        <Redirect to="/" />
      </Switch>
    </Router>
  );
}

export default App;