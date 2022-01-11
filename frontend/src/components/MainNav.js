import {Container, Nav, Navbar} from 'react-bootstrap';
import {LinkContainer} from 'react-router-bootstrap';
import React from 'react';
import {useLocation} from 'react-router-dom';

export default function MainNav() {
  const useActiveKey = () => {
    // Because we also want to highlight `projects` when we are working on texts,
    // we need to set the activekey manually
    const path = useLocation().pathname;
    if (path.includes('projects')) {
      return 'projects';
    } else if (path === '/issues') {
      return 'issues';
    } else {
      return null;
    }
  };

  return (
    <Navbar>
      <Container>
        <LinkContainer to="/">
          <Navbar.Brand>Mantis</Navbar.Brand>
        </LinkContainer>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
          <Nav className="justify-content-center" activeKey={useActiveKey()}>
            <Nav.Item>
              <LinkContainer to="/"><Nav.Link>About</Nav.Link></LinkContainer>
            </Nav.Item>
            <Nav.Item>
              <LinkContainer to="projects"><Nav.Link eventKey="projects">Projects</Nav.Link></LinkContainer>
            </Nav.Item>
            <Nav.Item>
              <LinkContainer to="issues"><Nav.Link eventKey="issues">Issues?</Nav.Link></LinkContainer>
            </Nav.Item>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
