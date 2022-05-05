import './styles/index.scss';

import React, {Fragment} from 'react';
import {Route, BrowserRouter as Router, Routes} from 'react-router-dom';
import {Container} from 'react-bootstrap';
import Home from './components/Home';
import MainNav from './components/MainNav';
import PageFooter from './components/PageFooter';
import Project from './components/Project';
import Projects from './components/Projects';
import ReactDOM from 'react-dom';
import Text from './components/Text';


ReactDOM.render(
    <React.StrictMode>

      <Router>
        <div className="main-container">
          <MainNav/>
          <Container as="main">
            <Routes>
              <Route path="/" element={<Home />}/>
              <Route path="projects" element={<Projects />}/>
              <Route path="projects/:projectName" element={<Project />}>
                <Route path=":textName" element={<Text />}/>
              </Route>
              <Route path="/issues" element={<Fragment><h2>Experiencing issues?</h2><p>File an issue on Github!</p></Fragment>} />
              <Route path="*" element={<p>There's nothing here!</p>} />
            </Routes>
          </Container>
          <PageFooter/>
        </div>
      </Router>
    </React.StrictMode>, document.querySelector('#root')
);
