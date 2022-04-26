import '../styles/segment.scss';

import {cloneDeep, isEqual} from 'lodash';
import React, {useEffect, useRef} from 'react';
import Cursor from './Cursor';

function Segment(props) {
  const thisSegment = useRef(null);
  const ghostCursor = useRef(null);

  const cutTokens = (evt) => {
    // Do not tokenize when cursor not visible or when it as at the tail of the token
    if (!ghostCursor.current.state.isVisible || ghostCursor.current.state.atEndOfToken) return false;
    // If this char is the only char in the token, do not tokenize
    if (evt.target.parentElement.children.length === 1) return false;

    const charOnCursor = ghostCursor.current.state.char;
    const charIdx = parseInt(charOnCursor.getAttribute('char-id'));
    const tokenOnCursor = ghostCursor.current.state.token;
    const tokenIdx = parseInt(tokenOnCursor.getAttribute('token-id'));
    const tokens = cloneDeep(props.tokens);

    // Splice token at character index and turn into subtokens
    let tokenChars = [...tokens[tokenIdx]];
    let tokenEnd = tokenChars.splice(charIdx);
    tokenChars = tokenChars.join('');
    tokenEnd = tokenEnd.join('');

    if (tokenEnd.length && tokenChars.length) {
      tokens.splice(tokenIdx, 1, tokenChars, tokenEnd);
      props.onTokenize(props.id, props.side, tokens);
    }
  };

  const glueTokens = (evt) => {
    // Do not use the ghost cursors. The ghost cursor is sensitive, and
    // intended for char-level operations.
    // Here we do not care if a users clicks in the token (padding) or chars specifically
    let token = evt.target;

    if (token.classList.contains('char')) {
      token = token.parentElement;
    } else if (!token.classList.contains('token')) {
      return false;
    }

    const tokenIdx = parseInt(token.getAttribute('token-id'));
    const tokens = cloneDeep(props.tokens);
    const currToken = tokens[tokenIdx];
    // Do not glue on first token or on spaces
    if (tokenIdx === 0 || !currToken.trim().length) return false;

    const prevToken = tokens[tokenIdx-1];
    // If previous token is space, don't do anything
    if (!prevToken.trim().length) return false;

    const mergedTokens = prevToken + currToken;

    tokens.splice(tokenIdx-1, 2, mergedTokens);
    props.onTokenize(props.id, props.side, tokens);
  };

  const spliceSegments = (evt, direction) => {
    const target = evt.target.nodeType === Node.TEXT_NODE ? evt.target.closest('.token') : (evt.target.classList.contains('char') ? evt.target.parentElement : evt.target);
    if (target.classList.contains('token')) {
      const tokenOnCursor = ghostCursor.current.state.token;
      let tokenIdx = parseInt(tokenOnCursor.getAttribute('token-id'));
      // When the cursor is at the very end of a token, +1 the index so that we move ALL tokens
      tokenIdx += ghostCursor.current.state.atEndOfToken ? 1 : 0;
      const firstTokens = cloneDeep(props.tokens);
      const lastTokens = firstTokens.splice(tokenIdx);

      props.onSegment(props.id, props.side, firstTokens, lastTokens, direction);
    }
  };

  const onMouseUp = (evt) => {
    // Only trigger for left and right buttons
    if (![0, 2].includes(evt.button)) return false;
    const wasLeftClick = evt.button === 0;

    if (props.tool === 'tokenize') {
      const selection = window.getSelection();
      // If nothing was selected (anchor and focus are the same node), do cut/glue
      if (selection.isCollapsed) {
        if (wasLeftClick) {
          cutTokens(evt);
        } else {
          glueTokens(evt);
        }
      }
    } else if (wasLeftClick) {
      if (props.tool === 'segment-up') {
        spliceSegments(evt, 'up');
      } else if (props.tool === 'segment-down') {
        spliceSegments(evt, 'down');
      }
    }
  };

  const hideGhostCursor = () => {
    ghostCursor.current.hide();
  };

  const ghostCursorPosition = (evt) => {
    ghostCursor.current.reposition(evt);
  };


  return (
    <div ref={thisSegment} className={props.allowCrossSpace ? `segment allow-cross-space ${props.side}` : `segment ${props.side}`}
      onMouseMove={ghostCursorPosition}
      onMouseOut={hideGhostCursor}
      onMouseUp={onMouseUp}
    >
      <Cursor ref={ghostCursor} tool={props.tool} />
      <span className="segment-id">{`${props.id+1}.`}</span>
      <span className="tokens">
        {props.tokens.map(function(token, tokenId) {
          const tokenIsSpace = !token.trim().length;
          const tokenHasPunct = !!token.match(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-./:;<=>?@[\]^_`{|}~]/);
          const tokenHasNoPunct = !!token.match(/[^\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-./:;<=>?@[\]^_`{|}~]/);
          return (
            <span className={tokenIsSpace ? 'token is-space' : (tokenHasPunct && tokenHasNoPunct ? 'token has-punct' : 'token')} key={tokenId} token-id={tokenId}>
              {
                [...token].map((char, charId) => {
                  const charIsSpace = !char.trim().length;
                  const isPunct = tokenHasPunct && !tokenHasNoPunct ? true : !!char.match(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-./:;<=>?@[\]^_`{|}~]/);
                  return <span className={charIsSpace ? 'char is-space' : (isPunct ? 'char is-punct' : 'char')}
                    key={charId}
                    char-id={charId}
                    char-text={char}
                  >{charIsSpace ? '●' : char}</span>;
                })
              }
            </span>);
        })
        }
      </span>
    </div>
  );
}

function SegmentIsEqual(prevProps, nextProps) {
  return isEqual(nextProps.tokens, prevProps.tokens) && (nextProps.id === prevProps.id) && (nextProps.tool === prevProps.tool);
}

export default React.memo(Segment, SegmentIsEqual);
