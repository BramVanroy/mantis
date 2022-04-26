import React, {PureComponent} from 'react';
import {cloneDeep} from 'lodash';

export default class Cursor extends PureComponent {
  constructor(props) {
    super(props);
    this.ghostCursorEl = React.createRef();
    this.state = {
      left: 0,
      top: 0,
      token: null,
      char: null,
      isVisible: false,
      atEndOfToken: false,
    };
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

  setPosition(left, top, token, char=null, atEndOfToken=false) {
    this.setState({left: left, top: top, token: token, char: char, atEndOfToken: atEndOfToken}, () => {
      this.show();
    });
  }

  reposition(evt) {
    const target = evt.target;
    const forTokenize = this.props.tool === 'tokenize';

    if ((target.classList.contains('token') || target.classList.contains('char'))) {
      let targetNode = target;
      if (!forTokenize) {
        // If in segment mode, we are interested in tokens: so find parent if current target is char
        targetNode = target.classList.contains('char') ? target.parentNode : target;
      } else if (!target.classList.contains('char')) {
        // If we in tokenize mode, but target is not a character, stop
        return false;
      }

      // ItemForCursorPos is a char (if forTokenize) or a token (if not)
      const [itemForCursorPos, atEndOfToken] = this.findItemAtPos(targetNode, evt.clientX);
      const parentSegment = itemForCursorPos.closest('.segment');

      let left = itemForCursorPos.getBoundingClientRect().left - parentSegment.getBoundingClientRect().left;
      if (atEndOfToken) {
        left += itemForCursorPos.getBoundingClientRect().width;
      }

      const top = itemForCursorPos.getBoundingClientRect().top - parentSegment.getBoundingClientRect().top;
      if (forTokenize) {
        const parentToken = itemForCursorPos.parentElement;
        this.setPosition(left, top, parentToken, itemForCursorPos, atEndOfToken);
      } else {
        this.setPosition(left, top, itemForCursorPos, null, atEndOfToken);
      }
    } else {
      this.hide();
    }
  };

  findItemAtPos(el, eventX) {
    const forTokenize = this.props.tool === 'tokenize';
    // If we are tokenizing, we find the character to put the cursor in front of
    // If we are segmenting, we find the token to put the cursor in front of
    if (el.classList.contains('char') && !forTokenize) {
      el = el.parentElement;
    }
    const siblings = [...Array.from(el.parentElement.children)];
    const targetIdx = siblings.indexOf(el);
    const center = el.getBoundingClientRect().left + (el.getBoundingClientRect().width / 2);

    const actualIdx = (eventX < center) ? targetIdx : Math.min(targetIdx+1, siblings.length-1);
    const atEndOfToken = eventX >= center && targetIdx === siblings.length-1;

    return [siblings[actualIdx], atEndOfToken];
  };

  render() {
    return <span className="segment-hover-cursor" ref={this.ghostCursorEl}
      style={{left: `${this.state.left}px`, top: `${this.state.top}px`}}></span>;
  };
}
