import '../styles/segment.scss';

import React, {useRef} from 'react';


export default function Segment(props) {
  const ghostCursorEl = useRef(null);
  const segmentEl = useRef(null);

  const select = () => {
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
      const reverse = tokenIdxs[1] < tokenIdxs[0]; // If a user selects from right to left, "anchor" is not the first token
      const startTokenIdx = reverse ? tokenIdxs[1] : tokenIdxs[0];
      const endTokenIdx = reverse ? tokenIdxs[0] : tokenIdxs[1];
      const startcharIdx = parseInt(reverse ? focusNode.getAttribute('char-id') : anchorNode.getAttribute('char-id'));
      const endcharIdx = parseInt(reverse ? anchorNode.getAttribute('char-id') : focusNode.getAttribute('char-id'));

      let nSelectedTokens; let mergedTokens;
      if (props.allowCrossSpace) {
        // chunks only become chunks after splicing, which modifies in place and returns the spliced/deleted elements
        const firstChunk = tokens[startTokenIdx];
        const lastSelectedChunk = tokens[endTokenIdx];
        const firstSelectedChunk = firstChunk.splice(startcharIdx);
        const lastChunk = lastSelectedChunk.splice(endcharIdx+1);
        const internalSelected = tokens.slice(startTokenIdx+1, endTokenIdx); // Select internal tokens except first and last
        nSelectedTokens = 2 + internalSelected.length;
        mergedTokens = [firstChunk, [...firstSelectedChunk, ...internalSelected.flat(), ...lastSelectedChunk], lastChunk];
      } else {
        const firstChunk = tokens[startTokenIdx];
        const lastSelectedChunk = tokens[endTokenIdx];
        const firstSelectedChunk = firstChunk.splice(startcharIdx);
        const lastChunk = lastSelectedChunk.splice(endcharIdx+1);
        const internalSelected = tokens.slice(startTokenIdx+1, endTokenIdx); // Select internal tokens except first and last
        nSelectedTokens = 2 + internalSelected.length;
        mergedTokens = [firstChunk, [...firstSelectedChunk, ...internalSelected.flat(), ...lastSelectedChunk], lastChunk];
      }

      selection.removeAllRanges(); // remove selection
      tokens.splice(startTokenIdx, nSelectedTokens, ...mergedTokens);
    }

    // Remove non-string values, which are possible if we splice at the front/back of a token
    tokens = tokens.map((token) => token.join('')).filter(String);
    props.onCutSelect(props.id, props.side, tokens);
  };

  const findCutIndex = (evt) => {
    const target = evt.target;
    const siblings = [...Array.from(target.parentElement.children)];
    const targetIdx = siblings.indexOf(target);
    const isFirstChar = targetIdx === 0;
    const isLastChar = targetIdx === siblings.length-1;
    const eventX = evt.clientX;
    const charCenter = target.getBoundingClientRect().left + (target.getBoundingClientRect().width / 2);

    // For the first character, when the focus is on the first half, return 0 index and not -1
    // returns: cutIdx, isFirstChar, isLastChar, isFirstHalf
    if (eventX < charCenter) {
      return [Math.max(targetIdx-1, 0), isFirstChar, isLastChar, true];
    } else {
      return [targetIdx, isFirstChar, isLastChar, false];
    }
  };

  const cut = (evt) => {
    const target = evt.target;

    if (target.classList.contains('char')) {
      // If this char is the only char in the token, do not update
      const isOnlyChar = evt.target.parentElement.children.length === 1;
      if (isOnlyChar) return false;

      const tokens = props.tokens;
      const tokenIdx = parseInt(target.parentElement.getAttribute('token-id'));
      let token = [...tokens[tokenIdx]];
      const [cutIdx, isFirstChar, isLastChar, isFirstHalf] = findCutIndex(evt);

      // Do not do cuts on the first and last character if the cursor is on the outside
      if ((isFirstChar && isFirstHalf) || (isLastChar && !isFirstHalf)) return false;

      let tokenEnd = token.splice(cutIdx+1);
      token = token.join('');
      tokenEnd = tokenEnd.join('');

      tokens.splice(tokenIdx, 1, token, tokenEnd);
      props.onCutSelect(props.id, props.side, tokens);
    }
  };

  const onMouseUp = (evt) => {
    console.log('triggered');
    // Only trigger for left/main button
    if (evt.button !== 0) return false;
    const selection = window.getSelection();

    // If nothing was selected (anchor and focus are the same node), do cut
    if (selection.isCollapsed) {
      cut(evt);
    } else {
      select();
    }
  };

  // RETHINK isFirst isLast. isFirst is different from isLast because of the cursor position is always at the LEFT of the one we select.
  // so the cursor after the last item is a special case???

  const ghostCursorPosition = (evt) => {
    const target = evt.target;

    // evt.buttons === 0: no buttons currently pressed
    if (evt.buttons === 0 && target.classList.contains('char')) {
      // If this char is the only char in the token, do not update
      const isOnlyChar = evt.target.parentElement.children.length === 1;
      if (isOnlyChar) return false;

      // Find the index of the character closest to the cursor and then place the ghost cursor next to it
      const [hoverIdx, isFirstChar, isLastChar, isFirstHalf] = findCutIndex(evt);
      const relChar = target.parentElement.querySelector(`.char:nth-child(${hoverIdx+1})`);

      // Cannot use offSet here because offSet is relative to the parent, but we need to get offset relative
      // between character and segment (not relative to token)
      // The ghost cursor is drawn on the RIGHT of the selected index of `findCutIndex` EXCEPT if the real cursor is on the first half of the first character,
      // then the ghost is drawn on the left side
      const left = (isFirstChar && isFirstHalf ? relChar.getBoundingClientRect().left : relChar.getBoundingClientRect().right) - segmentEl.current.getBoundingClientRect().left;
      const top = target.getBoundingClientRect().top - segmentEl.current.getBoundingClientRect().top;
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
      {props.tokens.map(function(token, tokenId) {
        const tokenIsSpace = !token.trim().length;
        return (
          <span className={tokenIsSpace ? 'token is-space' : 'token'} key={tokenId} token-id={tokenId}>
            {
              [...token].map((char, charId) => {
                const charIsSpace = !char.trim().length;
                const isPunct = !!char.match(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-./:;<=>?@[\]^_`{|}~]/);
                return <span className={charIsSpace ? 'char is-space' : (isPunct ? 'char is-punct' : 'char')}
                  unselectable={charIsSpace && !props.allowCrossSpace ? 'on' : 'off'}
                  key={charId}
                  char-id={charId}
                  char-text={char}
                >{charIsSpace ? '●' : char}</span>;
              })
            }
          </span>);
      })
      }
    </div>
  );
}
