import '../styles/segment-button.scss';

import {Button} from 'react-bootstrap';
import React from 'react';


export function AddOrRemoveBtn(props) {
  const addOrDeleteSegment = () => {
    props.onClick(props.id, props.side);
  };
  let className = 'btn-add-segment';
  className += props.type === 'add' ? ' add' : ' remove';
  return (
    <Button className={className} variant="light" onClick={addOrDeleteSegment}>{props.type === 'add' ? '+' : '-'}</Button>
  );
}
