import '../styles/text.scss';

import {Alert, Button, ButtonGroup, Col, Container, Nav, Row, Tab, ToggleButton, ToggleButtonGroup} from 'react-bootstrap';

import {cloneDeep, remove} from 'lodash';
import React, {Component} from 'react';

import {getText} from '../data';
import Segment from './Segment';
import {withRouter} from '../utils';

class Text extends Component {
  constructor(props) {
    super(props);
    this.ghostCursorEl = React.createRef();
    const text = getText(this.props.router.params.projectName, this.props.router.params.textName);
    this.state = {
      text: text,
      tool: 'tokenize',
      historyIdx: 0,
      history: [cloneDeep(text.translations)],
    };

    this.onCutSelect = this.onCutSelect.bind(this);
    this.onCutSegment = this.onCutSegment.bind(this);
    this.updateHistory = this.updateHistory.bind(this);
    this.undoOrRedo = this.undoOrRedo.bind(this);
  }

  onCutSelect(segId, segSide, segTokens) {
    this.setState((prevState) => {
      const translations = cloneDeep(prevState.text.translations);
      translations[segId][`${segSide}Tokens`] = segTokens;

      return {
        ...prevState,
        text: {...prevState.text, 'translations': translations},
      };
    }, () => {
      this.updateHistory();
    });
  };

  onCutSegment() {
  }

  // const onCutSegment = (segId, segSide, firstTokens, lastTokens, direction, errorMsg='') => {
  //   const translations = cloneDeep(textState['translations']);
  //   const otherId = direction === 'up' ? segId-1 : segId+1;
  //   const otherSide = segSide === 'src' ? 'tgt' : 'src';
  //   translations[segId][`${segSide}Tokens`] = direction === 'up' ? lastTokens : firstTokens;

  //   // TODO: make sure that this works better when the other side already has a sentence at this position. So probably just check whether this index exists/is empty
  //   if (direction === 'up') {
  //     if (segmentthis.state.tool === 'join') {
  //       // try {
  //       translations[otherId][`${segSide}Tokens`] = translations[otherId][`${segSide}Tokens`].concat(firstTokens);
  //       // } catch (err) {
  //       //   translations.unshift({[`${segSide}Tokens`]: firstTokens, [`${otherSide}Tokens`]: []});
  //       // }
  //     } else {
  //       translations.splice(segId, 0, {[`${segSide}Tokens`]: firstTokens, [`${otherSide}Tokens`]: []});
  //     }
  //   } else {
  //     if (segmentthis.state.tool === 'join') {
  //       try {
  //         translations[otherId][`${segSide}Tokens`] = lastTokens.concat(translations[otherId][`${segSide}Tokens`]);
  //       } catch (err) {
  //         translations.push({[`${segSide}Tokens`]: lastTokens, [`${otherSide}Tokens`]: []});
  //       }
  //     } else {
  //       translations.splice(segId+1, 0, {[`${segSide}Tokens`]: lastTokens, [`${otherSide}Tokens`]: []});
  //     }
  //   }
  //   updateHistoryWithNewData(translations);
  // };

  updateHistory() {
    this.setState((prevState) => {
      const prevHistory = cloneDeep(prevState.history); // array of translations
      const prevTranslations = cloneDeep(prevState.text.translations); // current translations to add to array
      let newHistoryIdx;
      if (prevState.historyIdx === 0) {
        prevHistory.unshift(prevTranslations);
        newHistoryIdx = prevState.historyIdx;
      } else {
        // historyIdx is not 0, so we are navigating somewhere in the history undo/redo
        // but because we did something new, we clear history and start from 0 again
        prevHistory.splice(0, prevState.historyIdx, prevTranslations);
        newHistoryIdx = 0;
      }

      return {
        ...prevState,
        history: prevHistory,
        historyIdx: newHistoryIdx,
      };
    });
  };

  undoOrRedo(doWhat) {
    this.setState((prevState) => {
      let newHistoryIdx;
      if (doWhat === 'undo') {
        newHistoryIdx = Math.min(this.state.historyIdx + 1, this.state.history.length-1);
      } else {
        newHistoryIdx = Math.max(this.state.historyIdx - 1, 0);
      }

      const newState = {
        ...prevState,
        historyIdx: newHistoryIdx,
        text: {...prevState.text, 'translations': this.state.history[newHistoryIdx]},
      };
      return newState;
    });
  };

  render() {
    return (
      <div id="text-wrapper" className={this.state.tool}>
        {this.state.text ?
        <Tab.Container defaultActiveKey="srctgt">
          <header>
            <h3><span>Text:</span> {this.state.text.name}</h3>
            <Nav variant="pills" className="text-type-nav" as="nav">
              {this.state.text.hasSrc && <Nav.Item>
                <Nav.Link eventKey="src" as="button">source</Nav.Link>
              </Nav.Item>}
              {this.state.text.hasTgt && <Nav.Item>
                <Nav.Link eventKey="tgt" as="button">target</Nav.Link>
              </Nav.Item>}
              {this.state.text.hasSrc && this.state.text.hasTgt && <Nav.Item>
                <Nav.Link eventKey="srctgt" as="button">both</Nav.Link>
              </Nav.Item>}
            </Nav>
          </header>
          <aside className="text-tool-controls">
            <ButtonGroup>
              <Button key="0" id="tool-btn-history-undo" value="undo" variant="info" onClick={(evt) => this.undoOrRedo(evt.currentTarget.value)} disabled={(this.state.history.length === 1) || (this.state.history.length-1 <= this.state.historyIdx)}>Undo</Button>
              <Button key="1" id="tool-btn-history-redo" value="redo" variant="info" onClick={(evt) => this.undoOrRedo(evt.currentTarget.value)} disabled={(this.state.history.length === 1) || (this.state.historyIdx === 0)}>Redo</Button>
            </ButtonGroup>

            <ToggleButtonGroup type="radio" value={this.state.tool} name="text-tool-controls" onChange={this.state.tool}>
              <ToggleButton key="0" type="radio" id="tool-btn-tokenize" value="tokenize" variant="primary">Token</ToggleButton>
              <ToggleButton key="1" type="radio" id="tool-btn-segment-up" value="segment-up" variant="primary">Segment &uarr;</ToggleButton>
              <ToggleButton key="2" type="radio" id="tool-btn-segment-down" value="segment-down" variant="primary">Segment &darr;</ToggleButton>
            </ToggleButtonGroup>
            <Alert key={0} variant="danger" className={this.state.warningMsg ? 'active' : ''}>{this.state.warningMsg}</Alert>
          </aside>

          <Tab.Content>
            {this.state.text.hasSrc && <Tab.Pane eventKey="src">
              <Container fluid className="text src" onContextMenu={(evt) => {
                evt.preventDefault(); return false;
              }}>
                {
                  this.state.text.translations.map((translation, translationId) =>
                    <Row key={translationId}>
                      <Col>
                        <Segment
                          key={translationId}
                          id={translationId}
                          side="src"
                          tokens={translation.srcTokens}
                          onCutSelect={this.onCutSelect}
                          onCutSegment={this.onCutSegment}
                          tool={this.state.tool}/>
                      </Col>
                    </Row>
                  )
                }
              </Container>
            </Tab.Pane>}

            {this.state.text.hasTgt && <Tab.Pane eventKey="tgt" onContextMenu={(evt) => {
              evt.preventDefault(); return false;
            }}>
              <Container fluid className="text tgt">
                {
                  this.state.text.translations.map((translation, translationId) =>
                    <Row key={translationId}>
                      <Col>
                        <Segment
                          key={translationId}
                          id={translationId}
                          side="tgt"
                          tokens={translation.tgtTokens}
                          onCutSelect={this.onCutSelect}
                          onCutSegment={this.onCutSegment}
                          tool={this.state.tool} />
                      </Col>
                    </Row>
                  )
                }
              </Container>
            </Tab.Pane>}

            {this.state.text.hasTgt && this.state.text.hasSrc && <Tab.Pane eventKey="srctgt">
              <Container fluid className="text src tgt" onContextMenu={(evt) => {
                evt.preventDefault(); return false;
              }}>
                <Row><Col><h4>Source</h4></Col><Col><h4>Target</h4></Col></Row>
                {
                  this.state.text.translations.map((translation, translationId) =>
                    <Row key={translationId}>
                      <Col>

                        {translation.srcTokens && <Segment
                          key={translationId}
                          id={translationId}
                          side="src"
                          tokens={translation.srcTokens}
                          onCutSelect={this.onCutSelect}
                          onCutSegment={this.onCutSegment}
                          tool={this.state.tool} />
                        }
                      </Col>
                      <Col>
                        {translation.tgtTokens && <Segment
                          key={translationId}
                          id={translationId}
                          side="tgt"
                          tokens={translation.tgtTokens}
                          onCutSelect={this.onCutSelect}
                          onCutSegment={this.onCutSegment}
                          tool={this.state.tool} />}
                      </Col>
                    </Row>
                  )
                }
              </Container>
            </Tab.Pane>}
          </Tab.Content>
        </Tab.Container> :
        <h2>Text {this.props.router.params.textName} not found!</h2>
        }

      </div>
    );
  }
}

export default withRouter(Text);
