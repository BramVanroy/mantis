import {Outlet, useParams} from 'react-router-dom';

import React, {useEffect, useState} from 'react';
import {getProjectTextNames} from '../data';
import {LinkContainer} from 'react-router-bootstrap';
import {Nav} from 'react-bootstrap';

export default function Project() {
  const params = useParams();
  const [textNames, setTextNames] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const textNames = await getProjectTextNames(params.projectName, params.textId);
      console.log(textNames);
      setTextNames(textNames);
    };

    fetchData();
  }, [params]);

  return (
    <React.Fragment>
      <h2>Project: <span>{params.projectName}</span></h2>
      <Nav className="text-nav" as="nav">
        {
          textNames && textNames.length && textNames.map((text) =>
            <Nav.Item key={text}>
              <LinkContainer to={`/projects/${params.projectName}/${text}`} key={`${text}`}>
                <Nav.Link>{`${text}`}</Nav.Link>
              </LinkContainer>
            </Nav.Item>
          )}
      </Nav>
      <Outlet/>
    </React.Fragment>
  );
}
