import '../styles/text.scss';

import {Col, Container, Nav, Row, Tab} from 'react-bootstrap';
import React, {useState} from 'react';
import {getText} from '../data';
import Segment from './Segment';
import {useParams} from 'react-router-dom';


export default function Text() {
  const params = useParams();
  const [textState, setTextState] = useState(getText(params.projectName, params.textName));
  const [toolState, setToolState] = useState(null);
  const [allowCrossSpace, setallowCrossSpaceState] = useState(false);

  // TODO: Up next: make everything work when "allowCrossSpace === false"

  const onCutSelect = (segId, segSide, segTokens) => {
    setTextState((prevState) => {
      const translations = prevState['translations'];
      translations[segId][`${segSide}Tokens`] = segTokens;
      return {
        ...prevState,
        ...{'translations': translations},
      };
    });
  };

  const setToolChange = () => {
    setToolState((prevState) => {

    });
  };
  console.log(textState);
  return (
    <div id="text-wrapper">

      <div className="text-tool-controls">
        {/* <ToggleButtonGroup type="radio" value={state.tool} name="text-tool-controls" onChange={setToolChange}>
          <ToggleButton key="1" type="radio" id="tool-btn-select" value="select" variant="secondary">Select</ToggleButton>
        </ToggleButtonGroup> */}
      </div>
      {textState ?
      <Tab.Container defaultActiveKey="src">
        <header>
          <h3><span>Text:</span> {textState.name}</h3>
          <Nav variant="pills" className="text-type-nav" as="nav">
            {textState.hasSrc && <Nav.Item>
              <Nav.Link eventKey="src">source</Nav.Link>
            </Nav.Item>}
            {textState.hasTgt && <Nav.Item>
              <Nav.Link eventKey="tgt">target</Nav.Link>
            </Nav.Item>}
            {textState.hasSrc && textState.hasTgt && <Nav.Item>
              <Nav.Link eventKey="srctgt">both</Nav.Link>
            </Nav.Item>}
          </Nav>
        </header>
        <Tab.Content>

          {textState.hasSrc && <Tab.Pane eventKey="src">
            <Container fluid className="text src">
              {
                textState.translations.map((translation, translationId) =>
                  <Segment key={translationId} id={translationId} side="src" tokens={translation.srcTokens} onCutSelect={onCutSelect} allowCrossSpace={allowCrossSpace} />
                )
              }
            </Container>
          </Tab.Pane>}

          {textState.hasTgt && <Tab.Pane eventKey="tgt">
            <Container fluid className="text tgt">
              {
                textState.translations.map((translation, translationId) =>
                  <Segment key={translationId} id={translationId} side="tgt" tokens={translation.tgtTokens} onCutSelect={onCutSelect} allowCrossSpace={allowCrossSpace} />
                )
              }
            </Container>
          </Tab.Pane>}

          {textState.hasTgt && textState.hasSrc && <Tab.Pane eventKey="srctgt" title="both">
            <Container fluid className="text src tgt">
              <Row><Col><h4>Source</h4></Col><Col><h4>Target</h4></Col></Row>
              {
                textState.translations.map((translation, translationId) =>
                  <Row key={translationId}>
                    <Col>

                      {translation.srcTokens && <Segment key={translationId} id={translationId} side="src" tokens={translation.srcTokens} onCutSelect={onCutSelect} allowCrossSpace={allowCrossSpace} />}
                    </Col>
                    <Col>
                      {translation.tgtTokens && <Segment key={translationId} id={translationId} side="tgt" tokens={translation.tgtTokens} onCutSelect={onCutSelect} allowCrossSpace={allowCrossSpace} />}
                    </Col>
                  </Row>
                )
              }
            </Container>
          </Tab.Pane>}
        </Tab.Content>
      </Tab.Container> :
      <h2>Text {params.textName} not found!</h2>
      }

    </div>
  );
}
