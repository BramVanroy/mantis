import './styles/index.scss';

import React, {Fragment} from 'react';
import {Route, BrowserRouter as Router, Routes, useLocation} from 'react-router-dom';
import App from './components/App';
import {Container} from 'react-bootstrap';
import MainNav from './components/MainNav';
import Project from './components/Project';
import Projects from './components/Projects';
import ReactDOM from 'react-dom';
import Text from './components/Text';


ReactDOM.render(
    <React.StrictMode>
      <Container>
        <Router>
          <MainNav/>
          <Routes>
            <Route path="/" element={<App />}/>
            <Route path="projects" element={<Projects />}/>
            <Route path="projects/:projectName" element={<Project />}>
              <Route path=":textName" element={<Text />}/>
            </Route>
            <Route path="/issues" element={<Fragment><h2>Experiencing issues?</h2><p>File an issue on Github!</p></Fragment>} />
            <Route path="*" element={<p>There's nothing here!</p>} />
          </Routes>
        </Router>
      </Container>
    </React.StrictMode>, document.querySelector('#root')
);
