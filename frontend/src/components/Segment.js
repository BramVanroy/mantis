import '../styles/segment.scss';

import {cloneDeep, isEqual} from 'lodash';
import React, {useRef, useState} from 'react';


function Segment(props) {
  const ghostCursorEl = useRef(null);
  const segmentEl = useRef(null);

  const separateSpaces = (tokens) => {
    /** Given a list of lists of strings (tokens -> characters), make sure that
     * space characters cannot be part of a token. So existing tokens with spaces
     * in them are separated by the space character, which in turn becomes its own token
     */
    const splitTokens = [];
    tokens.forEach((token) => {
      let tmpToken = [];
      token.forEach((char, charIdx) => {
        const charIsSpace = !char.trim().length;
        if (charIsSpace) {
          splitTokens.push(tmpToken);
          splitTokens.push([char]);
          tmpToken = [];
        } else {
          tmpToken.push(char);
        }

        if (charIdx === token.length-1) {
          splitTokens.push(tmpToken);
        }
      });
    });
    return splitTokens;
  };

  const selectTokens = () => {
    const selection = window.getSelection();
    const anchorNode = selection.anchorNode.nodeType === Node.TEXT_NODE ? selection.anchorNode.parentElement : selection.anchorNode;
    const focusNode = selection.focusNode.nodeType === Node.TEXT_NODE ? selection.focusNode.parentElement : selection.focusNode;

    if (!anchorNode.classList.contains('char') || !focusNode.classList.contains('char')) return false; // Only continue with characters
    if (anchorNode.closest('.tokens') !== focusNode.closest('.tokens')) return false; // Only continue if the anchor and focus belong to the same segment

    let tokens = cloneDeep(props.tokens).map((tok) => tok.split('')); // cloneDeep, otherwise a shallow copy is used and SegmentIsEqual will always be true
    const tokenIdxs = [anchorNode.parentElement.getAttribute('token-id'), focusNode.parentElement.getAttribute('token-id')].map((x) => parseInt(x, 10));

    const withinWord = tokenIdxs[0] === tokenIdxs[1];

    if (withinWord) {
      const tokenIdx = tokenIdxs[0];
      const token = tokens[tokenIdx];
      const charIdxs = [anchorNode.getAttribute('char-id'), focusNode.getAttribute('char-id')].map((x) => parseInt(x, 10)).sort();
      const endChunk = token.splice(charIdxs[0]);
      const selectedChunk = endChunk.splice(0, charIdxs[1]-charIdxs[0]+1);
      const mergedToken = [token, selectedChunk, endChunk];

      tokens.splice(tokenIdx, 1, ...mergedToken);
    } else {
      const reverse = tokenIdxs[1] < tokenIdxs[0]; // If a user selects from right to left, "anchor" is not the first token, so reverse
      const startTokenIdx = reverse ? tokenIdxs[1] : tokenIdxs[0];
      const endTokenIdx = reverse ? tokenIdxs[0] : tokenIdxs[1];
      const startcharIdx = parseInt(reverse ? focusNode.getAttribute('char-id') : anchorNode.getAttribute('char-id'));
      const endcharIdx = parseInt(reverse ? anchorNode.getAttribute('char-id') : focusNode.getAttribute('char-id'));

      // chunks only become chunks after splicing, which modifies in place and returns the spliced/deleted elements
      const firstChunk = tokens[startTokenIdx];
      const lastSelectedChunk = tokens[endTokenIdx];
      const firstSelectedChunk = firstChunk.splice(startcharIdx);
      const lastChunk = lastSelectedChunk.splice(endcharIdx+1);
      const internalSelected = tokens.slice(startTokenIdx+1, endTokenIdx); // Select internal tokens except first and last
      const nSelectedTokens = 2 + internalSelected.length;
      let mergedTokens = [firstChunk, [...firstSelectedChunk, ...internalSelected.flat(), ...lastSelectedChunk], lastChunk];

      if (!props.allowCrossSpace) {
        // Re-split tokens if tokens are not allowed within words
        mergedTokens = separateSpaces(mergedTokens);
      }
      tokens.splice(startTokenIdx, nSelectedTokens, ...mergedTokens);
    }

    selection.removeAllRanges(); // remove selection

    // Remove non-string values, which are possible if we splice at the front/back of a token
    tokens = tokens.map((token) => token.join('')).filter(String);
    props.onCutSelect(props.id, props.side, tokens);
  };

  const findCutIndex = (el, eventX) => {
    // If we are tokenizing, we try to find the index of the character within a token
    // Otherwise we are trying to find the position of a token in the segment

    if (el.classList.contains('char') && props.tool !== 'tokenize') {
      el = el.parentElement;
    }
    const siblings = [...Array.from(el.parentElement.children)];
    const targetIdx = siblings.indexOf(el);
    const isFirst = targetIdx === 0;
    const isLast = targetIdx === siblings.length-1;
    const center = el.getBoundingClientRect().left + (el.getBoundingClientRect().width / 2);

    // For the first character, when the focus is on the first half, return 0 index and not -1
    // returns: cutIdx, isFirstChar, isLastChar, isFirstHalf
    if (eventX < center) {
      return [Math.max(targetIdx-1, 0), isFirst, isLast, true];
    } else {
      return [targetIdx, isFirst, isLast, false];
    }
  };

  const cutTokens = (evt) => {
    const target = evt.target.nodeType === Node.TEXT_NODE ? evt.target.parentElement: evt.target;

    if (target.classList.contains('char')) {
      // If this char is the only char in the token, do not update
      const isOnlyChar = evt.target.parentElement.children.length === 1;
      if (isOnlyChar) return false;

      const [cutIdx, isFirstChar, isLastChar, isFirstHalf] = findCutIndex(target, evt.clientX);

      // Do not do cuts on the first and last character if the cursor is on the outside
      if ((isFirstChar && isFirstHalf) || (isLastChar && !isFirstHalf)) return false;

      const tokens = cloneDeep(props.tokens);
      const tokenIdx = parseInt(target.parentElement.getAttribute('token-id'));
      let token = [...tokens[tokenIdx]];

      let tokenEnd = token.splice(cutIdx+1);
      token = token.join('');
      tokenEnd = tokenEnd.join('');

      tokens.splice(tokenIdx, 1, token, tokenEnd);
      props.onCutSelect(props.id, props.side, tokens);
    }
  };

  const spliceSegments = (evt, direction) => {
    // FIX: allow for empty segments, which currently does not seem possible
    const target = evt.target.nodeType === Node.TEXT_NODE ? evt.target.closest('.token') : (evt.target.classList.contains('char') ? evt.target.parentElement : evt.target);
    if (target.classList.contains('token')) {
      const [cutIdx, isFirstChar, isLastChar, isFirstHalf] = findCutIndex(target, evt.clientX);
      const firstTokens = cloneDeep(props.tokens);
      const lastTokens = firstTokens.splice(cutIdx+1);

      props.onCutSegment(props.id, props.side, firstTokens, lastTokens, direction);
    }
  };

  const onMouseUp = (evt) => {
    // Only trigger for left/main button
    if (evt.button !== 0) return false;

    if (props.tool === 'tokenize') {
      const selection = window.getSelection();
      // If nothing was selected (anchor and focus are the same node), do cut
      if (selection.isCollapsed) {
        cutTokens(evt);
      } else {
        selectTokens();
      }
    } else if (props.tool === 'segment-up') {
      spliceSegments(evt, 'up');
    } else if (props.tool === 'segment-down') {
      spliceSegments(evt, 'down');
    }

    hideGhostCursor();
  };

  const ghostCursorPosition = (evt) => {
    const target = evt.target;

    // evt.buttons === 0: no buttons currently pressed
    if (evt.buttons === 0 && (target.classList.contains('char') || target.classList.contains('token'))) {
      const targetIsChar = target.classList.contains('char');
      // If this char is the only char in the token, do not update
      if (targetIsChar && target.parentElement.children.length === 1) return false;

      // Find the index of the character or token closest to the cursor and then place the ghost cursor next to it
      let [hoverIdx, isFirst, isLast, isFirstHalf] = findCutIndex(target, evt.clientX);

      const parentNode = (props.tool === 'tokenize' && targetIsChar) ? target.parentElement : target.closest('.tokens');
      const cursorBoundaryClass = props.tool !== 'tokenize' ? 'token' : 'char';
      let relevantNode;
      if (props.tool === 'tokenize' && !targetIsChar) {
        if (isFirstHalf) {
          relevantNode = target.querySelector('.char:first-child');
          isFirst = true;
        } else {
          relevantNode = target.querySelector('.char:last-child');
        }
      } else {
        relevantNode = parentNode.querySelector(`.${cursorBoundaryClass}:nth-child(${hoverIdx+1})`);
      }

      const left = (isFirst && isFirstHalf ? relevantNode.getBoundingClientRect().left : relevantNode.getBoundingClientRect().right) - segmentEl.current.getBoundingClientRect().left;
      let top;
      if (targetIsChar) {
        top = target.getBoundingClientRect().top - segmentEl.current.getBoundingClientRect().top;
      } else {
        const relChar = isFirstHalf ? target.querySelector('.char:first-child') : target.querySelector('.char:last-child');
        top = relChar.getBoundingClientRect().top - segmentEl.current.getBoundingClientRect().top;
      }

      ghostCursorEl.current.style = `left: ${left}px; top: ${top}px;`;
      ghostCursorEl.current.classList.add('active');
    } else {
      hideGhostCursor();
    }
  };

  const hideGhostCursor = () => {
    ghostCursorEl.current.classList.remove('active');
  };

  return (
    <div className={props.allowCrossSpace ? `segment allow-cross-space ${props.side}` : `segment ${props.side}`}
      onMouseMove={ghostCursorPosition}
      onMouseOut={hideGhostCursor}
      onContextMenu={(evt) => evt.preventDefault()}
      onMouseUp={onMouseUp}
      ref={segmentEl}>
      <span className="segment-hover-cursor" ref={ghostCursorEl}></span>
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
  if (isEqual(nextProps.tokens, prevProps.tokens) && (nextProps.id === prevProps.id) && (nextProps.tool === prevProps.tool)) {
    return true;
  } else {
    return false;
  }
}

export default React.memo(Segment, SegmentIsEqual);
