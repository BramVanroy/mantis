import {cloneDeep, remove} from 'lodash';
import React, {PureComponent} from 'react';

import {useParams} from 'react-router-dom';

export default class Cursor extends PureComponent {
  constructor(props) {
    super(props);
    this.ghostCursorEl = React.createRef();
    this.state = {
      left: 0,
      top: 0,
      token: null,
      char: null,
      isVisible: false};
  }

  hide() {
    this.setState((prevState) => {
      prevState = cloneDeep(prevState);
      prevState['isVisible'] = false;
      return prevState;
    }, () => {
      this.ghostCursorEl.current.classList.remove('active');
    });
  }

  show() {
    this.setState((prevState) => {
      prevState = cloneDeep(prevState);
      prevState['isVisible'] = true;
      return prevState;
    }, () => {
      this.ghostCursorEl.current.classList.add('active');
    });
  }

  setPosition(left, top, token, char=null) {
    this.setState({left: left, top: top, token: token, char: char}, () => {
      this.show();
    });
  }

  reposition(evt) {
    const target = evt.target;
    const forTokenize = this.props.tool === 'tokenize';

    if (target.classList.contains('char') && forTokenize) {
      // Find the index of the character or token closest to the cursor and then place the ghost cursor next to it
      const charForCursorPos = this.findItemAtPos(target, evt.clientX);
      const parentToken = charForCursorPos.parentElement;
      const parentSegment = charForCursorPos.closest('.segment');

      const left = charForCursorPos.getBoundingClientRect().left - parentSegment.getBoundingClientRect().left;
      const top = charForCursorPos.getBoundingClientRect().top - parentSegment.getBoundingClientRect().top;
      this.setPosition(left, top, parentToken, charForCursorPos);
    } else if ((target.classList.contains('token') || target.classList.contains('char')) && !forTokenize) {
      const targetToken = target.classList.contains('char') ? target.parentNode : target;
      const tokenForCursorPos = this.findItemAtPos(targetToken, evt.clientX);
      const parentSegment = tokenForCursorPos.closest('.segment');

      const left = tokenForCursorPos.getBoundingClientRect().left - parentSegment.getBoundingClientRect().left;
      const top = tokenForCursorPos.getBoundingClientRect().top - parentSegment.getBoundingClientRect().top;
      this.setPosition(left, top, tokenForCursorPos);
    } else {
      this.hide();
    }
  };

  findItemAtPos(el, eventX) {
    const forTokenize = this.props.tool === 'tokenize';
    // If we are tokenizing, we try to find the index of the character within a token
    // Otherwise we are trying to find the position of a token in the segment

    if (el.classList.contains('char') && !forTokenize) {
      el = el.parentElement;
    }
    const siblings = [...Array.from(el.parentElement.children)];
    const targetIdx = siblings.indexOf(el);
    const center = el.getBoundingClientRect().left + (el.getBoundingClientRect().width / 2);

    const actualIdx = (eventX < center) ? targetIdx : Math.min(targetIdx+1, siblings.length-1);
    return siblings[actualIdx];
  };

  render() {
    return <span className="segment-hover-cursor" ref={this.ghostCursorEl}
      style={{left: `${this.state.left}px`, top: `${this.state.top}px`}}></span>;
  };
}
