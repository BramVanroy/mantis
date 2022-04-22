import '../styles/text.scss';

import {Alert, Button, ButtonGroup, Col, Container, Nav, Row, Tab, ToggleButton, ToggleButtonGroup} from 'react-bootstrap';

import {cloneDeep, remove} from 'lodash';
import React, {useEffect, useState} from 'react';

import {getText} from '../data';
import Segment from './Segment';
import {useParams} from 'react-router-dom';

export default function Text() {
  const params = useParams();
  const [textState, setTextState] = useState(getText(params.projectName, params.textName));
  const [toolState, setToolState] = useState('tokenize');
  const [segmentToolState, setSegmentToolState] = useState('new');
  const [allowCrossSpace, setallowCrossSpaceState] = useState(false);
  const [warningMsg, setWarningMsg] = useState();
  const [editHistory, setEditHistory] = useState([cloneDeep(textState.translations)]);

  const [currHistoryIdx, setcurrHistoryIdx] = useState(0);

  const onCutSelect = (segId, segSide, segTokens) => {
    // TODO: make sure that this works across segments. The reason is probably because we are not using prevState but instead textState directly
    const translations = cloneDeep(textState['translations']);
    translations[segId][`${segSide}Tokens`] = segTokens;
    updateHistory(translations);
  };

  const onCutSegment = (segId, segSide, firstTokens, lastTokens, direction, errorMsg='') => {
    const translations = cloneDeep(textState['translations']);
    const otherId = direction === 'up' ? segId-1 : segId+1;
    const otherSide = segSide === 'src' ? 'tgt' : 'src';
    translations[segId][`${segSide}Tokens`] = direction === 'up' ? lastTokens : firstTokens;

    // TODO: make sure that this works better when the other side already has a sentence at this position. So probably just check whether this index exists/is empty
    if (direction === 'up') {
      if (segmentToolState === 'join') {
        // try {
        translations[otherId][`${segSide}Tokens`] = translations[otherId][`${segSide}Tokens`].concat(firstTokens);
        // } catch (err) {
        //   translations.unshift({[`${segSide}Tokens`]: firstTokens, [`${otherSide}Tokens`]: []});
        // }
      } else {
        translations.splice(segId, 0, {[`${segSide}Tokens`]: firstTokens, [`${otherSide}Tokens`]: []});
      }
    } else {
      if (segmentToolState === 'join') {
        try {
          translations[otherId][`${segSide}Tokens`] = lastTokens.concat(translations[otherId][`${segSide}Tokens`]);
        } catch (err) {
          translations.push({[`${segSide}Tokens`]: lastTokens, [`${otherSide}Tokens`]: []});
        }
      } else {
        translations.splice(segId+1, 0, {[`${segSide}Tokens`]: lastTokens, [`${otherSide}Tokens`]: []});
      }
    }
    updateHistory(translations);
  };

  const updateHistory = (translations) => {
    if (currHistoryIdx === 0) {
      setEditHistory((prevHistory) => {
        prevHistory = cloneDeep(prevHistory);
        prevHistory.unshift(cloneDeep(translations));
        return prevHistory;
      });
    } else {
      setcurrHistoryIdx(0);
      setEditHistory((prevHistory) => {
        prevHistory = cloneDeep(prevHistory);
        prevHistory.splice(0, currHistoryIdx, cloneDeep(translations));
        return prevHistory;
      });
    }
  };

  const setHistoryState = (value) => {
    if (value === 'undo') {
      setcurrHistoryIdx(Math.min(currHistoryIdx + 1, editHistory.length-1));
    } else {
      setcurrHistoryIdx(Math.max(currHistoryIdx - 1, 0));
    }
  };

  useEffect(() => {
    setTextState((prevState) => {
      return {
        ...prevState,
        ...{'translations': editHistory[currHistoryIdx]},
      };
    });
  }, [editHistory, currHistoryIdx]);

  return (
    <div id="text-wrapper" className={toolState}>
      {textState ?
      <Tab.Container defaultActiveKey="srctgt">
        <header>
          <h3><span>Text:</span> {textState.name}</h3>
          <Nav variant="pills" className="text-type-nav" as="nav">
            {textState.hasSrc && <Nav.Item>
              <Nav.Link eventKey="src" as="button">source</Nav.Link>
            </Nav.Item>}
            {textState.hasTgt && <Nav.Item>
              <Nav.Link eventKey="tgt" as="button">target</Nav.Link>
            </Nav.Item>}
            {textState.hasSrc && textState.hasTgt && <Nav.Item>
              <Nav.Link eventKey="srctgt" as="button">both</Nav.Link>
            </Nav.Item>}
          </Nav>
        </header>
        <aside className="text-tool-controls">
          <ButtonGroup>
            <Button key="0" id="tool-btn-history-undo" value="undo" variant="info" onClick={(evt) => setHistoryState(evt.currentTarget.value)} disabled={(editHistory.length === 1) || (editHistory.length-1 <= currHistoryIdx)}>Undo</Button>
            <Button key="1" id="tool-btn-history-redo" value="redo" variant="info" onClick={(evt) => setHistoryState(evt.currentTarget.value)} disabled={(editHistory.length === 1) || (currHistoryIdx === 0)}>Redo</Button>
          </ButtonGroup>

          <ToggleButtonGroup type="radio" value={toolState} name="text-tool-controls" onChange={setToolState}>
            <ToggleButton key="0" type="radio" id="tool-btn-tokenize" value="tokenize" variant="primary">Token</ToggleButton>
            <ToggleButton key="1" type="radio" id="tool-btn-segment-up" value="segment-up" variant="primary">Segment &uarr;</ToggleButton>
            <ToggleButton key="2" type="radio" id="tool-btn-segment-down" value="segment-down" variant="primary">Segment &darr;</ToggleButton>
          </ToggleButtonGroup>
          {toolState.startsWith('segment') &&
            <ToggleButtonGroup type="radio" value={segmentToolState} name="segment-tool-controls" onChange={setSegmentToolState}>
              <ToggleButton key="0" type="radio" id="tool-btn-segment-join" value="join" variant="secondary">Join</ToggleButton>
              <ToggleButton key="1" type="radio" id="tool-btn-segment-new" value="new" variant="secondary">New</ToggleButton>
            </ToggleButtonGroup>
          }
          <Alert key={0} variant="danger" className={warningMsg ? 'active' : ''}>{warningMsg}</Alert>
        </aside>

        <Tab.Content>
          {textState.hasSrc && <Tab.Pane eventKey="src">
            <Container fluid className="text src">
              {
                textState.translations.map((translation, translationId) =>
                  <Row key={translationId}>
                    <Col>
                      <Segment
                        key={translationId}
                        id={translationId}
                        side="src"
                        tokens={translation.srcTokens}
                        onCutSelect={onCutSelect}
                        onCutSegment={onCutSegment}
                        allowCrossSpace={allowCrossSpace}
                        tool={toolState}
                        segmentTool={segmentToolState} />
                    </Col>
                  </Row>
                )
              }
            </Container>
          </Tab.Pane>}

          {textState.hasTgt && <Tab.Pane eventKey="tgt">
            <Container fluid className="text tgt">
              {
                textState.translations.map((translation, translationId) =>
                  <Row key={translationId}>
                    <Col>
                      <Segment
                        key={translationId}
                        id={translationId}
                        side="tgt"
                        tokens={translation.tgtTokens}
                        onCutSelect={onCutSelect}
                        onCutSegment={onCutSegment}
                        allowCrossSpace={allowCrossSpace}
                        tool={toolState}
                        segmentTool={segmentToolState} />
                    </Col>
                  </Row>
                )
              }
            </Container>
          </Tab.Pane>}

          {textState.hasTgt && textState.hasSrc && <Tab.Pane eventKey="srctgt">
            <Container fluid className="text src tgt">
              <Row><Col><h4>Source</h4></Col><Col><h4>Target</h4></Col></Row>
              {
                textState.translations.map((translation, translationId) =>
                  <Row key={translationId}>
                    <Col>

                      {translation.srcTokens && <Segment
                        key={translationId}
                        id={translationId}
                        side="src"
                        tokens={translation.srcTokens}
                        onCutSelect={onCutSelect}
                        onCutSegment={onCutSegment}
                        allowCrossSpace={allowCrossSpace}
                        tool={toolState}
                        segmentTool={segmentToolState} />
                      }
                    </Col>
                    <Col>
                      {translation.tgtTokens && <Segment
                        key={translationId}
                        id={translationId}
                        side="tgt"
                        tokens={translation.tgtTokens}
                        onCutSelect={onCutSelect}
                        onCutSegment={onCutSegment}
                        allowCrossSpace={allowCrossSpace}
                        tool={toolState}
                        segmentTool={segmentToolState} />}
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
