import React, {Component} from 'react';

import {getProjects} from '../data';
import {LinkContainer} from 'react-router-bootstrap';
import {Nav} from 'react-bootstrap';

class Projects extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const projects = getProjects();
    return (
      <React.Fragment>
        <h2>Projects</h2>
        <Nav>
          {
            projects.map((project, projectIdx) =>
              <Nav.Item key={projectIdx} as="nav">
                <LinkContainer to={`/projects/${project.name}`} key={`${project.name}`}>
                  <Nav.Link>{`${project.name}`}</Nav.Link>
                </LinkContainer>
              </Nav.Item>
            )}
        </Nav>
      </React.Fragment>
    );
  }
}

export default Projects;
