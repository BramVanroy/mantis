import '../styles/segment.scss';

import React, {useState} from 'react';


export default function Segment(props) {
  const select = (evt) => {
    const selection = window.getSelection();
    const anchorNode = selection.anchorNode.nodeType === Node.TEXT_NODE ? selection.anchorNode.parentElement : selection.anchorNode;
    const focusNode = selection.focusNode.nodeType === Node.TEXT_NODE ? selection.focusNode.parentElement : selection.focusNode;

    let tokens = props.tokens.map((tok) => tok.split(''));
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
      // NOT WORKING YET
      // NEED TO ENSURE THAT WE CANNOT CROSS SPACE BOUNDARIES
      const reverse = tokenIdxs[1] < tokenIdxs[0]; // If a user selects from right to left, "anchor" is not the first token
      const startTokenIdx = reverse ? tokenIdxs[1] : tokenIdxs[0];
      const endTokenIdx = reverse ? tokenIdxs[0] : tokenIdxs[1];
      const startcharIdx = parseInt(reverse ? focusNode.getAttribute('char-id') : anchorNode.getAttribute('char-id'));
      const endcharIdx = parseInt(reverse ? anchorNode.getAttribute('char-id') : focusNode.getAttribute('char-id'));
    }

    tokens = tokens.map((token) => token.join(''));
    props.onCutSelect(props.id, props.side, tokens);
  };

  const findCutIndex = (evt) => {
    const target = evt.target;
    const targetIdx = [...Array.from(target.parentElement.children)].indexOf(target);
    const eventX = evt.clientX;
    const nextEl = target.nextElementSibling;
    const nextX = nextEl ? nextEl.getBoundingClientRect().left : null;
    const prevEl = target.previousElementSibling;
    const prevX = prevEl ? prevEl.getBoundingClientRect().right : null; // Right is distance from right corner to left viewport

    // If distance between event and previous element is smaller, then use current index
    // otherwise take the next index
    if (prevX !== null && ((nextX === null) || (eventX - prevX < nextX -eventX))) {
      return targetIdx;
    } else {
      return targetIdx+1;
    }
  };
  const cut = (evt) => {
    const target = evt.target;

    // Do not cut spaces
    if (target.classList.contains('is-space')) return false;

    // If this char is the only char in the token, do not update
    const isOnlyChar = evt.target.parentElement.children.length === 1;

    if (!isOnlyChar && target.classList.contains('char') && !target.classList.contains('is-space')) {
      const tokens = props.tokens;
      const tokenIdx = parseInt(target.parentElement.getAttribute('token-id'));
      let token = [...tokens[tokenIdx]];
      const cutIdx = findCutIndex(evt);
      let tokenEnd = token.splice(cutIdx);
      token = token.join('');
      tokenEnd = tokenEnd.join('');

      tokens.splice(tokenIdx, 1, token, tokenEnd);
      props.onCutSelect(props.id, props.side, tokens);
    }
  };

  const onMouseUp = (evt) => {
    // Only trigger for left/main button
    if (evt.button !== 0) return false;
    const selection = window.getSelection();

    // If nothing was selected (anchor and focus are the same node), do cut
    if (selection.isCollapsed) {
      cut(evt);
    } else {
      select(evt);
    }
  };


  return (
    <div className={`segment ${props.side}`}>
      <span className="segment-id">{`${props.id+1}.`}</span>
      {props.tokens.map(function(token, tokenId) {
        const isSpace = !token.trim().length;
        return (
          <span className={isSpace ? 'token is-space' : 'token'} key={tokenId} token-id={tokenId} onMouseUp={onMouseUp}>
            {
              [...token].map((char, charId) => {
                const isPunct = !!char.match(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]/);
                return <span className={isSpace ? 'char is-space' : (isPunct ? 'char is-punct' : 'char')} unselectable={isSpace ? 'on' : 'off'} key={charId} char-id={charId}>{char}</span>;
              })
            }
          </span>);
      })
      }
    </div>
  );
}
