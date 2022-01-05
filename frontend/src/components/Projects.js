import {getProjects} from '../data';
import {LinkContainer} from 'react-router-bootstrap';
import {Nav} from 'react-bootstrap';
import React from 'react';

export default function Projects() {
  const projects = getProjects();
  return (
    <React.Fragment>
      <h2>Projects</h2>
      <Nav as="ul">
        {
          projects.map((project, projectIdx) =>
            <Nav.Item key={projectIdx} as="li">
              <LinkContainer to={`/projects/${project.name}`} key={`${project.name}`}>
                <Nav.Link>{`${project.name}`}</Nav.Link>
              </LinkContainer>
            </Nav.Item>
          )}
      </Nav>
    </React.Fragment>
  );
}
