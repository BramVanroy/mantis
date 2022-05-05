import '../styles/projects.scss';

import {Button, Form, Nav} from 'react-bootstrap';
import React, {Component, useEffect, useState} from 'react';
import {fetchUrl} from '../data';
import {LinkContainer} from 'react-router-bootstrap';
import {PROJECTS_URL} from '../constants';

class Projects extends Component {
  constructor(props) {
    super(props);
    this.state = {projects: [], errorMsg: null};
  }

  static getDerivedStateFromError(error) {
    return {errorMsg: error.toString()};
  }

  componentDidMount() {
    fetch(PROJECTS_URL).then((response) => {
      if (response.ok) {
        response.json().then((data) => {
          this.setState((prevState) => {
            return {
              ...prevState,
              projects: data,
            };
          });
        });
      } else {
        response.text().then((text) => {
          throw Error(text);
        });
      }
    },
    ).catch((errStr) => {
      this.setState({projects: [], errorMsg: String(errStr) + `: ${PROJECTS_URL}`});
    });
  }


  render() {
    console.log(this.state.projects);
    return (
      <React.Fragment>
        <h2>Projects</h2>
        {this.state.projects && this.state.projects.length ? <Nav as="ul" className="project-nav">
          {
            this.state.projects.map((project, projectIdx) =>
              <Nav.Item key={projectIdx} as="li">
                <LinkContainer to={`/projects/${project}`} key={`${project}`}>
                  <Nav.Link>{`${project}`}</Nav.Link>
                </LinkContainer>
              </Nav.Item>
            )}
        </Nav> : (this.state.errorMsg ? <p>Something went wrong when fetching projects! <span>{this.state.errorMsg}</span></p> : <p>No projects found!</p>)}
        <div>
          <h3>Upload or edit a corpus</h3>
          <p>To upload a new corpus, you should first download the TPR-DB files as a ZIP, and then upload that ZIP file here.</p>
          <p>To edit an existing corpus, you can upload individual files. These will overwrite the saved data.</p>
          <Form>
            <Form.Group controlId="corpusName" className="mb-3" >
              <Form.Label>Corpus name</Form.Label>
              <Form.Control type="text" placeholder="Enter corpus name" />
              <Form.Text className="text-muted">When modifying an existing corpus, use the same name.</Form.Text>
            </Form.Group>
            <Form.Group controlId="corpusFile" className="mb-3">
              <Form.Control type="file" />
            </Form.Group>
            <Button variant="primary" type="submit">Submit</Button>
          </Form>
        </div>
      </React.Fragment>
    );
  }
}

export default Projects;
