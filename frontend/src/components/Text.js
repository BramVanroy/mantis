import '../styles/text.scss';

import {Button, ButtonGroup, Col, Container, Nav, Row, Tab, ToggleButton, ToggleButtonGroup} from 'react-bootstrap';

import {cloneDeep, zip} from 'lodash';
import React, {Component} from 'react';

import {AddOrRemoveBtn} from './SegmentButton';
import {getText} from '../data';
import Segment from './Segment';
import {textURL} from '../constants';
import {withRouter} from '../utils';

class Text extends Component {
  constructor(props) {
    super(props);
    this.ghostCursorEl = React.createRef();
    this.state = {
      text: {},
      tool: 'tokenize',
      historyIdx: 0,
      history: [],
    };

    this.onTokenize = this.onTokenize.bind(this);
    this.onSegment = this.onSegment.bind(this);
    this.updateHistory = this.updateHistory.bind(this);
    this.undoOrRedo = this.undoOrRedo.bind(this);
    this.createNewSegment = this.createNewSegment.bind(this);
    this.deleteEmptySegment = this.deleteEmptySegment.bind(this);
    this.changeTool = this.changeTool.bind(this);
  }

  onTokenize(segId, segSide, segTokens) {
    this.setState((prevState) => {
      const translations = cloneDeep(prevState.text.translations);
      translations[segId][`${segSide}Tokens`] = segTokens;
      translations[segId][segSide] = segTokens.join('');

      return {
        ...prevState,
        text: {...prevState.text, 'translations': translations},
      };
    }, () => {
      this.updateHistory();
    });
  };

  onSegment(segId, segSide, firstTokens, lastTokens, direction, errorMsg='') {
    let setSplitState = () => {
      this.setState((prevState) => {
        const translations = cloneDeep(prevState.text.translations);
        const otherId = direction === 'up' ? segId-1 : segId+1;
        const otherSide = segSide === 'src' ? 'tgt' : 'src';
        translations[segId][`${segSide}Tokens`] = direction === 'up' ? lastTokens : firstTokens;
        translations[segId][segSide] = translations[segId][`${segSide}Tokens`].join('');

        if (direction === 'up') {
          try {
            translations[otherId][`${segSide}Tokens`] = translations[otherId][`${segSide}Tokens`].concat(firstTokens);
            translations[otherId][segSide] = translations[otherId][`${segSide}Tokens`].join('');
          } catch (err) {
            translations.unshift({
              [`${segSide}Tokens`]: firstTokens,
              [segSide]: firstTokens.join(''),
              [`${otherSide}Tokens`]: [],
              [otherSide]: '',
            });
          }
        } else {
          try {
            translations[otherId][`${segSide}Tokens`] = lastTokens.concat(translations[otherId][`${segSide}Tokens`]);
            translations[otherId][segSide] = translations[otherId][`${segSide}Tokens`].join('');
          } catch (err) {
            translations.push({
              [`${segSide}Tokens`]: lastTokens,
              [segSide]: lastTokens.join(''),
              [`${otherSide}Tokens`]: [],
              [otherSide]: '',
            });
          }
        }
        return {
          ...prevState,
          text: {...prevState.text, 'translations': translations},
        };
      }, () => {
        this.updateHistory();
      });
    };

    setSplitState = setSplitState.bind(this);

    if ((segId === 0 && direction === 'up') || (segId === this.state.text.translations.length-1 && direction === 'down')) {
      // Create new segment, but do not add that step to history, and then move the corresponding chunks to new segment
      // So the history is only updated once with new_segment+filled
      this.createNewSegment(segId-1, segSide, false, setSplitState);
    } else {
      setSplitState();
    }
  };

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

  createNewSegment(segId, segSide, addToHistory=true, cb=null) {
    this.setState((prevState) => {
      const translations = cloneDeep(prevState.text.translations);
      const nTranslations = translations.length;
      const otherSide = segSide === 'src' ? 'tgt' : 'src';

      const newTranslations = [];
      const insertAt = segId+1; // +1 because first "add" button is at -1
      let thisSide;
      // Iterate and as soon as we've reached the relevant index, make sure
      // that at subsequent iterations we take the previous information
      for (let idx = 0; idx < nTranslations; idx++) {
        const transls = translations[idx];
        thisSide = { // Set default value (idx < inserAt): stays the same
          [segSide]: translations[idx][segSide],
          [`${segSide}Tokens`]: translations[idx][`${segSide}Tokens`],
        };

        if (idx === insertAt) { // Insert empty segment
          thisSide = {
            [segSide]: '',
            [`${segSide}Tokens`]: [],
          };
        } else if (idx > insertAt) {
          thisSide = { // Compensate for empty segment by retrieving previous segment
            [segSide]: translations[idx-1][segSide],
            [`${segSide}Tokens`]: translations[idx-1][`${segSide}Tokens`],
          };
        }
        // Add "otherSide" and merge
        newTranslations[idx] = {
          ...thisSide,
          [otherSide]: transls[otherSide],
          [`${otherSide}Tokens`]: transls[`${otherSide}Tokens`],
        };
      }

      // Fill in last item based on whether or not the last button was pressed
      if (insertAt === nTranslations) { // if last button was pressed, insert empty row on both sides
        thisSide = {
          [segSide]: '',
          [`${segSide}Tokens`]: [],
        };
      } else {
        thisSide = { // if not last button clicked, retrieve the final existing segment and re-add
          [segSide]: translations[nTranslations-1][segSide],
          [`${segSide}Tokens`]: translations[nTranslations-1][`${segSide}Tokens`],
        };
      }

      const penultimateTransls = newTranslations[nTranslations-1];

      if (thisSide[segSide].trim() || insertAt === nTranslations || (!penultimateTransls[segSide].trim() && !penultimateTransls[otherSide].trim() )) {
        newTranslations[nTranslations] = {
          ...thisSide,
          [otherSide]: '',
          [`${otherSide}Tokens`]: [],
        };
      }

      return {
        ...prevState,
        text: {...prevState.text, 'translations': newTranslations},
      };
    }, () => {
      if (addToHistory) this.updateHistory();
      if (cb !== null) cb();
    });
  }

  deleteEmptySegment(segId, segSide) {
    this.setState((prevState) => {
      const translations = cloneDeep(prevState.text.translations);
      const nTranslations = translations.length;
      const otherSide = segSide === 'src' ? 'tgt' : 'src';

      const newTranslations = [];
      const deleteAt = segId;
      for (let idx = 0; idx < nTranslations-1; idx++) {
        const transls = translations[idx];
        if (idx < deleteAt) {
          newTranslations[idx] = transls;
        } else { // As soon as we have reached the segment to delete, just +1 the index to retrieve for each subsequent item
          newTranslations[idx] = { // Compensate for empty segment by retrieving previous segment
            [segSide]: translations[idx+1][segSide],
            [`${segSide}Tokens`]: translations[idx+1][`${segSide}Tokens`],
            [otherSide]: transls[otherSide],
            [`${otherSide}Tokens`]: transls[`${otherSide}Tokens`],
          };
        }
      }

      // Check if last item on the other side was empty. If not, add it again
      const lastTranslations = translations[nTranslations-1];
      if (lastTranslations[otherSide].trim()) {
        newTranslations[nTranslations-1] = {
          [segSide]: '',
          [`${segSide}Tokens`]: [],
          [otherSide]: lastTranslations[otherSide],
          [`${otherSide}Tokens`]: lastTranslations[`${otherSide}Tokens`],
        };
      }

      return {
        ...prevState,
        text: {...prevState.text, 'translations': newTranslations},
      };
    }, () => {
      this.updateHistory();
    });
  }

  changeTool(newTool) {
    this.setState((prevState) => {
      return {
        ...prevState,
        tool: newTool,
      };
    });
  }

  createCol(translation, translationId, side) {
    const allTranslations = this.state.text.translations;
    const nTranslations = allTranslations.length;
    const tokens = side === 'src' ? translation.srcTokens : translation.tgtTokens;
    const otherTokens = side === 'src' ? translation.tgtTokens : translation.srcTokens;
    // Only add remove button if this cell is empty and if the last cell of the other side is empty
    const shouldHaveRemoveBtn = !tokens.length && !(translationId === nTranslations-1 && otherTokens.length);
    return <Col>
      {translationId === 0 && <AddOrRemoveBtn type="add" onClick={this.createNewSegment} side={side} id={-1} />}
      <Segment
        key={translationId}
        id={translationId}
        side={side}
        tokens={tokens}
        onTokenize={this.onTokenize}
        onSegment={this.onSegment}
        tool={this.state.tool} />
      {shouldHaveRemoveBtn && <AddOrRemoveBtn type="remove" onClick={this.deleteEmptySegment} side={side} id={translationId} />}
      <AddOrRemoveBtn type="add" onClick={this.createNewSegment} side={side} id={translationId} />
    </Col>;
  }

  componentDidMount() {
    const url = textURL(this.props.router.params.projectName, this.props.router.params.textName);
    fetch(url).then((response) => {
      if (response.ok) {
        response.json().then((data) => {
          this.setState((prevState) => {
            return {
              ...prevState,
              text: data,
              history: [cloneDeep(data.translations)],
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
      this.setState({projects: [], errorMsg: String(errStr) + `: ${url}`});
    });
  }

  render() {
    const srcCols = this.state.text.hasSrc && this.state.text.translations.map((translation, translationId) => this.createCol(translation, translationId, 'src'));
    const tgtCols = this.state.text.hasTgt && this.state.text.translations.map((translation, translationId) => this.createCol(translation, translationId, 'tgt'));
    const srcTgtCols = this.state.text.hasSrc && this.state.text.hasTgt && zip(srcCols, tgtCols);

    return (
      <div id="text-wrapper" className={this.state.tool}>
        {this.state.text ?
        <Tab.Container defaultActiveKey="srctgt">
          <aside className="text-tool-controls">
            <ButtonGroup>
              <Button key="0" id="tool-btn-history-undo" value="undo" variant="info" onClick={(evt) => this.undoOrRedo(evt.currentTarget.value)} disabled={(this.state.history.length === 1) || (this.state.history.length-1 <= this.state.historyIdx)}>Undo</Button>
              <Button key="1" id="tool-btn-history-redo" value="redo" variant="info" onClick={(evt) => this.undoOrRedo(evt.currentTarget.value)} disabled={(this.state.history.length === 1) || (this.state.historyIdx === 0)}>Redo</Button>
            </ButtonGroup>

            <ToggleButtonGroup type="radio" value={this.state.tool} name="text-tool-controls" onChange={(value) => this.changeTool(value)}>
              <ToggleButton key="0" type="radio" id="tool-btn-tokenize" value="tokenize" variant="primary">Token</ToggleButton>
              <ToggleButton key="1" type="radio" id="tool-btn-segment-up" value="segment-up" variant="primary">Segment &uarr;</ToggleButton>
              <ToggleButton key="2" type="radio" id="tool-btn-segment-down" value="segment-down" variant="primary">Segment &darr;</ToggleButton>
            </ToggleButtonGroup>

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
          </aside>

          <Tab.Content>
            {this.state.text.hasSrc && <Tab.Pane eventKey="src">
              <Container fluid className="text src" onContextMenu={(evt) => {
                evt.preventDefault(); return false;
              }}>
                {
                  srcCols.map((srcCol, colId) =>
                    <Row key={colId}>{srcCol}</Row>
                  )
                }
              </Container>
            </Tab.Pane>}

            {this.state.text.hasTgt && <Tab.Pane eventKey="tgt" onContextMenu={(evt) => {
              evt.preventDefault(); return false;
            }}>
              <Container fluid className="text tgt">
                {
                  tgtCols.map((tgtCol, colId) =>
                    <Row key={colId}>{tgtCol}</Row>
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
                  srcTgtCols.map(([srcCol, tgtCol], translationId) =>
                    <Row key={translationId}>
                      {srcCol}
                      {tgtCol}
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
