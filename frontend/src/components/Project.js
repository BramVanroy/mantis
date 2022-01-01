import '../styles/project.scss';

import {Outlet, useParams} from 'react-router-dom';
import {getProject} from '../data';
import {LinkContainer} from 'react-router-bootstrap';
import {Nav} from 'react-bootstrap';
import React from 'react';

export default function Project() {
  const params = useParams();
  const project = getProject(params.projectName, params.textId);
  return (
    <main>
      {project ?
      <React.Fragment>
        <h2><span>Project:</span> {project.name}</h2>
        <Nav className="text-nav" as="nav">
          {
            project.texts.map((text) =>
              <Nav.Item key={text.name}>
                <LinkContainer to={`/projects/${params.projectName}/${text.name}`} key={`${text.name}`}>
                  <Nav.Link>{`${text.name}`}</Nav.Link>
                </LinkContainer>
              </Nav.Item>
            )}
        </Nav>
        <Outlet/>
      </React.Fragment> :
      <h2>Project {params.projectName} not found!</h2>
      }
    </main>
  );
}
